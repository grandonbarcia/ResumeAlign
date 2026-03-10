export type ResumeFile = {
  buffer: Buffer;
  mimeType: string;
  filename?: string;
};

export type ExtractedResumeText = {
  filename?: string;
  mimeType: string;
  text: string;
};

const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Extract text from a PDF buffer using pdfjs-dist directly.
 * We use the legacy build and disable the worker to avoid Next.js bundling issues
 * with pdf.worker.mjs in server-side code.
 */
async function extractPdfText(buffer: Buffer): Promise<string> {
  const isModuleNotFound = (e: unknown) => {
    const msg = e instanceof Error ? e.message : String(e);
    return (
      msg.includes('Cannot find module') ||
      msg.includes('ERR_MODULE_NOT_FOUND') ||
      msg.includes('Module not found')
    );
  };

  type PdfJsTextItem = { str: string };
  type PdfJsTextContent = { items: unknown[] };
  type PdfJsPage = { getTextContent: () => Promise<PdfJsTextContent> };
  type PdfJsDocument = {
    numPages: number;
    getPage: (pageNumber: number) => Promise<PdfJsPage>;
    destroy: () => Promise<void>;
  };
  type PdfJsLoadingTask = { promise: Promise<PdfJsDocument> };
  type PdfJsModule = {
    getDocument: (params: {
      data: Uint8Array;
      disableWorker: boolean;
      verbosity: number;
    }) => PdfJsLoadingTask;
  };

  const isTextItem = (item: unknown): item is PdfJsTextItem => {
    if (typeof item !== 'object' || item === null) return false;
    if (!('str' in item)) return false;
    return typeof (item as { str?: unknown }).str === 'string';
  };

  try {
    // Dynamically import pdfjs-dist legacy build for Node.js compatibility
    const pdfjs =
      (await import('pdfjs-dist/legacy/build/pdf.mjs')) as unknown as PdfJsModule;

    // Disable the worker to prevent Next.js from trying to bundle pdf.worker.mjs
    // This runs PDF parsing in the main thread, which is fine for server-side use
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buffer),
      disableWorker: true,
      verbosity: 0, // Suppress console warnings
    });

    const doc = await loadingTask.promise;
    const textParts: string[] = [];

    try {
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .filter(isTextItem)
          .map((item) => item.str)
          .join(' ');
        textParts.push(pageText);
      }
    } finally {
      await doc.destroy();
    }

    return textParts.join('\n\n');
  } catch (e) {
    // Fallback: pdfjs-dist isn't installed or couldn't be loaded.
    // This keeps PDF parsing working in dev even if dependencies drift.
    if (!isModuleNotFound(e)) throw e;

    type PdfParseResult = { text?: string };
    type PdfParseFn = (data: Buffer) => Promise<PdfParseResult>;
    type PdfParseModule = { default?: unknown };

    const mod = (await import('pdf-parse')) as unknown as PdfParseModule;
    const candidate = mod.default ?? mod;
    if (typeof candidate !== 'function') {
      throw new Error(
        'Failed to load PDF parser (pdf-parse export is not a function).',
      );
    }

    const pdfParse = candidate as PdfParseFn;
    const result = await pdfParse(buffer);
    return typeof result.text === 'string' ? result.text : '';
  }
}

function normalizeText(text: string) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\u0000/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function extractResumeText(
  file: ResumeFile,
): Promise<ExtractedResumeText> {
  if (!file?.buffer) {
    throw new Error('Missing file buffer');
  }
  if (file.buffer.length === 0) {
    throw new Error('Empty file');
  }
  if (file.buffer.length > MAX_BYTES) {
    throw new Error(`File too large (max ${MAX_BYTES} bytes)`);
  }

  const mime = file.mimeType.toLowerCase();
  const name = file.filename?.toLowerCase();

  const isPdf = mime === 'application/pdf' || name?.endsWith('.pdf');
  const isDocx =
    mime ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name?.endsWith('.docx');
  const isText =
    mime.startsWith('text/') ||
    mime === 'application/octet-stream' ||
    name?.endsWith('.txt');

  let rawText = '';

  if (isPdf) {
    rawText = await extractPdfText(file.buffer);
  } else if (isDocx) {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    rawText = typeof result?.value === 'string' ? result.value : '';
  } else if (isText) {
    rawText = file.buffer.toString('utf8');
  } else {
    throw new Error('Unsupported file type. Please upload PDF, DOCX, or TXT.');
  }

  const text = normalizeText(rawText);
  if (!text) {
    throw new Error(
      'No text could be extracted. If this is a scanned PDF, try exporting it with selectable text.',
    );
  }

  return {
    filename: file.filename,
    mimeType: file.mimeType,
    text,
  };
}
