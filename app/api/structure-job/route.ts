import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { StructuredJobSchema } from '@/lib/jobStructured';
import { mockStructureJob } from '@/lib/mockAi';

export const runtime = 'nodejs';

type Body = {
  url?: string;
  title?: string;
  text: string;
};

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  const mode = (
    process.env.AI_MODE ||
    process.env.AI_PROVIDER ||
    ''
  ).toLowerCase();
  const useMock = mode === 'mock' || !apiKey;

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body?.text || typeof body.text !== 'string') {
    return NextResponse.json({ error: 'Missing job text' }, { status: 400 });
  }

  try {
    if (useMock) {
      const structured = mockStructureJob({
        rawText: body.text,
        sourceUrl: body.url,
        titleHint: body.title,
      });
      return NextResponse.json({ structured });
    }

    const client = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const system =
      'You are a job description parser. Extract structured JSON from job text. ' +
      'Do not invent facts. If unsure, omit fields.';

    const user =
      `Return a JSON object that matches this schema (no markdown):\n` +
      `{ title?, company?, location?, employmentType?, summary?, responsibilities[], requirements[], skills[], keywords[] }\n\n` +
      `URL: ${body.url ?? '(unknown)'}\n` +
      `TITLE: ${body.title ?? '(unknown)'}\n\n` +
      `JOB TEXT:\n${body.text}`;

    const completion = await client.chat.completions.create({
      model,
      temperature: 0,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? '';
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
      return NextResponse.json(
        { error: 'Model did not return JSON.' },
        { status: 502 },
      );
    }

    const parsed = JSON.parse(content.slice(jsonStart, jsonEnd + 1));
    const structured = StructuredJobSchema.parse(parsed);

    return NextResponse.json({ structured });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
