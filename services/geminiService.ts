import { GoogleGenAI, Tool } from "@google/genai";
import { AppSettings, SummarySource, TokenUsage } from "../types";

interface GenerateResult {
  content: string;
  sources: SummarySource[];
  usage: TokenUsage;
  estimatedCost: number;
}

const calculateCost = (model: string, promptTokens: number, outputTokens: number): number => {
  // Approximate pricing per 1M tokens (Based on comparable 1.5 rates for estimation)
  // Flash: ~$0.075 Input / $0.30 Output
  // Pro:   ~$3.50 Input  / $10.50 Output
  const isFlash = model.toLowerCase().includes('flash');
  
  const priceInputPerMillion = isFlash ? 0.075 : 3.50;
  const priceOutputPerMillion = isFlash ? 0.30 : 10.50;

  const inputCost = (promptTokens / 1_000_000) * priceInputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * priceOutputPerMillion;

  return inputCost + outputCost;
};

export const generateDailyBriefing = async (
  settings: AppSettings
): Promise<GenerateResult> => {
  if (!settings.apiKey) throw new Error("API Key is missing.");

  const ai = new GoogleGenAI({ apiKey: settings.apiKey });

  // Construct prompt components
  const topicString = settings.topics.join(", ");
  
  // Calculate dates for freshness enforcement
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  // Format YYYY-MM-DD for search operators
  const yesterdayIso = yesterday.toISOString().split('T')[0];
  
  let lengthInstruction = "";
  switch(settings.summaryLength) {
    case 'short': lengthInstruction = "Keep each news item very concise, maximum 2-3 sentences per story."; break;
    case 'long': lengthInstruction = "Provide detailed analysis for each news item, including background context and potential future implications. Aim for 200 words per story."; break;
    case 'medium': default: lengthInstruction = "Provide a balanced summary, about 1 paragraph per story."; break;
  }

  const domainInstruction = settings.preferredDomains.length > 0 
    ? `Strictly prioritize information from these specific websites: ${settings.preferredDomains.join(', ')}. If important news is not found on these sites, you may look elsewhere but mention the source explicitly.` 
    : "Search from diverse, reliable global news sources.";

  const prompt = `
    Today is ${dateStr}.
    
    My interested topics are: ${topicString}.
    Target Language: ${settings.language}
    
    Instructions:
    1. Search for the latest and most important news regarding these topics.
    2. **STRICT FRESHNESS ENFORCEMENT**: 
       - You must ONLY include news published **after ${yesterdayIso}** (last 24 hours).
       - When generating search queries, use time-based operators (e.g., "when:1d", "after:${yesterdayIso}") to filter results.
       - explicitly verify the date of every search result. Discard anything older than 24 hours.
    3. ${domainInstruction}
    4. Filter out trivial updates. Focus on high-impact events.
    5. ${lengthInstruction}
    6. Generate the response strictly in ${settings.language}.
    7. **CITATION REQUIREMENT**: For every single news item, you MUST include a direct Markdown link to the source article inline. Format: [Source Name](URL