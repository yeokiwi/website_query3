import { useState, useCallback, useRef } from 'react';

export function useSSEStream() {
  const [toolCalls, setToolCalls] = useState([]);
  const [textChunks, setTextChunks] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const startStream = useCallback(async (url) => {
    // Abort previous stream
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setToolCalls([]);
    setTextChunks('');
    setError(null);
    setIsStreaming(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || `Server error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          let parsed;
          try {
            parsed = JSON.parse(trimmed.slice(6));
          } catch {
            continue;
          }

          switch (parsed.type) {
            case 'tool_start':
              setToolCalls((prev) => [
                ...prev,
                {
                  id: Date.now(),
                  tool: parsed.tool,
                  input: parsed.input,
                  status: 'running',
                  timestamp: new Date().toLocaleTimeString(),
                },
              ]);
              break;

            case 'tool_end':
              setToolCalls((prev) => {
                const updated = [...prev];
                for (let i = updated.length - 1; i >= 0; i--) {
                  if (updated[i].tool === parsed.tool && updated[i].status === 'running') {
                    updated[i] = { ...updated[i], status: 'done', result_summary: parsed.result_summary };
                    break;
                  }
                }
                return updated;
              });
              break;

            case 'text_delta':
              setTextChunks((prev) => prev + parsed.delta);
              break;

            case 'done':
              setIsStreaming(false);
              return;

            case 'error':
              setError(parsed.message);
              setIsStreaming(false);
              return;
          }
        }
      }

      setIsStreaming(false);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message);
      setIsStreaming(false);
    }
  }, []);

  const stopStream = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  return { toolCalls, textChunks, isStreaming, error, startStream, stopStream };
}
