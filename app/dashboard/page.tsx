import Link from 'next/link';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { MockModeBanner } from '@/components/MockModeBanner';
import { InlineAlert } from '@/components/InlineAlert';
import { CopyButton } from '@/components/CopyButton';

export const dynamic = 'force-dynamic';

const hasClerkKeys = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

async function getUserId(): Promise<string> {
  if (!hasClerkKeys) return 'anonymous';
  const mod = await import('@clerk/nextjs/server');
  const { userId } = await mod.auth();
  return userId ?? 'anonymous';
}

export default async function DashboardPage() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!convexUrl) {
    return (
      <main className="mx-auto max-w-3xl p-4 sm:p-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-2 text-slate-600">
          Convex is not configured yet. Set{' '}
          <span className="font-mono">NEXT_PUBLIC_CONVEX_URL</span> in{' '}
          <span className="font-mono">.env.local</span>.
        </p>
        <div className="mt-6">
          <Link
            href="/upload"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Go to Upload
          </Link>
        </div>
      </main>
    );
  }

  const userId = await getUserId();
  const client = new ConvexHttpClient(convexUrl);

  let resumes: Array<{
    _id: string;
    _creationTime: number;
    filename?: string;
  }> = [];
  let jobs: Array<{ _id: string; _creationTime: number; sourceUrl?: string }> =
    [];
  let runs: Array<{
    _id: string;
    _creationTime: number;
    resumeId: string;
    jobId: string;
  }> = [];
  let convexError: string | null = null;

  try {
    resumes = await client.query(api.resumes.listMine, { userId });
  } catch (e) {
    convexError = e instanceof Error ? e.message : 'Failed to load resumes.';
  }

  try {
    jobs = await client.query(api.jobs.listMine, { userId });
  } catch (e) {
    convexError =
      convexError ?? (e instanceof Error ? e.message : 'Failed to load jobs.');
  }

  try {
    runs = await client.query(api.tailoringRuns.listMine, { userId });
  } catch (e) {
    convexError =
      convexError ??
      (e instanceof Error ? e.message : 'Failed to load tailoring runs.');
  }

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Link
          href="/upload"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Upload
        </Link>
      </div>

      <div className="mt-4">
        <MockModeBanner />
      </div>

      <p className="mt-2 text-sm text-slate-600">
        Showing up to 20 most recent resumes.
      </p>

      {convexError ? (
        <InlineAlert variant="warning" className="mt-4">
          <div>
            Convex error: <span className="font-mono">{convexError}</span>
          </div>
          <div className="mt-2">
            If you just added new functions, run{' '}
            <span className="font-mono">npx convex dev</span> again.
          </div>
        </InlineAlert>
      ) : null}

      <div className="mt-6 space-y-3">
        {resumes.length === 0 ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            No saved resumes yet.
          </div>
        ) : (
          resumes.map((r) => (
            <div key={r._id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="font-medium">
                  {r.filename ?? 'Untitled resume'}
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(r._creationTime).toLocaleString()}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <div className="min-w-0">
                  id: <span className="font-mono break-all">{r._id}</span>
                </div>
                <CopyButton
                  text={r._id}
                  label="Copy"
                  ariaLabel="Copy resume id"
                />
              </div>
            </div>
          ))
        )}
      </div>

      <h2 className="mt-10 text-lg font-semibold">Saved jobs</h2>
      <div className="mt-3 space-y-3">
        {jobs.length === 0 ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            No saved jobs yet.
          </div>
        ) : (
          jobs.map((j) => (
            <div key={j._id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="break-words font-medium">
                  {j.sourceUrl ? j.sourceUrl : 'Job (no URL)'}
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(j._creationTime).toLocaleString()}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <div className="min-w-0">
                  id: <span className="font-mono break-all">{j._id}</span>
                </div>
                <CopyButton text={j._id} label="Copy" ariaLabel="Copy job id" />
              </div>
            </div>
          ))
        )}
      </div>

      <h2 className="mt-10 text-lg font-semibold">Tailoring runs</h2>
      <div className="mt-3 space-y-3">
        {runs.length === 0 ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            No tailoring runs yet.
          </div>
        ) : (
          runs.map((r) => (
            <div key={r._id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="font-medium">
                  <Link className="underline" href={`/results/${r._id}`}>
                    View results
                  </Link>
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(r._creationTime).toLocaleString()}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <div className="min-w-0">
                  run id: <span className="font-mono break-all">{r._id}</span>
                </div>
                <CopyButton text={r._id} label="Copy" ariaLabel="Copy run id" />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <div className="min-w-0">
                  resume:{' '}
                  <span className="font-mono break-all">{r.resumeId}</span>
                </div>
                <CopyButton
                  text={r.resumeId}
                  label="Copy"
                  ariaLabel="Copy resume id"
                />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <div className="min-w-0">
                  job: <span className="font-mono break-all">{r.jobId}</span>
                </div>
                <CopyButton
                  text={r.jobId}
                  label="Copy"
                  ariaLabel="Copy job id"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
