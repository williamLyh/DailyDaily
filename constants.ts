import { AppSettings } from './types';

export const DEFAULT_TOPICS = [
  "Artificial Intelligence",
  "Global Economy",
  "Technology Startups",
  "Climate Change",
  "Space Exploration"
];

export const AVAILABLE_TOPICS = [
  "Artificial Intelligence",
  "Machine Learning",
  "Global Economy",
  "Stock Market",
  "Cryptocurrency",
  "Technology Startups",
  "Cybersecurity",
  "Climate Change",
  "Renewable Energy",
  "Space Exploration",
  "Biotechnology",
  "Geopolitics",
  "Sports",
  "Entertainment",
  "Health & Wellness"
];

export const AVAILABLE_MODELS = [
  { value: "gemini-3-flash-preview", label: "Gemini 3 Flash (Fastest)" },
  { value: "gemini-3-pro-preview", label: "Gemini 3 Pro (Best Reasoning)" },
];

export const AVAILABLE_LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Chinese (Simplified)",
  "Japanese",
  "Korean",
  "Portuguese",
  "Italian",
  "Hindi"
];

export const SUMMARY_LENGTH_OPTIONS = [
  { value: 'short', label: 'Short (Brief bullet points)' },
  { value: 'medium', label: 'Medium (Standard paragraphs)' },
  { value: 'long', label: 'Long (Detailed analysis)' }
];

export const SUGGESTED_DOMAINS = [
  "reuters.com", "apnews.com", "bloomberg.com", "bbc.com", 
  "cnn.com", "techcrunch.com", "nytimes.com", "wsj.com",
  "aljazeera.com", "npr.org", "science.org", "nature.com"
];

export const DEFAULT_SETTINGS: AppSettings = {
  apiKey: "", // User must provide
  model: "gemini-3-flash-preview",
  scheduledTime: "08:00",
  topics: [...DEFAULT_TOPICS],
  autoDownload: true,
  preferredDomains: [], // Empty means search all
  summaryLength: 'medium',
  language: 'English'
};

export const LOCAL_STORAGE_KEY_SETTINGS = "morning_brief_settings";
export const LOCAL_STORAGE_KEY_HISTORY = "morning_brief_history";
export const LOCAL_STORAGE_KEY_LAST_RUN = "morning_brief_last_run";