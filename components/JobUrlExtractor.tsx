'use client';

import * as React from 'react';
import { InlineAlert } from '@/components/InlineAlert';
import { CopyButton } from '@/components/CopyButton';
import { useToast } from '@/components/ToastProvider';

type ExtractResponse =
  | { url: string; title?: string; text: string; characterCount: number }
  | { error: string };

type StructureResponse = { structured: unknown } | { error: string };

type SaveResponse = { id: string } | { error: string };

export function JobUrlExtractor() {
  const { toast } = useToast();
  const [url, setUrl] = React.useState('');
  const [isExtracting, setIsExtracting] = React.useState(false);
  const [isStructuring, setIsStructuring] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState<string>('');
  const [text, setText] = React.useState<string>('');
  const [structured, setStructured] = React.useState<unknown>(null);
  const [savedId, setSavedId] = React.useState<string>('');

  const retryLabelRef = React.useRef<string | null>(null);
  const retryActionRef = React.useRef<(() => void) | null>(null);

  const isBusy = isExtracting || isStructuring || isSaving;

  function setRetry(label: string, action: () => void) {
    retryLabelRef.current = label;
    retryActionRef.current = action;
  }

  async function extract() {
    setRetry('Retry extract', () => void extract());
    setIsExtracting(true);
    setError(null);
    setTitle('');
    setText('');
    setStructured(null);
    setSavedId('');

    try {
      const res = await fetch('/api/extract-job', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = (await res.json()) as ExtractResponse;
      if (!res.ok) {
        const msg = 'error' in data ? data.error : 'Failed to extract job';
        setError(msg);
        toast({ variant: 'error', message: msg });
        return;
      }
      if ('error' in data) {
        setError(data.error);
        toast({ variant: 'error', message: data.error });
        return;
      }

      setTitle(data.title ?? '');
      setText(data.text);
      toast({ variant: 'success', message: 'Job extracted.' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Extraction failed';
      setError(msg);
      toast({ variant: 'error', message: msg });
    } finally {
      setIsExtracting(false);
    }
  }

  async function structure() {
    if (!text) return;
    setRetry('Retry structuring', () => void structure());
    setIsStructuring(true);
    setError(null);

    try {
      const res = await fetch('/api/structure-job', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url, title, text }),
      });

      const data = (await res.json()) as StructureResponse;
      if (!res.ok) {
        const msg = 'error' in data ? data.error : 'Failed to structure job';
        setError(msg);
        toast({ variant: 'error', message: msg });
        return;
      }
      if ('error' in data) {
        setError(data.error);
        toast({ variant: 'error', message: data.error });
        return;
      }

      setStructured(data.structured);
      toast({ variant: 'success', message: 'Job structured.' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Structuring failed';
      setError(msg);
      toast({ variant: 'error', message: msg });
    } finally {
      setIsStructuring(false);
    }
  }

  async function save() {
    if (!text) return;
    setRetry('Retry saving', () => void save());
    setIsSaving(true);
    setError(null);
    setSavedId('');

    try {
      const res = await fetch('/api/save-job', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sourceUrl: url, rawText: text, structured }),
      });

      const data = (await res.json()) as SaveResponse;
      if (!res.ok) {
        const msg = 'error' in data ? data.error : 'Failed to save job';
        setError(msg);
        toast({ variant: 'error', message: msg });
        return;
      }
      if ('error' in data) {
        setError(data.error);
        toast({ variant: 'error', message: data.error });
        return;
      }

      setSavedId(data.id);
      toast({ variant: 'success', message: 'Job saved.' });
      try {
        window.localStorage.setItem('resumealign:lastJobId', data.id);
      } catch {
        // ignore
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Save failed';
      setError(msg);
      toast({ variant: 'error', message: msg });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="rounded-lg border p-4">
        <div className="text-lg font-semibold">Job posting URL</div>
        <p className="mt-1 text-sm text-slate-600">
          Paste a job URL and we’ll extract the description server-side.
        </p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => void extract()}
            disabled={!url || isExtracting}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExtracting ? 'Extracting…' : 'Extract'}
          </button>
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
                  disabled={isBusy}
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

        {savedId ? (
          <InlineAlert variant="success" className="mt-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-0">
                Saved. Job id:{' '}
                <span className="font-mono break-all">{savedId}</span>
              </div>
              <CopyButton text={savedId} label="Copy" ariaLabel="Copy job id" />
            </div>
            <div className="mt-2">
              <a className="underline" href="/dashboard">
                View in dashboard
              </a>
            </div>
          </InlineAlert>
        ) : null}
      </div>

      {text ? (
        <div className="rounded-lg border p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Extracted job text</h2>
              <div className="text-xs text-slate-500">
                {title ? `Title: ${title}` : 'Title: (unknown)'}
              </div>
              <div className="text-xs text-slate-500">{text.length} chars</div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => void structure()}
                disabled={!text || isStructuring}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isStructuring ? 'Structuring…' : 'Structure with AI'}
              </button>

              <button
                type="button"
                onClick={() => void save()}
                disabled={!text || isSaving}
                className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap text-sm leading-6 text-slate-800">
            {text}
          </pre>
        </div>
      ) : null}

      {structured ? (
        <div className="rounded-lg border p-4">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-base font-semibold">Structured job JSON</h2>
            <div className="text-xs text-slate-500">Preview</div>
          </div>
          <pre className="mt-3 max-h-105 overflow-auto whitespace-pre-wrap text-sm leading-6 text-slate-800">
            {JSON.stringify(structured, null, 2)}
          </pre>
        </div>
      ) : null}
    </section>
  );
}
