import Link from 'next/link';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { DiffView } from '@/components/DiffView';
import { ExportButtons } from '@/components/ExportButtons';
import { MockModeBanner } from '@/components/MockModeBanner';
import { InlineAlert } from '@/components/InlineAlert';
import { CopyButton } from '@/components/CopyButton';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import {
  TailoringResultSchema,
  type TailoringResult,
} from '@/lib/tailoringSchemas';

export const dynamic = 'force-dynamic';

const hasClerkKeys = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

async function getUserId(): Promise<string> {
  if (!hasClerkKeys) return 'anonymous';
  const mod = await import('@clerk/nextjs/server');
  const { userId } = await mod.auth();
  return userId ?? 'anonymous';
}

export default async function ResultDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!convexUrl) {
    return (
      <main className="mx-auto max-w-3xl p-4 sm:p-6">
        <h1 className="text-2xl font-semibold">Results</h1>
        <p className="mt-2 text-slate-600">
          Convex is not configured. Set{' '}
          <span className="font-mono">NEXT_PUBLIC_CONVEX_URL</span>.
        </p>
        <div className="mt-6">
          <Link className="underline" href="/upload">
            Back to Upload
          </Link>
        </div>
      </main>
    );
  }

  const userId = await getUserId();
  const client = new ConvexHttpClient(convexUrl);

  let run: Doc<'tailoringRuns'> | null = null;
  let error: string | null = null;

  try {
    run = await client.query(api.tailoringRuns.getMineById, {
      userId,
      id: id as Id<'tailoringRuns'>,
    });
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load results.';
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl p-4 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">Results</h1>
          <Link className="underline" href="/dashboard">
            Dashboard
          </Link>
        </div>
        <InlineAlert variant="error" className="mt-4">
          {error}
        </InlineAlert>
      </main>
    );
  }

  if (!run) {
    return (
      <main className="mx-auto max-w-3xl p-4 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">Results</h1>
          <Link className="underline" href="/dashboard">
            Dashboard
          </Link>
        </div>
        <p className="mt-4 text-slate-700">Run not found.</p>
      </main>
    );
  }

  let tailored: TailoringResult | null = null;
  try {
    tailored = TailoringResultSchema.parse(run.tailored);
  } catch {
    tailored = null;
  }

  const renderedText: string = tailored?.renderedText ?? '';
  const gapAnalysis = tailored?.gapAnalysis;
  const skillsOptimize = tailored?.skillsOptimize;
  const bulletRewrite = tailored?.bulletRewrite;
  const originalSkillsRaw = tailored?.originalSkills;
  const optimizedSkillsRaw = tailored?.tailored?.skills;

  function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((v) => typeof v === 'string');
  }

  const originalSkills = isStringArray(originalSkillsRaw)
    ? originalSkillsRaw
    : null;
  const optimizedSkills = isStringArray(optimizedSkillsRaw)
    ? optimizedSkillsRaw
    : [];

  const originalSet = new Set(originalSkills ?? []);
  const optimizedSet = new Set(optimizedSkills);

  const addedSkills = optimizedSkills.filter((s) => !originalSet.has(s));
  const removedSkills = (originalSkills ?? []).filter(
    (s) => !optimizedSet.has(s),
  );

  const originalIndex = new Map<string, number>();
  (originalSkills ?? []).forEach((s, idx) => originalIndex.set(s, idx));
  const optimizedIndex = new Map<string, number>();
  optimizedSkills.forEach((s, idx) => optimizedIndex.set(s, idx));

  const movedUp = optimizedSkills
    .filter((s) => originalIndex.has(s))
    .map((s) => {
      const from = originalIndex.get(s)!;
      const to = optimizedIndex.get(s)!;
      return { s, delta: from - to };
    })
    .filter((x) => x.delta >= 3)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 12)
    .map((x) => x.s);

  const movedDown = optimizedSkills
    .filter((s) => originalIndex.has(s))
    .map((s) => {
      const from = originalIndex.get(s)!;
      const to = optimizedIndex.get(s)!;
      return { s, delta: to - from };
    })
    .filter((x) => x.delta >= 3)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 12)
    .map((x) => x.s);

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Tailoring results</h1>
        <div className="flex flex-wrap items-center gap-4">
          <Link className="underline" href="/dashboard">
            Dashboard
          </Link>
          <Link className="underline" href="/upload">
            New run
          </Link>
        </div>
      </div>

      <div className="mt-4">
        <MockModeBanner />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <div className="min-w-0">
          Run id: <span className="font-mono break-all">{run._id}</span>
        </div>
        <CopyButton
          text={String(run._id)}
          label="Copy"
          ariaLabel="Copy run id"
        />
      </div>

      <section className="mt-6 rounded-lg border p-4">
        <h2 className="text-base font-semibold">Export</h2>
        <div className="mt-3">
          <ExportButtons runId={String(run._id)} />
        </div>
      </section>

      <section className="mt-6 rounded-lg border p-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-base font-semibold">ATS resume text</h2>
          <div className="text-xs text-slate-500">Preview</div>
        </div>
        <pre className="mt-3 max-h-130 overflow-auto whitespace-pre-wrap text-sm leading-6 text-slate-800">
          {renderedText || '(No rendered text found)'}
        </pre>
      </section>

      <section className="mt-6 rounded-lg border p-4">
        <h2 className="text-base font-semibold">Gap analysis</h2>
        <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap text-sm leading-6 text-slate-800">
          {JSON.stringify(gapAnalysis ?? null, null, 2)}
        </pre>
      </section>

      <section className="mt-6 rounded-lg border p-4">
        <h2 className="text-base font-semibold">Skills changes</h2>

        {originalSkills ? (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border bg-slate-50 p-3">
              <div className="text-xs font-medium text-slate-700">
                Original skills
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {originalSkills.length ? (
                  originalSkills.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border bg-white px-2 py-1 text-xs text-slate-800"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-700">(None)</span>
                )}
              </div>
            </div>

            <div className="rounded-md border bg-slate-50 p-3">
              <div className="text-xs font-medium text-slate-700">
                Optimized skills
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {optimizedSkills.length ? (
                  optimizedSkills.map((s) => (
                    <span
                      key={s}
                      className={
                        'rounded-full border bg-white px-2 py-1 text-xs ' +
                        (addedSkills.includes(s)
                          ? 'border-amber-300 bg-amber-50 text-amber-900'
                          : 'text-slate-800')
                      }
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-700">(None)</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-3 text-sm text-slate-700">
            Original skills were not captured for this run (re-run tailoring to
            see a full skills diff).
          </div>
        )}

        {addedSkills.length ? (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <div className="font-medium">Safety warning</div>
            <div className="mt-1">
              These skills appear in the optimized list but not in the original
              skills list:
            </div>
            <div className="mt-2 font-mono text-xs">
              {addedSkills.join(', ')}
            </div>
          </div>
        ) : null}

        {removedSkills.length ? (
          <div className="mt-4 rounded-md border bg-slate-50 p-3 text-sm text-slate-800">
            <div className="text-xs font-medium text-slate-700">
              Dropped skills
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Allowed: the optimizer may drop less relevant skills.
            </div>
            <div className="mt-2 font-mono text-xs">
              {removedSkills.join(', ')}
            </div>
          </div>
        ) : null}

        {movedUp.length || movedDown.length ? (
          <div className="mt-4 rounded-md border bg-slate-50 p-3 text-sm text-slate-800">
            <div className="text-xs font-medium text-slate-700">
              Biggest position changes
            </div>
            {movedUp.length ? (
              <div className="mt-2">
                <div className="text-xs text-slate-500">Moved up</div>
                <div className="mt-1 font-mono text-xs">
                  {movedUp.join(', ')}
                </div>
              </div>
            ) : null}
            {movedDown.length ? (
              <div className="mt-3">
                <div className="text-xs text-slate-500">Moved down</div>
                <div className="mt-1 font-mono text-xs">
                  {movedDown.join(', ')}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {skillsOptimize?.rationale?.length ? (
          <div className="mt-4 rounded-md border bg-slate-50 p-3 text-sm text-slate-800">
            <div className="text-xs font-medium text-slate-700">Reasoning</div>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {skillsOptimize.rationale.map((r, idx) => (
                <li key={idx}>{r}</li>
              ))}
            </ul>
          </div>
        ) : skillsOptimize?.notes ? (
          <div className="mt-4 rounded-md border bg-slate-50 p-3 text-sm text-slate-800">
            <div className="text-xs font-medium text-slate-700">Notes</div>
            <div className="mt-2">{String(skillsOptimize.notes)}</div>
          </div>
        ) : null}

        <details className="mt-4 rounded-md border bg-white p-3">
          <summary className="cursor-pointer text-xs font-medium text-slate-700">
            Show raw skills optimization JSON
          </summary>
          <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap text-sm leading-6 text-slate-800">
            {JSON.stringify(skillsOptimize ?? null, null, 2)}
          </pre>
        </details>
      </section>

      <section className="mt-6 rounded-lg border p-4">
        <h2 className="text-base font-semibold">Bullet rewrites</h2>
        {!bulletRewrite?.experience?.length ? (
          <div className="mt-3 text-sm text-slate-700">
            No bullet rewrites found.
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            {bulletRewrite.experience.map((exp, expIdx) => (
              <div key={expIdx} className="rounded-md border bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">
                  {exp.title} — {exp.company}
                </div>

                {!exp.rewrittenBullets?.length ? (
                  <div className="mt-2 text-sm text-slate-700">
                    No bullet changes for this role.
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    {exp.rewrittenBullets.map((b, idx) => (
                      <div key={idx} className="rounded-md border bg-white p-4">
                        <div className="text-xs text-slate-500">
                          Bullet #
                          {typeof b.index === 'number' ? b.index + 1 : '?'}
                        </div>

                        <div className="mt-2">
                          <DiffView before={b.before} after={b.after} />
                        </div>

                        {b.rationale ? (
                          <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">
                            <div className="text-xs font-medium text-slate-700">
                              Rationale
                            </div>
                            <div className="mt-1">{String(b.rationale)}</div>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
