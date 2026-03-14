import { NextResponse } from 'next/server';
import { createJob } from '@/lib/localStore';

export const runtime = 'nodejs';

type Body = {
  sourceUrl?: string;
  rawText: string;
  structured?: unknown;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body?.rawText || typeof body.rawText !== 'string') {
    return NextResponse.json({ error: 'Missing rawText' }, { status: 400 });
  }

  try {
    const record = await createJob({
      sourceUrl: body.sourceUrl,
      rawText: body.rawText,
      structured: body.structured,
    });

    return NextResponse.json({ id: record.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
