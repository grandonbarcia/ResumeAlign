'use client';

import * as React from 'react';

type ToastVariant = 'info' | 'success' | 'warning' | 'error';

type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
  createdAt: number;
};

type ToastInput = {
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastContextValue = {
  toast: (input: ToastInput) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

function randomId(): string {
  // Good enough for UI ephemeral ids.
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

const VARIANT_STYLES: Record<ToastVariant, string> = {
  info: 'border-slate-200 bg-white text-slate-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  error: 'border-red-200 bg-red-50 text-red-900',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    ({ message, variant = 'info', durationMs = 4500 }: ToastInput) => {
      const id = randomId();
      const createdAt = Date.now();
      setToasts((prev) => [...prev, { id, message, variant, createdAt }]);

      window.setTimeout(
        () => {
          dismiss(id);
        },
        Math.max(1200, durationMs),
      );
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              'pointer-events-auto rounded-md border px-3 py-2 text-sm shadow-sm ' +
              VARIANT_STYLES[t.variant]
            }
            role={t.variant === 'error' ? 'alert' : 'status'}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 break-words">{t.message}</div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                aria-label="Dismiss"
              >
                Close
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within <ToastProvider>.');
  }
  return ctx;
}
