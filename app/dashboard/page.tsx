import Link from 'next/link';
import { Plus } from 'lucide-react';
import { CopyButton } from '@/components/CopyButton';
import { InlineAlert } from '@/components/InlineAlert';
import { MockModeBanner } from '@/components/MockModeBanner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { listDashboardData } from '@/lib/localStore';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const { resumes, jobs, runs } = await listDashboardData();

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

      <InlineAlert variant="info" className="mb-6">
        Data is stored locally in this app instance. It is no longer tied to
        user accounts.
      </InlineAlert>

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
                  key={r.id}
                  className="rounded-lg border bg-card text-card-foreground shadow-sm p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div
                      className="font-semibold text-sm truncate pr-2 max-w-37.5"
                      title={r.filename}
                    >
                      {r.filename ?? 'Untitled'}
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono text-[10px] opacity-70">
                      ID: {r.id.slice(0, 16)}...
                    </span>
                    <CopyButton text={r.id} label="" ariaLabel="Copy ID" />
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
                  key={j.id}
                  className="rounded-lg border bg-card text-card-foreground shadow-sm p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div
                      className="font-semibold text-sm truncate pr-2 max-w-37.5"
                      title={j.sourceUrl}
                    >
                      {j.sourceUrl
                        ? j.sourceUrl.length > 25
                          ? j.sourceUrl.slice(0, 25) + '...'
                          : j.sourceUrl
                        : 'Job (no URL)'}
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(j.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono text-[10px] opacity-70">
                      ID: {j.id.slice(0, 16)}...
                    </span>
                    <CopyButton text={j.id} label="" ariaLabel="Copy ID" />
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
                  key={r.id}
                  className="rounded-lg border bg-card text-card-foreground shadow-sm p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Button
                      variant="link"
                      asChild
                      className="p-0 h-auto font-semibold text-sm"
                    >
                      <Link href={`/results/${r.id}`}>View Results &rarr;</Link>
                    </Button>
                    <div className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 text-[10px] text-muted-foreground mt-2">
                    <div className="flex justify-between">
                      <span>Run ID:</span>{' '}
                      <span className="font-mono">{r.id.slice(0, 6)}...</span>
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
