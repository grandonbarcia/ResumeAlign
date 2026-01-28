import { NextResponse } from 'next/server';
import { extractJobTextFromUrl } from '@/lib/jobExtractor';

export const runtime = 'nodejs';

type Body = { url: string };

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body?.url || typeof body.url !== 'string') {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }

  try {
    const extracted = await extractJobTextFromUrl(body.url);

    return NextResponse.json({
      url: extracted.url,
      title: extracted.title,
      text: extracted.text,
      characterCount: extracted.text.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
