import { useState } from 'react';

export default function ToolCallLog({ toolCalls }) {
  const [collapsed, setCollapsed] = useState(false);

  if (toolCalls.length === 0) return null;

  return (
    <div className="mb-6">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-teal transition-colors mb-3"
      >
        <svg
          className={`w-4 h-4 transition-transform ${collapsed ? '' : 'rotate-90'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Agent Activity
        <span className="text-xs text-gray-500">({toolCalls.length} calls)</span>
      </button>

      {!collapsed && (
        <div className="space-y-1.5 font-mono text-xs">
          {toolCalls.map((call) => (
            <div
              key={call.id}
              className={`flex items-start gap-2 px-3 py-2 rounded-md transition-all ${
                call.status === 'running'
                  ? 'bg-teal-glow border border-teal/20'
                  : 'bg-base-lighter/30 border border-transparent opacity-70'
              }`}
            >
              <span className="shrink-0">
                {call.tool === 'web_search' ? (
                  <span title="Web Search">&#128269;</span>
                ) : (
                  <span title="Fetch URL">&#127760;</span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <span className="text-gray-300">
                  {call.tool === 'web_search'
                    ? `Searching: "${call.input.query}"`
                    : `Fetching: "${call.input.url}"`}
                </span>
                {call.status === 'done' && call.result_summary && (
                  <span className="text-gray-500 ml-2">— {call.result_summary}</span>
                )}
              </div>
              <span className="text-gray-600 shrink-0">{call.timestamp}</span>
              {call.status === 'running' && (
                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-teal animate-pulse-slow mt-1.5" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
