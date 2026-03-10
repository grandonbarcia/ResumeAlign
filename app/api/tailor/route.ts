import { NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { runTailorPipeline } from '@/lib/aiPipeline';
import type { Id } from '@/convex/_generated/dataModel';
import {
  AuthenticationRequiredError,
  MissingConvexUrlError,
  createAuthenticatedServerConvexClient,
} from '@/lib/convexServerClient';

export const runtime = 'nodejs';

type Body = {
  resumeId: string;
  jobId: string;
};

function isPlausibleConvexId(value: unknown) {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  // Keep permissive: Convex ids are opaque and may not be strictly alphanumeric.
  if (v.length < 5) return false;
  if (v.length > 256) return false;
  if (/\s/.test(v)) return false;
  return true;
}

export async function POST(request: Request) {
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

  if (!isPlausibleConvexId(body.resumeId) || !isPlausibleConvexId(body.jobId)) {
    return NextResponse.json(
      {
        error:
          'Invalid resumeId or jobId. Please paste ids created by the Save steps (or pick them from the dashboard).',
      },
      { status: 400 },
    );
  }

  try {
    const client = await createAuthenticatedServerConvexClient();

    const resume = await client.query(api.resumes.getMineById, {
      id: body.resumeId as Id<'resumes'>,
    });
    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found for this user.' },
        { status: 404 },
      );
    }

    const job = await client.query(api.jobs.getMineById, {
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
      resumeId: resume._id,
      jobId: job._id,
      tailored: result,
      explanations: {
        bulletRewrite: result.bulletRewrite,
        gapAnalysis: result.gapAnalysis,
        skillsOptimize: result.skillsOptimize,
      },
    });

    if (!runId) {
      return NextResponse.json(
        {
          error:
            'Failed to create tailoring run (no id returned). Please try again.',
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ runId: String(runId) });
  } catch (error) {
    if (error instanceof MissingConvexUrlError) {
      return NextResponse.json({ error: error.message }, { status: 501 });
    }

    if (error instanceof AuthenticationRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    const message = error instanceof Error ? error.message : 'Unknown error';

    // Convex throws ArgumentValidationError if ids are malformed; surface a clean 400.
    if (message.includes('ArgumentValidationError')) {
      return NextResponse.json(
        {
          error:
            'Invalid resumeId or jobId. Please paste ids created by the Save steps (or pick them from the dashboard).',
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
