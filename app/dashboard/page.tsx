import Link from 'next/link';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { MockModeBanner } from '@/components/MockModeBanner';
import { InlineAlert } from '@/components/InlineAlert';
import { CopyButton } from '@/components/CopyButton';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Plus } from 'lucide-react';

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
    <div className="container mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your resumes and applications.
          </p>
        </div>
        <Button asChild>
          <Link href="/upload">
            <Plus className="mr-2 h-4 w-4" /> New Upload
          </Link>
        </Button>
      </div>

      <MockModeBanner />

      <p className="mt-4 text-sm text-muted-foreground mb-6">
        Showing up to 20 most recent items.
      </p>

      {convexError ? (
        <InlineAlert variant="warning" className="mb-6">
          <div>
            Convex error: <span className="font-mono">{convexError}</span>
          </div>
          <div className="mt-2">
            If you just added new functions, run{' '}
            <span className="font-mono">npx convex dev</span> again.
          </div>
        </InlineAlert>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Resumes */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Saved Resumes</CardTitle>
            <CardDescription>Base resumes you have uploaded.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {resumes.length === 0 ? (
              <div className="text-sm text-muted-foreground p-2 border-l-2">
                No saved resumes yet.
              </div>
            ) : (
              resumes.map((r) => (
                <div
                  key={r._id}
                  className="rounded-lg border bg-card text-card-foreground shadow-sm p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div
                      className="font-semibold text-sm truncate pr-2 max-w-[150px]"
                      title={r.filename}
                    >
                      {r.filename ?? 'Untitled'}
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(r._creationTime).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono text-[10px] opacity-70">
                      ID: {r._id.slice(0, 8)}...
                    </span>
                    <CopyButton text={r._id} label="" ariaLabel="Copy ID" />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Jobs */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Saved Jobs</CardTitle>
            <CardDescription>Job descriptions extracted.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {jobs.length === 0 ? (
              <div className="text-sm text-muted-foreground p-2 border-l-2">
                No saved jobs yet.
              </div>
            ) : (
              jobs.map((j) => (
                <div
                  key={j._id}
                  className="rounded-lg border bg-card text-card-foreground shadow-sm p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div
                      className="font-semibold text-sm truncate pr-2 max-w-[150px]"
                      title={j.sourceUrl}
                    >
                      {j.sourceUrl
                        ? j.sourceUrl.length > 25
                          ? j.sourceUrl.slice(0, 25) + '...'
                          : j.sourceUrl
                        : 'Job (no URL)'}
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(j._creationTime).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono text-[10px] opacity-70">
                      ID: {j._id.slice(0, 8)}...
                    </span>
                    <CopyButton text={j._id} label="" ariaLabel="Copy ID" />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Runs */}
        <Card className="col-span-full lg:col-span-1">
          <CardHeader>
            <CardTitle>Tailoring Runs</CardTitle>
            <CardDescription>Recent generations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {runs.length === 0 ? (
              <div className="text-sm text-muted-foreground p-2 border-l-2">
                No runs yet.
              </div>
            ) : (
              runs.map((r) => (
                <div
                  key={r._id}
                  className="rounded-lg border bg-card text-card-foreground shadow-sm p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Button
                      variant="link"
                      asChild
                      className="p-0 h-auto font-semibold text-sm"
                    >
                      <Link href={`/results/${r._id}`}>
                        View Results &rarr;
                      </Link>
                    </Button>
                    <div className="text-xs text-muted-foreground">
                      {new Date(r._creationTime).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 text-[10px] text-muted-foreground mt-2">
                    <div className="flex justify-between">
                      <span>Run ID:</span>{' '}
                      <span className="font-mono">{r._id.slice(0, 6)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Resume:</span>{' '}
                      <span className="font-mono">
                        {r.resumeId.slice(0, 6)}...
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Job:</span>{' '}
                      <span className="font-mono">
                        {r.jobId.slice(0, 6)}...
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
