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
    const mod = await import('pdf-parse');
    const pdfParse: any = (mod as any).default ?? mod;
    const result = await pdfParse(file.buffer);
    rawText = typeof result?.text === 'string' ? result.text : '';
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
