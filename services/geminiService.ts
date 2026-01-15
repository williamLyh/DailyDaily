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

  // Calculate Dates
  const now = new Date();
  const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000));
  
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const yesterdayStr = yesterday.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Construct prompt components
  const topicString = settings.topics.join(", ");
  
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
    Current Date: ${dateStr}
    Strict Search Window: News published AFTER ${yesterdayStr}.
    
    My interested topics are: ${topicString}.
    Target Language: ${settings.language}
    
    Instructions:
    1. Search for the latest and most important news regarding these topics.
    2. **CRITICAL TIME CONSTRAINT**: You must ONLY include news that occurred or was published in the last 24 hours (since ${yesterdayStr}). Verify the date of every article. discard anything older.
    3. ${domainInstruction}
    4. Filter out trivial updates. Focus on high-impact events.
    5. ${lengthInstruction}
    6. Generate the response strictly in ${settings.language}.
    7. **CITATION REQUIREMENT**: For every single news item, you MUST include a direct Markdown link to the source article inline. Format: [Source Name](URL).
    8. **MULTIPLE STORIES**: For each topic, include ALL distinct, important news stories found. Do not limit yourself to one story per topic. If a topic has 5 significant different events, list all 5 as separate entries.

    Structure the response as follows (in ${settings.language}):
    # ☕ Morning Briefing: ${dateStr}
    
    ## [Topic Name]
    ### [Headline of Story 1]
    * [Content]
    * 🔗 Source: [Source Name](URL)

    ### [Headline of Story 2] (if applicable)
    * [Content]
    * 🔗 Source: [Source Name](URL)
    
    (Repeat for other stories...)
    
    ## 📉 Market / Global Snapshot (if relevant)
    
    ## 💡 Daily Insight
    A one-sentence takeaway for the day.
  `;

  // Configure tools for search
  const tools: Tool[] = [
    { googleSearch: {} }
  ];

  try {
    const response = await ai.models.generateContent({
      model: settings.model,
      contents: prompt,
      config: {
        tools: tools,
        systemInstruction: `You are a professional news analyst providing a daily briefing in ${settings.language}.`,
      }
    });

    const text = response.text || "No summary generated.";
    
    // Extract Metadata
    const usage = response.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 };
    const promptTokens = usage.promptTokenCount || 0;
    const outputTokens = usage.candidatesTokenCount || 0;
    
    // Calculate Cost
    const cost = calculateCost(settings.model, promptTokens, outputTokens);

    // Extract sources from grounding metadata
    const sources: SummarySource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    chunks.forEach((chunk: any) => {
      if (chunk.web?.uri && chunk.web?.title) {
        sources.push({
          title: chunk.web.title,
          uri: chunk.web.uri
        });
      }
    });

    const uniqueSources = Array.from(new Map(sources.map(s => [s.uri, s])).values());

    return {
      content: text,
      sources: uniqueSources,
      usage: {
        promptTokens,
        outputTokens,
        totalTokens: usage.totalTokenCount || 0
      },
      estimatedCost: cost
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate briefing.");
  }
};