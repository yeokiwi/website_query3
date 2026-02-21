import ToolCallLog from './ToolCallLog.jsx';
import StreamingText from './StreamingText.jsx';

export default function ResultsPanel({ toolCalls, textChunks, isStreaming, error }) {
  const hasContent = toolCalls.length > 0 || textChunks || error;

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 mb-6 rounded-full bg-teal-glow border border-teal/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-300 mb-2">Detect Website Changes</h3>
        <p className="text-sm text-gray-500 max-w-md mb-6">
          Enter any URL above and our AI agent will search the web, fetch pages, and analyze what
          has changed in the last 30 days.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {['https://openai.com', 'https://stripe.com', 'https://github.com'].map((example) => (
            <span
              key={example}
              className="px-3 py-1.5 rounded-full bg-base-lighter border border-gray-800 text-xs text-gray-500 font-mono"
            >
              {example}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-400 shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-red-400 text-sm font-medium">Analysis Error</p>
              <p className="text-red-400/80 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      <ToolCallLog toolCalls={toolCalls} />

      {isStreaming && !textChunks && toolCalls.length > 0 && (
        <div className="flex items-center gap-3 py-4">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-teal animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-teal animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm text-gray-500">Agent is researching...</span>
        </div>
      )}

      <StreamingText text={textChunks} isStreaming={isStreaming} />
    </div>
  );
}
