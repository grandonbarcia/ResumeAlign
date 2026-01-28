import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

export const runtime = 'nodejs';

type Body = {
  sourceUrl?: string;
  rawText: string;
  structured?: unknown;
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
          'NEXT_PUBLIC_CONVEX_URL is not set. Run `npx convex dev` and set it in .env.local to enable saving.',
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

  if (!body?.rawText || typeof body.rawText !== 'string') {
    return NextResponse.json({ error: 'Missing rawText' }, { status: 400 });
  }

  try {
    const userId = await getUserId();
    const client = new ConvexHttpClient(convexUrl);

    const id = await client.mutation(api.jobs.create, {
      userId,
      sourceUrl: body.sourceUrl,
      rawText: body.rawText,
      structured: body.structured,
    });

    return NextResponse.json({ id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
