import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

export const runtime = 'nodejs';

type Body = {
  filename?: string;
  originalText: string;
  parsed?: unknown;
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

  if (!body?.originalText || typeof body.originalText !== 'string') {
    return NextResponse.json(
      { error: 'Missing originalText' },
      { status: 400 },
    );
  }

  try {
    const userId = await getUserId();
    const client = new ConvexHttpClient(convexUrl);

    const id = await client.mutation(api.resumes.create, {
      userId,
      filename: body.filename,
      originalText: body.originalText,
      parsed: body.parsed,
    });

    return NextResponse.json({ id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
