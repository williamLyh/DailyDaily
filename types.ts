export interface AppSettings {
  apiKey: string;
  model: string;
  scheduledTime: string; // Format "HH:mm" 24h
  topics: string[];
  autoDownload: boolean;
  preferredDomains: string[];
  summaryLength: 'short' | 'medium' | 'long';
  language: string;
}

export interface SummarySource {
  title: string;
  uri: string;
}

export interface TokenUsage {
  promptTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface DailySummary {
  id: string;
  date: string; // ISO String
  content: string; // Markdown content
  sources: SummarySource[];
  timestamp: number;
  usage?: TokenUsage;
  estimatedCost?: number;
}

export enum AppStatus {
  IDLE = 'IDLE',
  SEARCHING = 'SEARCHING',
  SUMMARIZING = 'SUMMARIZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface LogEntry {
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'error';
}