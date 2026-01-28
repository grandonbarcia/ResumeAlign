'use client';

import * as React from 'react';

type ExportKind = 'pdf' | 'docx';

type ExportResponse =
  | Blob
  | {
      error: string;
    };

async function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    window.URL.revokeObjectURL(url);
  }
}

export function ExportButtons(props: { runId: string }) {
  const [isPdf, setIsPdf] = React.useState(false);
  const [isDocx, setIsDocx] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function exportRun(kind: ExportKind) {
    setError(null);
    kind === 'pdf' ? setIsPdf(true) : setIsDocx(true);

    try {
      const res = await fetch(`/api/export/${kind}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ runId: props.runId }),
      });

      const contentType = res.headers.get('content-type') ?? '';

      if (!res.ok) {
        if (contentType.includes('application/json')) {
          const data = (await res.json()) as { error?: string };
          setError(data.error ?? 'Export failed');
        } else {
          setError('Export failed');
        }
        return;
      }

      const blob = await res.blob();
      const filename =
        kind === 'pdf'
          ? 'resumealign-tailored.pdf'
          : 'resumealign-tailored.docx';
      await downloadBlob(blob, filename);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      kind === 'pdf' ? setIsPdf(false) : setIsDocx(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void exportRun('pdf')}
          disabled={isPdf}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPdf ? 'Generating PDF…' : 'Download PDF'}
        </button>
        <button
          type="button"
          onClick={() => void exportRun('docx')}
          disabled={isDocx}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDocx ? 'Generating DOCX…' : 'Download DOCX'}
        </button>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="text-xs text-slate-500">
        ATS-friendly export: no tables, columns, icons, or graphics.
      </div>
    </div>
  );
}
