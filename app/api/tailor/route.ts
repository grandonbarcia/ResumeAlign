import { NextResponse } from 'next/server';
import { runTailorPipeline } from '@/lib/aiPipeline';
import {
  createTailoringRun,
  getJobById,
  getResumeById,
} from '@/lib/localStore';

export const runtime = 'nodejs';

type Body = {
  resumeId: string;
  jobId: string;
};

function isPlausibleStoredId(value: unknown) {
  if (typeof value !== 'string') return false;
  const v = value.trim();
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

  if (!isPlausibleStoredId(body.resumeId) || !isPlausibleStoredId(body.jobId)) {
    return NextResponse.json(
      {
        error:
          'Invalid resumeId or jobId. Please paste ids created by the Save steps (or pick them from the dashboard).',
      },
      { status: 400 },
    );
  }

  try {
    const resume = await getResumeById(body.resumeId.trim());
    if (!resume) {
      return NextResponse.json({ error: 'Resume not found.' }, { status: 404 });
    }

    const job = await getJobById(body.jobId.trim());
    if (!job) {
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
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

    const run = await createTailoringRun({
      resumeId: resume.id,
      jobId: job.id,
      tailored: result,
      explanations: {
        bulletRewrite: result.bulletRewrite,
        gapAnalysis: result.gapAnalysis,
        skillsOptimize: result.skillsOptimize,
      },
    });

    if (!run.id) {
      return NextResponse.json(
        {
          error:
            'Failed to create tailoring run (no id returned). Please try again.',
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ runId: run.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
