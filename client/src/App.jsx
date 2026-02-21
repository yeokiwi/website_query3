import UrlForm from './components/UrlForm.jsx';
import ResultsPanel from './components/ResultsPanel.jsx';
import { useSSEStream } from './hooks/useSSEStream.js';

export default function App() {
  const { toolCalls, textChunks, isStreaming, error, startStream, stopStream } = useSSEStream();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-base/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal/10 border border-teal/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-100">Website Change Monitor</h1>
              <p className="text-xs text-gray-500">AI-powered website change detection</p>
            </div>
          </div>
          {isStreaming && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal animate-pulse-slow" />
              <span className="text-xs text-teal font-mono">ANALYZING</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
        {/* URL Input */}
        <div className="mb-8">
          <UrlForm onSubmit={startStream} onStop={stopStream} isStreaming={isStreaming} />
        </div>

        {/* Results */}
        <div className="bg-base-light border border-gray-800 rounded-xl p-6 min-h-[400px]">
          <ResultsPanel
            toolCalls={toolCalls}
            textChunks={textChunks}
            isStreaming={isStreaming}
            error={error}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-4">
        <div className="max-w-5xl mx-auto px-6 text-center text-xs text-gray-600">
          Powered by Claude &middot; Brave Search
        </div>
      </footer>
    </div>
  );
}
