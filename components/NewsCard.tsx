import React from 'react';
import ReactMarkdown from 'react-markdown';
import { DailySummary } from '../types';

interface NewsCardProps {
  summary: DailySummary;
}

export const NewsCard: React.FC<NewsCardProps> = ({ summary }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Briefing Report</h2>
          <p className="text-sm text-slate-500">{summary.date}</p>
        </div>
        <div className="flex gap-2">
           {/* Actions handled by parent usually, but could be here */}
        </div>
      </div>

      {/* Markdown Content */}
      <div className="p-8 prose prose-slate max-w-none prose-headings:text-slate-800 prose-a:text-blue-600 hover:prose-a:text-blue-800 prose-strong:text-slate-900">
        <ReactMarkdown>{summary.content}</ReactMarkdown>
      </div>

      {/* Sources Footer */}
      {summary.sources && summary.sources.length > 0 && (
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Referenced Sources
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {summary.sources.map((source, idx) => (
              <a
                key={idx}
                href={source.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors group p-2 rounded-lg hover:bg-slate-100"
              >
                <i className="fa-solid fa-external-link-alt mt-1 text-xs opacity-50 group-hover:opacity-100"></i>
                <span className="truncate">{source.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};