import * as cheerio from 'cheerio';

const DEFAULT_MAX_CHARS = parseInt(process.env.MAX_FETCH_CHARS || '15000', 10);

export function cleanHtml(html, { selector, maxChars = DEFAULT_MAX_CHARS } = {}) {
  const $ = cheerio.load(html);

  let root;
  if (selector) {
    root = $(selector);
    if (root.length === 0) {
      root = $('body');
    }
  } else {
    $('script, style, nav, footer, header, aside, noscript, svg, iframe').remove();
    root = $('body');
  }

  let text = root.text();
  text = text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

  const originalLength = text.length;
  let truncated = false;

  if (text.length > maxChars) {
    text = text.slice(0, maxChars) + '\n\n[content truncated]';
    truncated = true;
  }

  if (originalLength !== text.length - (truncated ? 21 : 0)) {
    console.log(`HTML parser: ${originalLength} chars → ${truncated ? maxChars : originalLength} chars${truncated ? ' (truncated)' : ''}`);
  }

  return { text, truncated, originalLength };
}
