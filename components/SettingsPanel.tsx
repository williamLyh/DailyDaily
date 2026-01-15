import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { AVAILABLE_TOPICS, AVAILABLE_MODELS } from '../constants';

interface SettingsPanelProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSave, isOpen, onClose }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [newTopic, setNewTopic] = useState("");

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
              <p className="text-xs text-slate-500 mt-1">App must be open to run.</p>
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
          </div>

           {/* Auto Download */}
           <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="autoDownload"
                checked={localSettings.autoDownload}
                onChange={(e) => setLocalSettings({...localSettings, autoDownload: e.target.checked})}
                className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
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