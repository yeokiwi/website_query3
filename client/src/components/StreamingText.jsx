import ReactMarkdown from 'react-markdown';

export default function StreamingText({ text, isStreaming }) {
  if (!text) return null;

  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <ReactMarkdown
        components={{
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-teal mt-8 mb-3 pb-2 border-b border-gray-800">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-medium text-gray-200 mt-6 mb-2">{children}</h3>
          ),
          p: ({ children }) => <p className="text-gray-300 leading-relaxed mb-3">{children}</p>,
          li: ({ children }) => (
            <li className="text-gray-300 leading-relaxed mb-1.5">{children}</li>
          ),
          ul: ({ children }) => <ul className="space-y-1 mb-4 list-disc list-inside">{children}</ul>,
          ol: ({ children }) => (
            <ol className="space-y-1 mb-4 list-decimal list-inside">{children}</ol>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal hover:text-teal-dark underline underline-offset-2"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="border-gray-800 my-6" />,
          strong: ({ children }) => <strong className="text-gray-100 font-semibold">{children}</strong>,
          code: ({ children }) => (
            <code className="bg-base-lighter px-1.5 py-0.5 rounded text-teal text-xs font-mono">
              {children}
            </code>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-2 h-4 bg-teal animate-cursor-blink ml-0.5 align-text-bottom" />
      )}
    </div>
  );
}
