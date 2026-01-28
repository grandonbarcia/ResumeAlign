import * as React from 'react';

type Variant = 'info' | 'success' | 'warning' | 'error';

const VARIANT_STYLES: Record<Variant, string> = {
  info: 'border-slate-200 bg-slate-50 text-slate-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  error: 'border-red-200 bg-red-50 text-red-800',
};

export function InlineAlert({
  variant = 'info',
  title,
  actions,
  children,
  className,
}: {
  variant?: Variant;
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        'rounded-md border p-3 text-sm ' +
        VARIANT_STYLES[variant] +
        (className ? ` ${className}` : '')
      }
      role={variant === 'error' ? 'alert' : 'status'}
    >
      {title || actions ? (
        <div className="flex items-start justify-between gap-3">
          <div className="font-medium">{title}</div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      ) : null}
      <div className={title || actions ? 'mt-1' : ''}>{children}</div>
    </div>
  );
}
