import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AppSettings, DailySummary, AppStatus, LogEntry } from './types';
import { 
  getStoredSettings, 
  saveSettings, 
  getHistory, 
  saveSummary, 
  getLastRunDate, 
  setLastRunDate,
  downloadSummaryAsFile
} from './services/storageService';
import { generateDailyBriefing } from './services/geminiService';
import { SettingsPanel } from './components/SettingsPanel';
import { NewsCard } from './components/NewsCard';

const App: React.FC = () => {
  // State
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings());
  const [history, setHistory] = useState<DailySummary[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<DailySummary | null>(null);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [timeUntilRun, setTimeUntilRun] = useState<string>("");

  // Refs for scheduler to avoid dependency loops
  const settingsRef = useRef(settings);
  
  // Initial Load
  useEffect(() => {
    const loadedHistory = getHistory();
    setHistory(loadedHistory);
    if (loadedHistory.length > 0) {
      setSelectedSummary(loadedHistory[0]);
    }
  }, []);

  // Update ref when settings change
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setLogs(prev => [{ timestamp: Date.now(), message, type }, ...prev].slice(0, 10));
  };

  const runBriefing = useCallback(async () => {
    if (status === AppStatus.SEARCHING || status === AppStatus.SUMMARIZING) return;
    
    const currentSettings = settingsRef.current;

    if (!currentSettings.apiKey) {
      addLog("Missing API Key. Please configure settings.", "error");
      setIsSettingsOpen(true);
      return;
    }

    setStatus(AppStatus.SEARCHING);
    addLog("Starting daily search cycle...", "info");

    try {
      const result = await generateDailyBriefing(
        currentSettings.apiKey,
        currentSettings.model,
        currentSettings.topics
      );

      setStatus(AppStatus.SUMMARIZING); // Transition state logically, though 'generate' does both
      
      const newSummary: DailySummary = {
        id: uuidv4(),
        date: new Date().toLocaleDateString(),
        content: result.content,
        sources: result.sources,
        timestamp: Date.now()
      };

      // Save logic
      saveSummary(newSummary);
      setLastRunDate(new Date().toLocaleDateString());
      
      // Update UI
      setHistory(prev => [newSummary, ...prev]);
      setSelectedSummary(newSummary);
      setStatus(AppStatus.COMPLETED);
      addLog("Briefing generated successfully.", "success");

      // Auto Download
      if (currentSettings.autoDownload) {
        addLog("Downloading summary file...", "info");
        downloadSummaryAsFile(newSummary);
      }

      // Reset status after a moment
      setTimeout(() => setStatus(AppStatus.IDLE), 3000);

    } catch (error: any) {
      console.error(error);
      setStatus(AppStatus.ERROR);
      addLog(`Error: ${error.message}`, "error");
    }
  }, [status]); // Only depend on status to prevent re-creation

  // Scheduler Effect
  useEffect(() => {
    const checkSchedule = () => {
      const now = new Date();
      const currentSettings = settingsRef.current;
      
      const [schedHour, schedMinute] = currentSettings.scheduledTime.split(':').map(Number);
      const scheduledDate = new Date();
      scheduledDate.setHours(schedHour, schedMinute, 0, 0);

      // Calculate time until next run
      let diff = scheduledDate.getTime() - now.getTime();
      if (diff < 0) {
        // Schedule is for tomorrow
        diff += 86400000; 
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeUntilRun(`${hours}h ${minutes}m`);

      // Check if we should run now
      // Logic: If current time matches scheduled time (+/- 1 min buffer) AND we haven't run today
      const lastRun = getLastRunDate();
      const todayStr = now.toLocaleDateString();

      const isTime = now.getHours() === schedHour && now.getMinutes() === schedMinute;
      
      if (isTime && lastRun !== todayStr && status === AppStatus.IDLE) {
        runBriefing();
      }
    };

    const intervalId = setInterval(checkSchedule, 10000); // Check every 10 seconds
    checkSchedule(); // Initial check

    return () => clearInterval(intervalId);
  }, [runBriefing, status]);

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    addLog("Settings updated.", "info");
  };

  const handleDeleteHistory = () => {
    if(confirm("Clear all history?")) {
        localStorage.removeItem('morning_brief_history');
        localStorage.removeItem('morning_brief_last_run');
        setHistory([]);
        setSelectedSummary(null);
        addLog("History cleared.", "info");
    }
  };

  return (
    <div className="flex h-screen bg-slate-100">
      
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 text-blue-600 mb-1">
            <i className="fa-solid fa-robot text-2xl"></i>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Morning Brief AI</h1>
          </div>
          <p className="text-xs text-slate-500 pl-1">Daily Automated Intelligence</p>
        </div>

        {/* Status / Timer */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Next Run</span>
            <span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
              {timeUntilRun || "--"}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Status</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1
              ${status === AppStatus.IDLE ? 'text-slate-500' : 
                status === AppStatus.ERROR ? 'text-red-600 bg-red-100' : 
                'text-green-600 bg-green-100 animate-pulse'}`}>
              {status === AppStatus.IDLE && <i className="fa-regular fa-clock"></i>}
              {status === AppStatus.SEARCHING && <i className="fa-solid fa-search fa-spin"></i>}
              {status === AppStatus.SUMMARIZING && <i className="fa-solid fa-brain fa-spin"></i>}
              {status}
            </span>
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">History</h3>
            {history.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No summaries yet.</p>
            ) : (
              <div className="space-y-2">
                {history.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedSummary(item)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                      selectedSummary?.id === item.id
                        ? 'bg-blue-50 border-blue-200 shadow-sm'
                        : 'bg-white border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-sm font-semibold ${selectedSummary?.id === item.id ? 'text-blue-700' : 'text-slate-700'}`}>
                        {item.date}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">
                      {item.content.replace(/[#*]/g, '').substring(0, 40)}...
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <i className="fa-solid fa-gear"></i> Settings
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Mobile Header */}
        <div className="md:hidden bg-white p-4 border-b border-slate-200 flex justify-between items-center">
            <h1 className="font-bold text-slate-800">Morning Brief AI</h1>
            <button onClick={() => setIsSettingsOpen(true)} className="text-slate-600">
                <i className="fa-solid fa-gear"></i>
            </button>
        </div>

        {/* Toolbar */}
        <div className="bg-white/80 backdrop-blur border-b border-slate-200 px-8 py-4 flex justify-between items-center z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
               {selectedSummary ? selectedSummary.date : 'Dashboard'}
            </h2>
            <p className="text-sm text-slate-500">
              {status === AppStatus.IDLE ? 'Ready for next scheduled run.' : 'Processing...'}
            </p>
          </div>
          <div className="flex gap-3">
             {selectedSummary && (
               <button 
                onClick={() => downloadSummaryAsFile(selectedSummary)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
               >
                 <i className="fa-solid fa-download"></i> Download
               </button>
             )}
             <button
               onClick={runBriefing}
               disabled={status !== AppStatus.IDLE}
               className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-all ${
                 status !== AppStatus.IDLE ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
               }`}
             >
               {status === AppStatus.IDLE ? (
                 <><i className="fa-solid fa-play"></i> Run Now</>
               ) : (
                 <><i className="fa-solid fa-circle-notch fa-spin"></i> Running...</>
               )}
             </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
           {settings.apiKey === "" && history.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl mb-6">
                  <i className="fa-solid fa-key"></i>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Setup Required</h3>
                <p className="text-slate-600 mb-6">
                  To start generating daily briefings, please configure your Gemini API key and preferred topics in the settings.
                </p>
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Open Settings
                </button>
             </div>
           ) : selectedSummary ? (
             <div className="max-w-4xl mx-auto pb-10">
               <NewsCard summary={selectedSummary} />
             </div>
           ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <i className="fa-regular fa-newspaper text-6xl text-slate-200 mb-4"></i>
              <p className="text-slate-400">Select a history item or run a new briefing.</p>
            </div>
           )}
        </div>

        {/* Log Toast (Bottom Right) */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-2 pointer-events-none">
          {logs.map((log) => (
            <div 
              key={log.timestamp} 
              className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium backdrop-blur-md animate-fade-in-up flex items-center gap-3
                ${log.type === 'error' ? 'bg-red-500/90 text-white' : 
                  log.type === 'success' ? 'bg-green-500/90 text-white' : 
                  'bg-slate-800/90 text-white'}`}
            >
               {log.type === 'error' && <i className="fa-solid fa-triangle-exclamation"></i>}
               {log.type === 'success' && <i className="fa-solid fa-check-circle"></i>}
               {log.type === 'info' && <i className="fa-solid fa-info-circle"></i>}
               {log.message}
            </div>
          ))}
        </div>

      </main>

      <SettingsPanel 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
};

export default App;