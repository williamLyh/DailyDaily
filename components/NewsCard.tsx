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
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:justify-between md:items-center gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Briefing Report</h2>
          <p className="text-sm text-slate-500">{summary.date}</p>
        </div>
        
        {/* Cost & Usage Badge */}
        {summary.estimatedCost !== undefined && (
          <div className="flex items-center gap-3 text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
             <div className="flex flex-col items-end">
                <span className="font-bold text-emerald-600">
                  ${summary.estimatedCost.toFixed(4)}
                </span>
                <span className="text-slate-400 font-medium">Est. Cost</span>
             </div>
             <div className="w-px h-6 bg-slate-100"></div>
             <div className="flex flex-col items-start text-slate-500">
                <span>{summary.usage?.totalTokens.toLocaleString()} tokens</span>
                <span className="text-[10px] text-slate-400">Total Usage</span>
             </div>
          </div>
        )}
      </div>

      {/* Markdown Content */}
      <div className="p-8 prose prose-slate max-w-none prose-headings:text-slate-800 prose-a:text-blue-600 hover:prose-a:text-blue-800 prose-strong:text-slate-900">
        <ReactMarkdown 
          components={{
            a: ({node, ...props}) => (
              <a {...props} target="_blank" rel="noopener noreferrer" />
            )
          }}
        >
          {summary.content}
        </ReactMarkdown>
      </div>

      {/* Sources Footer */}
      {summary.sources && summary.sources.length > 0 && (
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            All Referenced Sources
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