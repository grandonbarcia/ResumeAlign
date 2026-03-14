'use client';

import * as React from 'react';

type ResumeTextPreviewProps = {
  title: string;
  subtitle: string;
  text: string;
  highlightedLines?: string[];
  removedHighlightedLines?: string[];
  emptyLabel?: string;
  syncGroup?: string;
};

const SECTION_HEADINGS = [
  'SUMMARY',
  'SKILLS',
  'WORK EXPERIENCE',
  'EXPERIENCE',
  'EDUCATION',
  'PROJECTS',
  'CERTIFICATIONS',
  'ACHIEVEMENTS',
];

function formatResumePreviewText(text: string) {
  if (!text.trim()) return '';

  let formatted = text.replace(/\r\n/g, '\n').trim();

  formatted = formatted.replace(/\s*([•●▪◦])\s*/g, '\n• ');
  formatted = formatted.replace(
    /\s*(\b(?:SUMMARY|SKILLS|WORK EXPERIENCE|EXPERIENCE|EDUCATION|PROJECTS|CERTIFICATIONS|ACHIEVEMENTS)\b)\s*/gi,
    '\n\n$1\n',
  );
  formatted = formatted.replace(/\s{2,}/g, ' ');
  formatted = formatted.replace(/\n{3,}/g, '\n\n');

  return formatted
    .split(/\n/)
    .map((line) => line.trim())
    .join('\n')
    .trim();
}

function isSectionHeading(line: string) {
  return SECTION_HEADINGS.includes(line.toUpperCase());
}

function isBulletLine(line: string) {
  return /^[-*•]/.test(line.trim());
}

function normalizeLine(value: string) {
  return value
    .replace(/^[-*•]\s*/, '')
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function lineMatchesHighlight(line: string, candidates: string[]) {
  const normalizedLine = normalizeLine(line);
  if (!normalizedLine) return false;

  return candidates.some((candidate) => {
    const normalizedCandidate = normalizeLine(candidate);
    if (!normalizedCandidate) return false;
    if (normalizedLine === normalizedCandidate) return true;

    const shorterLength = Math.min(
      normalizedLine.length,
      normalizedCandidate.length,
    );

    if (shorterLength < 24) {
      return false;
    }

    return (
      normalizedLine.includes(normalizedCandidate) ||
      normalizedCandidate.includes(normalizedLine)
    );
  });
}

export function ResumeTextPreview({
  title,
  subtitle,
  text,
  highlightedLines = [],
  removedHighlightedLines = [],
  emptyLabel = '(No text found)',
  syncGroup,
}: ResumeTextPreviewProps) {
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const suppressSyncRef = React.useRef(false);
  const formattedText = React.useMemo(
    () => formatResumePreviewText(text),
    [text],
  );
  const lines = formattedText ? formattedText.split(/\r?\n/) : [];
  const highlighted = React.useMemo(
    () => highlightedLines.map((line) => normalizeLine(line)).filter(Boolean),
    [highlightedLines],
  );
  const removedHighlighted = React.useMemo(
    () =>
      removedHighlightedLines
        .map((line) => normalizeLine(line))
        .filter(Boolean),
    [removedHighlightedLines],
  );

  React.useEffect(() => {
    if (!syncGroup) return;

    const current = scrollRef.current;
    if (!current) return;

    const onScroll = () => {
      if (suppressSyncRef.current) {
        suppressSyncRef.current = false;
        return;
      }

      const maxScrollTop = current.scrollHeight - current.clientHeight;
      const ratio = maxScrollTop > 0 ? current.scrollTop / maxScrollTop : 0;
      const groupNodes = document.querySelectorAll<HTMLDivElement>(
        `[data-scroll-sync-group="${syncGroup}"]`,
      );

      groupNodes.forEach((node) => {
        if (node === current) return;
        const targetMaxScrollTop = node.scrollHeight - node.clientHeight;
        const nextScrollTop =
          targetMaxScrollTop > 0 ? ratio * targetMaxScrollTop : 0;
        if (Math.abs(node.scrollTop - nextScrollTop) < 1) return;
        node.dataset.syncing = 'true';
        node.scrollTop = nextScrollTop;
      });
    };

    const onSyncedScroll = () => {
      if (current.dataset.syncing === 'true') {
        suppressSyncRef.current = true;
        delete current.dataset.syncing;
      }
    };

    current.addEventListener('scroll', onScroll, { passive: true });
    current.addEventListener('scroll', onSyncedScroll, { passive: true });

    return () => {
      current.removeEventListener('scroll', onScroll);
      current.removeEventListener('scroll', onSyncedScroll);
    };
  }, [syncGroup]);

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <div className="text-xs text-slate-500">{subtitle}</div>
      </div>

      <div
        ref={scrollRef}
        data-scroll-sync-group={syncGroup}
        className="mt-3 max-h-130 overflow-auto rounded-md border bg-slate-50 p-4 text-sm leading-7 text-slate-800"
      >
        {lines.length ? (
          <div className="space-y-2 wrap-break-word text-[14px]">
            {lines.map((line, idx) => {
              const isHighlighted = lineMatchesHighlight(line, highlighted);
              const isRemovedHighlighted = lineMatchesHighlight(
                line,
                removedHighlighted,
              );
              const isHeading = isSectionHeading(line);
              const isBullet = isBulletLine(line);
              return (
                <div
                  key={`${idx}-${line}`}
                  className={[
                    isHeading
                      ? 'mt-4 border-b border-slate-200 pb-1 text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase first:mt-0'
                      : '',
                    isBullet ? 'pl-4 text-slate-800' : 'text-slate-700',
                    isHighlighted
                      ? 'rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-950'
                      : isRemovedHighlighted
                        ? 'rounded border border-rose-200 bg-rose-50 px-3 py-2 text-rose-950'
                        : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {line || ' '}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="whitespace-pre-wrap text-sm leading-6 text-slate-500">
            {emptyLabel}
          </div>
        )}
      </div>

      {highlighted.length || removedHighlighted.length ? (
        <div className="mt-3 text-xs text-slate-500">
          {highlighted.length
            ? 'Green highlights mark rewritten bullets applied to the tailored resume.'
            : null}
          {highlighted.length && removedHighlighted.length ? ' ' : null}
          {removedHighlighted.length
            ? 'Red highlights mark original bullets that were replaced in the tailored resume.'
            : null}
        </div>
      ) : null}
    </div>
  );
}
