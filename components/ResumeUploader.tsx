'use client';

import * as React from 'react';
import { InlineAlert } from '@/components/InlineAlert';
import { CopyButton } from '@/components/CopyButton';
import { useToast } from '@/components/ToastProvider';

type ParseResponse =
  | {
      filename?: string;
      mimeType: string;
      text: string;
      characterCount: number;
    }
  | { error: string };

type StructureResponse = { structured: unknown } | { error: string };

type SaveResponse = { id: string } | { error: string };

export function ResumeUploader() {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isStructuring, setIsStructuring] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [text, setText] = React.useState<string>('');
  const [filename, setFilename] = React.useState<string>('');
  const [structured, setStructured] = React.useState<unknown>(null);
  const [savedId, setSavedId] = React.useState<string>('');

  const lastFileRef = React.useRef<File | null>(null);
  const retryLabelRef = React.useRef<string | null>(null);
  const retryActionRef = React.useRef<(() => void) | null>(null);

  const isBusy = isLoading || isStructuring || isSaving;

  function setRetry(label: string, action: () => void) {
    retryLabelRef.current = label;
    retryActionRef.current = action;
  }

  async function upload(file: File) {
    lastFileRef.current = file;
    setRetry('Retry parsing', () => {
      const f = lastFileRef.current;
      if (f) void upload(f);
    });

    setIsLoading(true);
    setError(null);
    setText('');
    setStructured(null);
    setSavedId('');
    setFilename(file.name);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData,
      });

      const data = (await res.json()) as ParseResponse;
      if (!res.ok) {
        const msg = 'error' in data ? data.error : 'Failed to parse resume';
        setError(msg);
        toast({ variant: 'error', message: msg });
        return;
      }

      if ('error' in data) {
        setError(data.error);
        toast({ variant: 'error', message: data.error });
        return;
      }

      setText(data.text);
      toast({ variant: 'success', message: 'Resume parsed.' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setError(msg);
      toast({ variant: 'error', message: msg });
    } finally {
      setIsLoading(false);
    }
  }

  async function structure() {
    if (!text) return;
    setRetry('Retry structuring', () => void structure());
    setIsStructuring(true);
    setError(null);

    try {
      const res = await fetch('/api/structure-resume', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text, filename }),
      });

      const data = (await res.json()) as StructureResponse;
      if (!res.ok) {
        const msg = 'error' in data ? data.error : 'Failed to structure resume';
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
      toast({ variant: 'success', message: 'Resume structured.' });
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
      const res = await fetch('/api/save-resume', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          filename,
          originalText: text,
          parsed: structured,
        }),
      });

      const data = (await res.json()) as SaveResponse;
      if (!res.ok) {
        const msg = 'error' in data ? data.error : 'Failed to save resume';
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
      toast({ variant: 'success', message: 'Resume saved.' });
      try {
        window.localStorage.setItem('resumealign:lastResumeId', data.id);
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

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void upload(file);
  }

  return (
    <section className="space-y-4">
      <div
        className={
          'rounded-lg border border-dashed p-8 transition ' +
          (isDragging ? 'border-slate-400 bg-slate-50' : 'border-slate-300')
        }
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="text-lg font-semibold">Upload your resume</div>
          <div className="text-sm text-slate-600">
            Drag and drop a PDF, DOCX, or TXT file, or choose one.
          </div>

          <label className="inline-flex cursor-pointer items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            Choose file
            <input
              type="file"
              className="hidden"
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f);
              }}
            />
          </label>

          {isLoading ? (
            <div className="text-sm text-slate-600">Parsing…</div>
          ) : filename ? (
            <div className="text-xs text-slate-500">Selected: {filename}</div>
          ) : null}
        </div>
      </div>

      {error ? (
        <InlineAlert
          variant="error"
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

      {text ? (
        <div className="rounded-lg border p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Extracted text</h2>
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

          {savedId ? (
            <InlineAlert variant="success" className="mt-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-0">
                  Saved. Resume id:{' '}
                  <span className="font-mono break-all">{savedId}</span>
                </div>
                <CopyButton
                  text={savedId}
                  label="Copy"
                  ariaLabel="Copy resume id"
                />
              </div>
              <div className="mt-2">
                <a className="underline" href="/dashboard">
                  View in dashboard
                </a>
              </div>
            </InlineAlert>
          ) : null}

          <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap text-sm leading-6 text-slate-800">
            {text}
          </pre>
        </div>
      ) : null}

      {structured ? (
        <div className="rounded-lg border p-4">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-base font-semibold">Structured JSON</h2>
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
