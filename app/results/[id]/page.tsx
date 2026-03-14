import Link from 'next/link';
import { CopyButton } from '@/components/CopyButton';
import { DiffView } from '@/components/DiffView';
import { ExportButtons } from '@/components/ExportButtons';
import { InlineAlert } from '@/components/InlineAlert';
import { MockModeBanner } from '@/components/MockModeBanner';
import { ResumeTextPreview } from '@/components/ResumeTextPreview';
import { getResumeById, getTailoringRunById } from '@/lib/localStore';
import {
  TailoringResultSchema,
  type TailoringResult,
} from '@/lib/tailoringSchemas';

export const dynamic = 'force-dynamic';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildFlexibleWhitespacePattern(value: string) {
  return escapeRegExp(value.trim()).replace(/\s+/g, '\\s+');
}

function applyBulletRewritesToPreviewText(args: {
  originalText: string;
  renderedText: string;
  bulletRewrite: TailoringResult['bulletRewrite'] | null | undefined;
}) {
  const sourceText = args.originalText.trim() || args.renderedText.trim();
  if (!sourceText) return '';
  if (!args.bulletRewrite?.experience?.length) return sourceText;

  let nextText = sourceText;

  for (const experience of args.bulletRewrite.experience) {
    for (const bullet of experience.rewrittenBullets) {
      const before = bullet.before.trim();
      const after = bullet.after.trim();
      if (!before || !after) continue;

      const pattern = buildFlexibleWhitespacePattern(before);
      const regex = new RegExp(pattern);
      if (regex.test(nextText)) {
        nextText = nextText.replace(regex, after);
      }
    }
  }

  return nextText;
}

function applySkillsRewriteToPreviewText(args: {
  text: string;
  skillsRewrite: TailoringResult['skillsRewrite'] | null | undefined;
}) {
  if (!args.text.trim()) return '';

  const finalSkills =
    args.skillsRewrite?.rewrittenSkills
      .map((skill) => skill.after.trim())
      .filter(Boolean) ?? [];

  if (!finalSkills.length) {
    return args.text;
  }

  const nextSkillsBlock = finalSkills.join(' • ');
  const skillsSectionRegex =
    /(\bSKILLS\b\s*)([\s\S]*?)(?=\b(?:WORK EXPERIENCE|EXPERIENCE|EDUCATION|PROJECTS|CERTIFICATIONS|ACHIEVEMENTS|SUMMARY)\b|$)/i;

  if (skillsSectionRegex.test(args.text)) {
    return args.text.replace(
      skillsSectionRegex,
      (_, heading: string) => `${heading}${nextSkillsBlock} `,
    );
  }

  return `SKILLS ${nextSkillsBlock}\n\n${args.text}`;
}

function isPlausibleStoredId(value: unknown) {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (!v) return false;
  if (/^undefined$/i.test(v)) return false;
  if (/^null$/i.test(v)) return false;
  return true;
}

export default async function ResultDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const { id } = await Promise.resolve(params);

  if (!isPlausibleStoredId(id)) {
    return (
      <main className="mx-auto max-w-7xl p-4 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">Results</h1>
          <Link className="underline" href="/dashboard">
            Dashboard
          </Link>
        </div>
        <InlineAlert variant="warning" className="mt-4">
          Invalid run id.
          <div className="mt-2 text-xs text-slate-600">
            Received: <span className="font-mono break-all">{String(id)}</span>
          </div>
        </InlineAlert>
      </main>
    );
  }

  let run = null;
  let resume = null;
  let error: string | null = null;

  try {
    run = await getTailoringRunById(id.trim());
    if (run?.resumeId) {
      resume = await getResumeById(run.resumeId);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load results.';
  }

  if (error) {
    return (
      <main className="mx-auto max-w-7xl p-4 sm:p-6">
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
      <main className="mx-auto max-w-7xl p-4 sm:p-6">
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
  const originalResumeText: string = resume?.originalText ?? '';
  const gapAnalysis = tailored?.gapAnalysis;
  const skillsOptimize = tailored?.skillsOptimize;
  const skillsRewrite = tailored?.skillsRewrite;
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

  const rewrittenBulletLines =
    bulletRewrite?.experience.flatMap((exp) =>
      exp.rewrittenBullets.map((bullet) => bullet.after),
    ) ?? [];
  const overwrittenBulletLines =
    bulletRewrite?.experience.flatMap((exp) =>
      exp.rewrittenBullets.map((bullet) => bullet.before),
    ) ?? [];

  const rewrittenSkillLines =
    skillsRewrite?.rewrittenSkills.map((skill) => skill.after) ?? [];
  const overwrittenSkillLines =
    skillsRewrite?.rewrittenSkills
      .map((skill) => skill.before)
      .filter((skill): skill is string => Boolean(skill)) ?? [];

  const bulletRewrittenPreviewText = applyBulletRewritesToPreviewText({
    originalText: originalResumeText,
    renderedText,
    bulletRewrite,
  });

  const tailoredPreviewText = applySkillsRewriteToPreviewText({
    text: bulletRewrittenPreviewText,
    skillsRewrite,
  });

  return (
    <main className="mx-auto max-w-7xl p-4 sm:p-6">
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
          Run id: <span className="font-mono break-all">{run.id}</span>
        </div>
        <CopyButton
          text={String(run.id)}
          label="Copy"
          ariaLabel="Copy run id"
        />
      </div>

      <section className="mt-6 rounded-lg border p-4">
        <h2 className="text-base font-semibold">Export</h2>
        <div className="mt-3">
          <ExportButtons
            runId={String(run.id)}
            hasOriginalFile={Boolean(resume?.originalFile)}
            originalFilename={resume?.originalFile?.filename}
            originalMimeType={resume?.originalFile?.mimeType}
          />
        </div>
      </section>

      <section className="mt-6 rounded-lg border p-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-base font-semibold">Resume preview</h2>
          <div className="text-xs text-slate-500">Original vs tailored</div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <ResumeTextPreview
            title="Original resume"
            subtitle="Uploaded text preview"
            text={originalResumeText}
            removedHighlightedLines={[
              ...overwrittenBulletLines,
              ...overwrittenSkillLines,
            ]}
            emptyLabel="(No original resume text found)"
            syncGroup="resume-preview"
          />
          <ResumeTextPreview
            title="Tailored resume"
            subtitle="Generated preview with applied rewrites"
            text={tailoredPreviewText}
            highlightedLines={[...rewrittenBulletLines, ...rewrittenSkillLines]}
            emptyLabel="(No tailored resume text found)"
            syncGroup="resume-preview"
          />
        </div>
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

      <section className="mt-6 rounded-lg border p-4">
        <h2 className="text-base font-semibold">Skills rewrites</h2>
        {!skillsRewrite?.rewrittenSkills?.length ? (
          <div className="mt-3 text-sm text-slate-700">
            No skills rewrites found.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {skillsRewrite.rewrittenSkills.map((skill, idx) => (
              <div
                key={`${skill.after}-${idx}`}
                className="rounded-md border bg-slate-50 p-4"
              >
                <div className="text-xs text-slate-500">Skill #{idx + 1}</div>

                <div className="mt-2">
                  <DiffView
                    before={skill.before ?? '(new skill)'}
                    after={skill.after}
                  />
                </div>

                <div className="mt-3 rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-800">
                  <div className="text-xs font-medium text-slate-700">
                    Rationale
                  </div>
                  <div className="mt-1">{skill.rationale}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
