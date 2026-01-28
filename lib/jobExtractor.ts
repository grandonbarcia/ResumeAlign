import { load } from 'cheerio';
import { htmlToText } from 'html-to-text';

const MAX_HTML_BYTES = 1_500_000; // ~1.5MB
const FETCH_TIMEOUT_MS = 15_000;

function normalizeText(text: string) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\u0000/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function isIpV4(host: string) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}

function isPrivateIpv4(host: string) {
  if (!isIpV4(host)) return false;
  const parts = host.split('.').map((n) => Number(n));
  if (parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;

  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

export function assertSafeJobUrl(rawUrl: string) {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http/https URLs are allowed');
  }

  const hostname = url.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1'
  ) {
    throw new Error('Localhost URLs are not allowed');
  }

  if (isPrivateIpv4(hostname)) {
    throw new Error('Private network URLs are not allowed');
  }

  return url;
}

async function readTextWithLimit(response: Response, maxBytes: number) {
  const reader = response.body?.getReader();
  if (!reader) return await response.text();

  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > maxBytes) {
        throw new Error('Response too large');
      }
      chunks.push(value);
    }
  }

  const buffer = Buffer.concat(chunks.map((c) => Buffer.from(c)));
  return buffer.toString('utf8');
}

export function extractJobTextFromHtml(html: string) {
  const $ = load(html);
  $('script,noscript,style,svg,canvas,iframe').remove();

  const title = normalizeText($('title').first().text() || '');

  const cleanedHtml = $.html('body') || $.html();

  const text = normalizeText(
    htmlToText(cleanedHtml, {
      wordwrap: false,
      selectors: [
        { selector: 'a', options: { ignoreHref: true } },
        { selector: 'img', format: 'skip' },
      ],
    }),
  );

  return { title, text };
}

export async function extractJobTextFromUrl(rawUrl: string) {
  const url = assertSafeJobUrl(rawUrl);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent':
          'ResumeAlignBot/1.0 (+https://example.invalid) Mozilla/5.0', // polite UA
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch (${res.status})`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('text/html')) {
      throw new Error('URL did not return HTML content');
    }

    const contentLength = res.headers.get('content-length');
    if (contentLength && Number(contentLength) > MAX_HTML_BYTES) {
      throw new Error('Response too large');
    }

    const html = await readTextWithLimit(res, MAX_HTML_BYTES);
    const { title, text } = extractJobTextFromHtml(html);

    if (!text) {
      throw new Error(
        'No job text could be extracted. The page may require JavaScript rendering.',
      );
    }

    return {
      url: url.toString(),
      title,
      text,
    };
  } finally {
    clearTimeout(timeout);
  }
}
