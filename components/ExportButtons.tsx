'use client';

import * as React from 'react';

type ExportKind = 'pdf' | 'docx';

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

export function ExportButtons(props: {
  runId: string;
  hasOriginalFile?: boolean;
  originalFilename?: string;
  originalMimeType?: string;
}) {
  const [isPdf, setIsPdf] = React.useState(false);
  const [isDocx, setIsDocx] = React.useState(false);
  const [isOriginal, setIsOriginal] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function exportRun(kind: ExportKind) {
    setError(null);
    if (kind === 'pdf') {
      setIsPdf(true);
    } else {
      setIsDocx(true);
    }

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
      if (kind === 'pdf') {
        setIsPdf(false);
      } else {
        setIsDocx(false);
      }
    }
  }

  async function exportOriginal() {
    setError(null);
    setIsOriginal(true);

    try {
      const res = await fetch('/api/export/original', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ runId: props.runId }),
      });

      const contentType = res.headers.get('content-type') ?? '';

      if (!res.ok) {
        if (contentType.includes('application/json')) {
          const data = (await res.json()) as { error?: string };
          setError(data.error ?? 'Original export failed');
        } else {
          setError('Original export failed');
        }
        return;
      }

      const blob = await res.blob();
      await downloadBlob(
        blob,
        props.originalFilename || 'resumealign-original',
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Original export failed');
    } finally {
      setIsOriginal(false);
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
        {props.hasOriginalFile ? (
          <button
            type="button"
            onClick={() => void exportOriginal()}
            disabled={isOriginal}
            className="rounded-md border border-emerald-300 px-3 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isOriginal
              ? 'Preparing original…'
              : props.originalMimeType === 'application/pdf'
                ? 'Download original PDF'
                : 'Download original file'}
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="text-xs text-slate-500">
        ATS-friendly export: no tables, columns, icons, or graphics.
      </div>
      {props.hasOriginalFile ? (
        <div className="text-xs text-slate-500">
          Original download preserves the uploaded file exactly. Tailored PDF
          and DOCX are still regenerated from ATS text.
        </div>
      ) : (
        <div className="text-xs text-slate-500">
          Original-file download is available for resumes saved after this
          update.
        </div>
      )}
    </div>
  );
}
