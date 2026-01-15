export interface AppSettings {
  apiKey: string;
  model: string;
  scheduledTime: string; // Format "HH:mm" 24h
  topics: string[];
  autoDownload: boolean;
}

export interface SummarySource {
  title: string;
  uri: string;
}

export interface DailySummary {
  id: string;
  date: string; // ISO String
  content: string; // Markdown content
  sources: SummarySource[];
  timestamp: number;
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