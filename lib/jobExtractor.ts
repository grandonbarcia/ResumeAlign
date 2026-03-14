import { load } from 'cheerio';
import { htmlToText } from 'html-to-text';

const MAX_HTML_BYTES = 1_500_000; // ~1.5MB
const FETCH_TIMEOUT_MS = 15_000;
const MIN_EXTRACTED_CHARS = 300;

const DEFAULT_HEADERS: Record<string, string> = {
  // A realistic UA helps avoid simplistic bot-blocks.
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'accept-language': 'en-US,en;q=0.9',
  'cache-control': 'no-cache',
  pragma: 'no-cache',
};

const BROWSER_BLOCK_PATTERNS = [
  'unsupported browser',
  'browser is not supported',
  'browser is unsupported',
  'update your browser',
  'outdated browser',
  'enable javascript',
  'requires javascript',
  'please turn javascript on',
  'you need to enable javascript',
  'checking your browser',
  'verify you are human',
  'captcha',
  'access denied',
  'request blocked',
  'automated access',
  'security check',
  'cloudflare',
];

function normalizeText(text: string) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\u0000/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function looksLikeJavascriptGated(text: string) {
  const t = text.toLowerCase();
  return BROWSER_BLOCK_PATTERNS.some((pattern) => t.includes(pattern));
}

function looksLikeBrowserBlockPage(title: string, text: string) {
  return looksLikeJavascriptGated(`${title}\n${text}`);
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

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function extractJobTextFromJina(bodyText: string) {
  const normalized = normalizeText(bodyText);

  // Jina reader commonly returns a short header + "Markdown Content:" section.
  let title = '';
  const titleMatch = normalized.match(/\btitle:\s*(.+)$/im);
  if (titleMatch?.[1]) title = normalizeText(titleMatch[1]);

  let text = normalized;
  const mdIdx = normalized.toLowerCase().indexOf('markdown content:');
  if (mdIdx !== -1) {
    text = normalizeText(normalized.slice(mdIdx + 'markdown content:'.length));
  }

  return { title, text };
}

async function extractJobTextViaJina(url: URL) {
  const jinaUrl = `https://r.jina.ai/${url.toString()}`;
  const readerRes = await fetchWithTimeout(jinaUrl, {
    method: 'GET',
    redirect: 'follow',
    headers: {
      ...DEFAULT_HEADERS,
      accept: 'text/plain, text/markdown;q=0.9, */*;q=0.8',
    },
  });

  if (!readerRes.ok) {
    throw new Error(`Reader fallback failed (${readerRes.status})`);
  }

  const readerText = await readTextWithLimit(readerRes, MAX_HTML_BYTES);
  const extracted = extractJobTextFromJina(readerText);

  if (looksLikeBrowserBlockPage(extracted.title, extracted.text)) {
    throw new Error(
      'Reader fallback returned an anti-bot or unsupported-browser page',
    );
  }

  return extracted;
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
  let title = '';
  let text = '';
  let directFailure: string | null = null;

  // Attempt 1: direct HTML fetch.
  try {
    const res = await fetchWithTimeout(url.toString(), {
      method: 'GET',
      redirect: 'follow',
      headers: DEFAULT_HEADERS,
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
    ({ title, text } = extractJobTextFromHtml(html));

    if (looksLikeBrowserBlockPage(title, text)) {
      throw new Error(
        'Target site returned an anti-bot or unsupported-browser page',
      );
    }
  } catch (error) {
    directFailure =
      error instanceof Error ? error.message : 'Direct fetch failed';
  }

  const directLooksBad =
    !text ||
    text.length < MIN_EXTRACTED_CHARS ||
    looksLikeJavascriptGated(text);

  // Attempt 2: fallback to reader proxy for JS-rendered / heavily scripted pages.
  if (directFailure || directLooksBad) {
    try {
      const readerExtracted = await extractJobTextViaJina(url);

      if (
        readerExtracted.text &&
        !looksLikeBrowserBlockPage(
          readerExtracted.title,
          readerExtracted.text,
        ) &&
        readerExtracted.text.length > text.length
      ) {
        text = readerExtracted.text;
        if (!title) title = readerExtracted.title;
      }
    } catch (error) {
      const readerFailure =
        error instanceof Error ? error.message : 'Reader fallback failed';
      directFailure = directFailure
        ? `${directFailure}; ${readerFailure}`
        : readerFailure;
    }
  }

  if (!text || text.length < MIN_EXTRACTED_CHARS) {
    const hint =
      'This site may require JavaScript rendering, be behind a login/paywall, or block automated requests. Try a public job-posting URL from the company careers page.';

    if (directFailure) {
      throw new Error(
        `No job text could be extracted. ${directFailure}. ${hint}`,
      );
    }

    throw new Error(`No job text could be extracted. ${hint}`);
  }

  return {
    url: url.toString(),
    title,
    text,
  };
}
