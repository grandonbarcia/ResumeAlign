'use client';

import * as React from 'react';
import { InlineAlert } from '@/components/InlineAlert';
import { CopyButton } from '@/components/CopyButton';
import { useToast } from '@/components/ToastProvider';
import {
  getStoredId,
  LS_JOB_ID,
  LS_RESUME_ID,
  subscribeToStoredIdsUpdated,
} from '@/lib/clientStoredIds';

type TailorResponse = { runId: string } | { error: string };

function isPlausibleStoredId(value: string) {
  const v = value.trim();
  if (v.length < 5) return false;
  if (v.length > 256) return false;
  if (/\s/.test(v)) return false;
  return true;
}

function isNonPlaceholderId(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (!v) return false;
  if (/^undefined$/i.test(v)) return false;
  if (/^null$/i.test(v)) return false;
  return true;
}

export function TailorRunner() {
  const { toast } = useToast();
  const [resumeId, setResumeId] = React.useState('');
  const [jobId, setJobId] = React.useState('');
  const [isRunning, setIsRunning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [runId, setRunId] = React.useState('');

  const retryActionRef = React.useRef<(() => void) | null>(null);
  const retryLabelRef = React.useRef<string | null>(null);

  function setRetry(label: string, action: () => void) {
    retryLabelRef.current = label;
    retryActionRef.current = action;
  }

  React.useEffect(() => {
    const syncFromStorage = () => {
      const r = getStoredId(LS_RESUME_ID);
      const j = getStoredId(LS_JOB_ID);
      if (isPlausibleStoredId(r)) {
        setResumeId((current) => (current === r ? current : r));
      }
      if (isPlausibleStoredId(j)) {
        setJobId((current) => (current === j ? current : j));
      }
    };

    syncFromStorage();
    return subscribeToStoredIdsUpdated(syncFromStorage);
  }, []);

  async function run() {
    setRetry('Retry', () => void run());
    setIsRunning(true);
    setError(null);
    setRunId('');

    const trimmedResumeId = resumeId.trim();
    const trimmedJobId = jobId.trim();

    if (!isPlausibleStoredId(trimmedResumeId)) {
      const msg =
        'Resume id looks invalid. Upload + Save a resume first (Step 1), then paste the saved id here.';
      setError(msg);
      toast({ variant: 'error', message: msg });
      setIsRunning(false);
      return;
    }

    if (!isPlausibleStoredId(trimmedJobId)) {
      const msg =
        'Job id looks invalid. Extract + Save a job first (Step 2), then paste the saved id here.';
      setError(msg);
      toast({ variant: 'error', message: msg });
      setIsRunning(false);
      return;
    }

    try {
      const res = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          resumeId: trimmedResumeId,
          jobId: trimmedJobId,
        }),
      });

      const data = (await res.json()) as TailorResponse;
      if (!res.ok) {
        let msg = 'error' in data ? data.error : 'Failed to run tailoring';
        if (msg === 'Resume not found.') {
          msg =
            'Resume not found. Save the resume again in Step 1 so Step 3 refreshes to the latest saved id, then retry.';
        } else if (msg === 'Job not found.') {
          msg =
            'Job not found. Save the job again in Step 2 so Step 3 refreshes to the latest saved id, then retry.';
        }
        setError(msg);
        toast({ variant: 'error', message: msg });
        return;
      }

      if ('error' in data) {
        setError(data.error);
        toast({ variant: 'error', message: data.error });
        return;
      }

      if (!('runId' in data) || !isNonPlaceholderId(data.runId)) {
        const msg =
          'Tailoring run was created, but the server did not return a valid run id. Please try again or open the dashboard to find the latest run.';
        setError(msg);
        toast({ variant: 'error', message: msg });
        return;
      }

      setRunId(data.runId);
      toast({ variant: 'success', message: 'Tailoring run created.' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Tailoring failed';
      setError(msg);
      toast({ variant: 'error', message: msg });
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="rounded-lg border p-4">
        <div className="text-lg font-semibold">Tailor</div>
        <p className="mt-1 text-sm text-slate-600">
          Step 3: Provide a saved resume id and job id, then run the multi-step
          pipeline.
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <div>
            <div className="text-xs font-medium text-slate-700">Resume id</div>
            <input
              value={resumeId}
              onChange={(e) => setResumeId(e.target.value)}
              placeholder="e.g. 8d2f..."
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <div className="text-xs font-medium text-slate-700">Job id</div>
            <input
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              placeholder="e.g. 4c1a..."
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void run()}
            disabled={!resumeId || !jobId || isRunning}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRunning ? 'Running…' : 'Run tailoring'}
          </button>

          {isNonPlaceholderId(runId) ? (
            <div className="flex flex-wrap items-center gap-2">
              <a className="text-sm underline" href={`/results/${runId}`}>
                View results
              </a>
              <CopyButton
                text={runId}
                label="Copy run id"
                ariaLabel="Copy run id"
              />
            </div>
          ) : null}
        </div>

        {error ? (
          <InlineAlert
            variant="error"
            className="mt-3"
            actions={
              retryActionRef.current && retryLabelRef.current ? (
                <button
                  type="button"
                  onClick={() => retryActionRef.current?.()}
                  disabled={isRunning}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {retryLabelRef.current}
                </button>
              ) : null
            }
          >
            {error}
          </InlineAlert>
        ) : null}
      </div>
    </section>
  );
}
