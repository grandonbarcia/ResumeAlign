import { NextResponse } from 'next/server';
import { exportResumePdf } from '@/lib/exportResume';
import { getTailoringRunById } from '@/lib/localStore';

export const runtime = 'nodejs';

type Body = {
  runId: string;
};

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

    const text: string = run.tailored?.renderedText ?? '';
    if (!text) {
      return NextResponse.json(
        { error: 'No renderedText found for this run.' },
        { status: 422 },
      );
    }

    const bytes = await exportResumePdf({
      text,
      title: 'ResumeAlign - Tailored Resume',
    });

    const responseBody = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(responseBody).set(bytes);

    return new NextResponse(responseBody, {
      status: 200,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition':
          'attachment; filename="resumealign-tailored.pdf"',
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
