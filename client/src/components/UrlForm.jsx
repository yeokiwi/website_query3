import { useState } from 'react';

export default function UrlForm({ onSubmit, onStop, isStreaming }) {
  const [url, setUrl] = useState('');
  const [validationError, setValidationError] = useState('');

  function validate(value) {
    if (!value.trim()) return 'Please enter a URL';
    try {
      const parsed = new URL(value);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return 'URL must start with http:// or https://';
      }
    } catch {
      return 'Please enter a valid URL';
    }
    return '';
  }

  function handleSubmit(e) {
    e.preventDefault();
    const err = validate(url);
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError('');
    onSubmit(url);
  }

  function handleReset() {
    setUrl('');
    setValidationError('');
    if (isStreaming) onStop();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (validationError) setValidationError('');
            }}
            placeholder="https://example.com"
            disabled={isStreaming}
            className={`w-full px-4 py-3 bg-base-lighter border rounded-lg text-gray-200 placeholder-gray-600 font-mono text-sm
              focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal/50
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all ${
                validationError ? 'border-red-500/50' : 'border-gray-700 hover:border-gray-600'
              }`}
          />
          {validationError && (
            <p className="absolute -bottom-5 left-0 text-red-400 text-xs">{validationError}</p>
          )}
        </div>

        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="px-6 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg font-medium text-sm
              hover:bg-red-500/30 transition-colors shrink-0"
          >
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-red-400" />
              Stop
            </span>
          </button>
        ) : (
          <button
            type="submit"
            className="px-6 py-3 bg-teal/10 text-teal border border-teal/30 rounded-lg font-medium text-sm
              hover:bg-teal/20 hover:border-teal/50 transition-colors shrink-0
              active:scale-95"
          >
            Analyze Changes
          </button>
        )}

        {(url || isStreaming) && !isStreaming && (
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-3 text-gray-500 hover:text-gray-300 transition-colors shrink-0 text-sm"
          >
            Clear
          </button>
        )}
      </div>
    </form>
  );
}
