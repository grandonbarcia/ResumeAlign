import { NextResponse } from 'next/server';
import {
  getResumeOriginalFileById,
  getTailoringRunById,
} from '@/lib/localStore';

export const runtime = 'nodejs';

type Body = {
  runId: string;
};

function buildContentDisposition(filename: string) {
  const fallback = filename.replace(/[^A-Za-z0-9._-]+/g, '_') || 'download';
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body?.runId || typeof body.runId !== 'string' || !body.runId.trim()) {
    return NextResponse.json({ error: 'Missing runId' }, { status: 400 });
  }

  try {
    const run = await getTailoringRunById(body.runId.trim());

    if (!run) {
      return NextResponse.json({ error: 'Run not found.' }, { status: 404 });
    }

    const original = await getResumeOriginalFileById(run.resumeId);

    if (!original) {
      return NextResponse.json(
        {
          error:
            'Original uploaded file is not available for this run. Re-save the resume after this update to enable original-file download.',
        },
        { status: 404 },
      );
    }

    const responseBody = new ArrayBuffer(original.buffer.byteLength);
    new Uint8Array(responseBody).set(original.buffer);

    return new NextResponse(responseBody, {
      status: 200,
      headers: {
        'content-type': original.originalFile.mimeType,
        'content-disposition': buildContentDisposition(
          original.originalFile.filename,
        ),
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
