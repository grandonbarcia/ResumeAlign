import { NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import {
  AuthenticationRequiredError,
  MissingConvexUrlError,
  createAuthenticatedServerConvexClient,
} from '@/lib/convexServerClient';

export const runtime = 'nodejs';

type Body = {
  filename?: string;
  originalText: string;
  parsed?: unknown;
};

export async function POST(request: Request) {
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
    const client = await createAuthenticatedServerConvexClient();

    const id = await client.mutation(api.resumes.create, {
      filename: body.filename,
      originalText: body.originalText,
      parsed: body.parsed,
    });

    return NextResponse.json({ id });
  } catch (error) {
    if (error instanceof MissingConvexUrlError) {
      return NextResponse.json({ error: error.message }, { status: 501 });
    }

    if (error instanceof AuthenticationRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
