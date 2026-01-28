import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { exportResumePdf } from '@/lib/exportResume';
import type { Id } from '@/convex/_generated/dataModel';

export const runtime = 'nodejs';

type Body = {
  runId: string;
};

const hasClerkKeys = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

async function getUserId(): Promise<string> {
  if (!hasClerkKeys) return 'anonymous';
  const mod = await import('@clerk/nextjs/server');
  const { userId } = await mod.auth();
  return userId ?? 'anonymous';
}

export async function POST(request: Request) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return NextResponse.json(
      {
        error:
          'NEXT_PUBLIC_CONVEX_URL is not set. Run `npx convex dev` and set it in .env.local to enable export.',
      },
      { status: 501 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body?.runId) {
    return NextResponse.json({ error: 'Missing runId' }, { status: 400 });
  }

  try {
    const userId = await getUserId();
    const client = new ConvexHttpClient(convexUrl);

    const run = await client.query(api.tailoringRuns.getMineById, {
      userId,
      id: body.runId as Id<'tailoringRuns'>,
    });

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
