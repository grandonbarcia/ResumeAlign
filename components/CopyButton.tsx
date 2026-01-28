'use client';

import * as React from 'react';
import { useToast } from '@/components/ToastProvider';

async function writeToClipboard(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  // Fallback for older browsers / insecure contexts.
  const el = document.createElement('textarea');
  el.value = text;
  el.setAttribute('readonly', '');
  el.style.position = 'fixed';
  el.style.left = '-9999px';
  el.style.top = '-9999px';
  document.body.appendChild(el);
  el.select();

  const ok = document.execCommand('copy');
  document.body.removeChild(el);
  if (!ok) throw new Error('Clipboard copy failed');
}

export function CopyButton({
  text,
  label = 'Copy',
  ariaLabel,
  className,
}: {
  text: string;
  label?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const { toast } = useToast();
  const [isCopying, setIsCopying] = React.useState(false);

  async function onCopy() {
    if (!text || isCopying) return;
    setIsCopying(true);
    try {
      await writeToClipboard(text);
      toast({ variant: 'success', message: 'Copied to clipboard.' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Copy failed';
      toast({ variant: 'error', message: msg });
    } finally {
      setIsCopying(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void onCopy()}
      disabled={!text || isCopying}
      aria-label={ariaLabel ?? `Copy ${label.toLowerCase()}`}
      className={
        'rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60' +
        (className ? ` ${className}` : '')
      }
    >
      {isCopying ? 'Copying…' : label}
    </button>
  );
}
