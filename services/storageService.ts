import { DailySummary, AppSettings } from "../types";
import { LOCAL_STORAGE_KEY_HISTORY, LOCAL_STORAGE_KEY_SETTINGS, LOCAL_STORAGE_KEY_LAST_RUN, DEFAULT_SETTINGS } from "../constants";

export const getStoredSettings = (): AppSettings => {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY_SETTINGS);
  return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
};

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem(LOCAL_STORAGE_KEY_SETTINGS, JSON.stringify(settings));
};

export const getHistory = (): DailySummary[] => {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY_HISTORY);
  return saved ? JSON.parse(saved) : [];
};

export const saveSummary = (summary: DailySummary) => {
  const history = getHistory();
  // Prepend new summary
  const updated = [summary, ...history].slice(0, 50); // Keep last 50
  localStorage.setItem(LOCAL_STORAGE_KEY_HISTORY, JSON.stringify(updated));
};

export const getLastRunDate = (): string | null => {
  return localStorage.getItem(LOCAL_STORAGE_KEY_LAST_RUN);
};

export const setLastRunDate = (dateStr: string) => {
  localStorage.setItem(LOCAL_STORAGE_KEY_LAST_RUN, dateStr);
};

export const downloadSummaryAsFile = (summary: DailySummary) => {
  const filename = `MorningBrief_${summary.date.replace(/\//g, '-')}_${summary.id.substring(0,6)}.md`;
  const blob = new Blob([summary.content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};