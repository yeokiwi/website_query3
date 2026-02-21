import axios from 'axios';
import { cleanHtml } from './htmlParser.js';

const REQUEST_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

export async function fetchUrl(url, selector) {
  try {
    const response = await axios.get(url, {
      headers: REQUEST_HEADERS,
      timeout: 15000,
      maxRedirects: 5,
      responseType: 'text',
    });

    const html = response.data;
    const { text, truncated } = cleanHtml(html, { selector });

    if (!text.trim() && process.env.USE_PLAYWRIGHT === 'true') {
      return fetchWithPlaywright(url, selector);
    }

    return { url, text, truncated };
  } catch (err) {
    if (process.env.USE_PLAYWRIGHT === 'true') {
      try {
        return await fetchWithPlaywright(url, selector);
      } catch (pwErr) {
        return { url, text: `Error fetching URL: ${err.message}`, truncated: false };
      }
    }
    return { url, text: `Error fetching URL: ${err.message}`, truncated: false };
  }
}

async function fetchWithPlaywright(url, selector) {
  let browser;
  try {
    const { chromium } = await import('playwright');
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { timeout: 15000, waitUntil: 'networkidle' });

    let text;
    if (selector) {
      const el = await page.$(selector);
      text = el ? await el.innerText() : await page.innerText('body');
    } else {
      text = await page.innerText('body');
    }

    const maxChars = parseInt(process.env.MAX_FETCH_CHARS || '15000', 10);
    let truncated = false;
    if (text.length > maxChars) {
      text = text.slice(0, maxChars) + '\n\n[content truncated]';
      truncated = true;
    }

    return { url, text, truncated };
  } finally {
    if (browser) await browser.close();
  }
}
