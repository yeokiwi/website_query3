import { Router } from 'express';
import { runAgent } from '../services/llmAgent.js';

const router = Router();

// Simple in-memory rate limiter: max 5 requests per IP per minute
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 5;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60_000);

function isValidUrl(str) {
  try {
    const parsed = new URL(str);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;

    const hostname = parsed.hostname;

    // SSRF protection
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

router.post('/analyze', (req, res) => {
  const clientIp = req.ip || req.connection.remoteAddress;

  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Max 5 requests per minute.' });
  }

  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "url" field' });
  }

  if (!isValidUrl(url)) {
    return res.status(400).json({ error: 'Invalid URL. Must be a valid http/https URL and not a private/localhost address.' });
  }

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const emit = (data) => {
    try {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      if (typeof res.flush === 'function') res.flush();
    } catch {
      // Client disconnected
    }
  };

  const abortController = new AbortController();

  // 90-second timeout
  const timeout = setTimeout(() => {
    abortController.abort();
    emit({ type: 'error', message: 'Analysis timed out after 90 seconds.' });
    res.end();
  }, 90_000);

  req.on('close', () => {
    abortController.abort();
    clearTimeout(timeout);
  });

  runAgent(url, emit, abortController.signal)
    .catch((err) => {
      console.error('Agent error:', err);
      emit({ type: 'error', message: err.message || 'An unexpected error occurred.' });
    })
    .finally(() => {
      clearTimeout(timeout);
      res.end();
    });
});

export default router;
