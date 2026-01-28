import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { runTailorPipeline } from '@/lib/aiPipeline';
import type { Id } from '@/convex/_generated/dataModel';

export const runtime = 'nodejs';

type Body = {
  resumeId: string;
  jobId: string;
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
          'NEXT_PUBLIC_CONVEX_URL is not set. Run `npx convex dev` and set it in .env.local to enable tailoring.',
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

  if (!body?.resumeId || !body?.jobId) {
    return NextResponse.json(
      { error: 'Missing resumeId or jobId' },
      { status: 400 },
    );
  }

  try {
    const userId = await getUserId();
    const client = new ConvexHttpClient(convexUrl);

    const resume = await client.query(api.resumes.getMineById, {
      userId,
      id: body.resumeId as Id<'resumes'>,
    });
    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found for this user.' },
        { status: 404 },
      );
    }

    const job = await client.query(api.jobs.getMineById, {
      userId,
      id: body.jobId as Id<'jobs'>,
    });
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found for this user.' },
        { status: 404 },
      );
    }

    const result = await runTailorPipeline({
      resume: {
        filename: resume.filename,
        originalText: resume.originalText,
        parsed: resume.parsed,
      },
      job: {
        sourceUrl: job.sourceUrl,
        rawText: job.rawText,
        structured: job.structured,
      },
    });

    const runId = await client.mutation(api.tailoringRuns.create, {
      userId,
      resumeId: resume._id,
      jobId: job._id,
      tailored: result,
      explanations: {
        bulletRewrite: result.bulletRewrite,
        gapAnalysis: result.gapAnalysis,
        skillsOptimize: result.skillsOptimize,
      },
    });

    return NextResponse.json({ runId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
