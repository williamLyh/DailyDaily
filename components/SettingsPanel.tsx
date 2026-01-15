import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { AVAILABLE_TOPICS, AVAILABLE_MODELS, AVAILABLE_LANGUAGES, SUMMARY_LENGTH_OPTIONS, SUGGESTED_DOMAINS } from '../constants';

interface SettingsPanelProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSave, isOpen, onClose }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [newTopic, setNewTopic] = useState("");
  const [newDomain, setNewDomain] = useState("");

  // Sync when panel opens
  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
    }
  }, [isOpen, settings]);

  const handleToggleTopic = (topic: string) => {
    setLocalSettings(prev => {
      const exists = prev.topics.includes(topic);
      if (exists) {
        return { ...prev, topics: prev.topics.filter(t => t !== topic) };
      } else {
        return { ...prev, topics: [...prev.topics, topic] };
      }
    });
  };

  const handleAddCustomTopic = () => {
    if (newTopic.trim() && !localSettings.topics.includes(newTopic.trim())) {
      setLocalSettings(prev => ({ ...prev, topics: [...prev.topics, newTopic.trim()] }));
      setNewTopic("");
    }
  };

  const handleAddDomain = (domainOverride?: string) => {
    const domainToAdd = domainOverride || newDomain;
    if (domainToAdd.trim() && !localSettings.preferredDomains.includes(domainToAdd.trim())) {
      setLocalSettings(prev => ({ ...prev, preferredDomains: [...prev.preferredDomains, domainToAdd.trim()] }));
      if (!domainOverride) setNewDomain("");
    }
  };

  const removeDomain = (domain: string) => {
    setLocalSettings(prev => ({ ...prev, preferredDomains: prev.preferredDomains.filter(d => d !== domain) }));
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <i className="fa-solid fa-cog text-slate-500"></i> Settings
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* API Key */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Gemini API Key <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={localSettings.apiKey}
              onChange={(e) => setLocalSettings({ ...localSettings, apiKey: e.target.value })}
              placeholder="Enter your Google GenAI API Key"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
            <p className="text-xs text-slate-500 mt-1">
              Required to fetch and summarize news. stored locally.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Schedule */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Daily Run Time
              </label>
              <input
                type="time"
                value={localSettings.scheduledTime}
                onChange={(e) => setLocalSettings({ ...localSettings, scheduledTime: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                AI Model
              </label>
              <select
                value={localSettings.model}
                onChange={(e) => setLocalSettings({ ...localSettings, model: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                {AVAILABLE_MODELS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Language
              </label>
              <select
                value={localSettings.language}
                onChange={(e) => setLocalSettings({ ...localSettings, language: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                {AVAILABLE_LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            {/* Length */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Summary Length
              </label>
              <select
                value={localSettings.summaryLength}
                onChange={(e) => setLocalSettings({ ...localSettings, summaryLength: e.target.value as any })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                {SUMMARY_LENGTH_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Preferred Sources */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Search Sources
            </label>
            
            {/* Active List */}
            <div className="mb-4 bg-white p-3 rounded-lg border border-slate-200 min-h-[50px]">
              {localSettings.preferredDomains.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                   {localSettings.preferredDomains.map(domain => (
                     <span key={domain} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-sm font-medium">
                        {domain}
                        <button onClick={() => removeDomain(domain)} className="text-blue-400 hover:text-red-500 transition-colors">
                          <i className="fa-solid fa-times text-xs"></i>
                        </button>
                     </span>
                   ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-slate-400 italic gap-2 py-1">
                  <i className="fa-solid fa-earth-americas"></i>
                  Model will search all reliable global sources
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="Add specific website (e.g., bbc.com)"
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
              />
              <button
                onClick={() => handleAddDomain()}
                className="px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-900 transition-colors"
              >
                Add
              </button>
            </div>

            {/* Quick Add */}
            <div>
               <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Suggested</p>
               <div className="flex flex-wrap gap-2">
                 {SUGGESTED_DOMAINS.filter(d => !localSettings.preferredDomains.includes(d)).map(d => (
                   <button 
                     key={d} 
                     onClick={() => handleAddDomain(d)}
                     className="text-xs px-2 py-1 bg-white hover:bg-slate-100 text-slate-600 rounded border border-slate-300 transition-colors"
                   >
                     + {d}
                   </button>
                 ))}
               </div>
            </div>
          </div>

           {/* Auto Download */}
           <div className="flex items-center gap-3 pl-1">
              <input 
                type="checkbox" 
                id="autoDownload"
                checked={localSettings.autoDownload}
                onChange={(e) => setLocalSettings({...localSettings, autoDownload: e.target.checked})}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="autoDownload" className="text-sm font-medium text-slate-700 select-none">
                Automatically download summary file when generated
              </label>
           </div>

          {/* Topics */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Interests & Topics
            </label>
            <div className="flex flex-wrap gap-2 mb-4">
              {AVAILABLE_TOPICS.map(topic => (
                <button
                  key={topic}
                  onClick={() => handleToggleTopic(topic)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    localSettings.topics.includes(topic)
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {localSettings.topics.includes(topic) && <i className="fa-solid fa-check mr-1.5 text-xs"></i>}
                  {topic}
                </button>
              ))}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="Add custom topic..."
                className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTopic()}
              />
              <button
                onClick={handleAddCustomTopic}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!localSettings.apiKey}
            className={`px-6 py-2.5 text-white font-medium rounded-lg shadow-md transition-all ${
              !localSettings.apiKey 
                ? 'bg-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
            }`}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};