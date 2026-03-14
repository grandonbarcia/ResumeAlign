import { NextResponse } from 'next/server';
import { createResume } from '@/lib/localStore';

export const runtime = 'nodejs';

type Body = {
  filename?: string;
  originalText: string;
  parsed?: unknown;
};

function parseParsedField(value: FormDataEntryValue | null) {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(value);
  } catch {
    throw new Error('Invalid parsed JSON');
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') ?? '';
    let body: Body;
    let originalFile:
      | {
          buffer: Buffer;
          filename?: string;
          mimeType?: string;
        }
      | undefined;

    if (contentType.toLowerCase().includes('multipart/form-data')) {
      const formData = await request.formData();
      const originalText = formData.get('originalText');
      const filename = formData.get('filename');
      const file = formData.get('file');

      body = {
        filename: typeof filename === 'string' ? filename : undefined,
        originalText: typeof originalText === 'string' ? originalText : '',
        parsed: parseParsedField(formData.get('parsed')),
      };

      if (file instanceof File) {
        originalFile = {
          buffer: Buffer.from(await file.arrayBuffer()),
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
        };
      }
    } else {
      body = (await request.json()) as Body;
    }

    if (!body?.originalText || typeof body.originalText !== 'string') {
      return NextResponse.json(
        { error: 'Missing originalText' },
        { status: 400 },
      );
    }

    const record = await createResume({
      filename: body.filename,
      originalText: body.originalText,
      parsed: body.parsed,
      originalFile,
    });

    return NextResponse.json({ id: record.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
