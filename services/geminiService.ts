import { GoogleGenAI, Tool } from "@google/genai";
import { SummarySource } from "../types";

interface GenerateResult {
  content: string;
  sources: SummarySource[];
}

export const generateDailyBriefing = async (
  apiKey: string,
  modelName: string,
  topics: string[]
): Promise<GenerateResult> => {
  if (!apiKey) throw new Error("API Key is missing.");

  const ai = new GoogleGenAI({ apiKey });

  // Construct a search-optimized prompt
  const topicString = topics.join(", ");
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const prompt = `
    Today is ${dateStr}.
    
    My interested topics are: ${topicString}.
    
    Please perform the following steps:
    1. Search for the latest and most important news regarding these topics from reliable sources published in the last 24 hours.
    2. Filter out trivial updates or rumors. Focus on high-impact events.
    3. Generate a comprehensive "Morning Briefing" summary in Markdown format.
    
    Structure the response as follows:
    # ☕ Morning Briefing: ${dateStr}
    
    ## [Topic Name]
    * **Headline**: A brief summary of the news.
    * *Context*: Why this matters.
    
    (Repeat for key topics found)
    
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
      model: modelName,
      contents: prompt,
      config: {
        tools: tools,
        systemInstruction: "You are a professional news analyst providing a concise, high-quality daily briefing.",
      }
    });

    const text = response.text || "No summary generated.";
    
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

    // Deduplicate sources
    const uniqueSources = Array.from(new Map(sources.map(s => [s.uri, s])).values());

    return {
      content: text,
      sources: uniqueSources
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate briefing.");
  }
};