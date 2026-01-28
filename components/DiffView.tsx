'use client';

import * as React from 'react';

type DiffOp = { type: 'equal' | 'insert' | 'delete'; text: string };

function tokenize(s: string): string[] {
  return s.trim().split(/\s+/).filter(Boolean);
}

function lcsTable(a: string[], b: string[]) {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array.from({ length: n + 1 }, () => 0),
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  return dp;
}

function diffTokens(beforeTokens: string[], afterTokens: string[]): DiffOp[] {
  const dp = lcsTable(beforeTokens, afterTokens);
  let i = beforeTokens.length;
  let j = afterTokens.length;

  const ops: DiffOp[] = [];

  while (i > 0 && j > 0) {
    if (beforeTokens[i - 1] === afterTokens[j - 1]) {
      ops.push({ type: 'equal', text: beforeTokens[i - 1] });
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      ops.push({ type: 'delete', text: beforeTokens[i - 1] });
      i--;
    } else {
      ops.push({ type: 'insert', text: afterTokens[j - 1] });
      j--;
    }
  }

  while (i > 0) {
    ops.push({ type: 'delete', text: beforeTokens[i - 1] });
    i--;
  }
  while (j > 0) {
    ops.push({ type: 'insert', text: afterTokens[j - 1] });
    j--;
  }

  ops.reverse();

  // Coalesce consecutive ops into chunks for nicer rendering.
  const chunks: DiffOp[] = [];
  for (const op of ops) {
    const last = chunks[chunks.length - 1];
    if (last && last.type === op.type) {
      last.text += ` ${op.text}`;
    } else {
      chunks.push({ ...op });
    }
  }

  return chunks;
}

export function DiffView(props: { before: string; after: string }) {
  const beforeTokens = React.useMemo(
    () => tokenize(props.before),
    [props.before],
  );
  const afterTokens = React.useMemo(() => tokenize(props.after), [props.after]);

  const chunks = React.useMemo(
    () => diffTokens(beforeTokens, afterTokens),
    [beforeTokens, afterTokens],
  );

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-slate-700">After (diff)</div>
      <div className="rounded-md border bg-white p-3 text-sm leading-6">
        {chunks.map((c, idx) => {
          const common = 'whitespace-pre-wrap break-words';
          if (c.type === 'equal') {
            return (
              <span key={idx} className={common}>
                {c.text + ' '}
              </span>
            );
          }
          if (c.type === 'insert') {
            return (
              <span
                key={idx}
                className={
                  common + ' rounded bg-emerald-100 px-1 text-emerald-900'
                }
              >
                {c.text + ' '}
              </span>
            );
          }
          return (
            <span
              key={idx}
              className={
                common + ' rounded bg-rose-100 px-1 text-rose-900 line-through'
              }
            >
              {c.text + ' '}
            </span>
          );
        })}
      </div>

      <details className="rounded-md border bg-slate-50 p-3">
        <summary className="cursor-pointer text-xs font-medium text-slate-700">
          Show before
        </summary>
        <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
          {props.before}
        </div>
      </details>
    </div>
  );
}
