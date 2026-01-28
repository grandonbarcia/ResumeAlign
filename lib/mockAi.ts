import { StructuredJobSchema, type StructuredJob } from '@/lib/jobStructured';
import {
  StructuredResumeSchema,
  type StructuredResume,
} from '@/lib/resumeStructured';
import {
  BulletRewriteSchema,
  GapAnalysisSchema,
  SkillsOptimizeSchema,
  type BulletRewrite,
  type GapAnalysis,
  type SkillsOptimize,
} from '@/lib/tailoringSchemas';

function splitLines(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

function uniqueStrings(values: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of values) {
    const key = v.trim();
    if (!key) continue;
    const lower = key.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    out.push(key);
  }
  return out;
}

function extractEmail(text: string): string | undefined {
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0];
}

function extractPhone(text: string): string | undefined {
  const match = text.match(
    /(\+?\d{1,3}[\s.-]?)?(\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/,
  );
  return match?.[0];
}

function extractLinks(text: string): string[] {
  const matches = text.match(/(https?:\/\/[^\s)\]]+|www\.[^\s)\]]+)/gi);
  return uniqueStrings(matches ?? []);
}

const KEYWORD_PATTERNS: Array<{ label: string; re: RegExp }> = [
  { label: 'TypeScript', re: /\btypescript\b/i },
  { label: 'JavaScript', re: /\bjavascript\b/i },
  { label: 'React', re: /\breact\b/i },
  { label: 'Next.js', re: /\bnext(\.js)?\b/i },
  { label: 'Node.js', re: /\bnode(\.js)?\b/i },
  { label: 'Tailwind CSS', re: /\btailwind\b/i },
  { label: 'HTML', re: /\bhtml\b/i },
  { label: 'CSS', re: /\bcss\b/i },
  { label: 'REST', re: /\brest\b/i },
  { label: 'GraphQL', re: /\bgraphql\b/i },
  { label: 'SQL', re: /\bsql\b/i },
  { label: 'PostgreSQL', re: /\bpostgres(ql)?\b/i },
  { label: 'MongoDB', re: /\bmongo(db)?\b/i },
  { label: 'AWS', re: /\baws\b|amazon web services/i },
  { label: 'Docker', re: /\bdocker\b/i },
  { label: 'Kubernetes', re: /\bkubernetes\b|\bk8s\b/i },
  { label: 'Python', re: /\bpython\b/i },
  { label: 'Java', re: /\bjava\b/i },
  { label: 'C#', re: /\bc#\b/i },
  {
    label: 'Testing',
    re: /\b(unit tests?|integration tests?|jest|vitest|playwright)\b/i,
  },
  {
    label: 'CI/CD',
    re: /\bci\/?cd\b|continuous integration|continuous delivery/i,
  },
  { label: 'Agile', re: /\bagile\b|scrum|kanban/i },
  { label: 'Communication', re: /\bcommunication\b/i },
  { label: 'Leadership', re: /\bleadership\b/i },
];

function extractKeywords(text: string): string[] {
  const out: string[] = [];
  for (const { label, re } of KEYWORD_PATTERNS) {
    if (re.test(text)) out.push(label);
  }
  return uniqueStrings(out);
}

function extractSkillLikeTokens(text: string): string[] {
  const lines = splitLines(text);
  const skills: string[] = [];

  // Heuristic: if there is a "Skills" line, parse the next few lines too.
  const skillsIdx = lines.findIndex((l) => /^skills\b/i.test(l));
  const windowLines =
    skillsIdx >= 0 ? lines.slice(skillsIdx, skillsIdx + 5) : lines.slice(0, 12);

  for (const l of windowLines) {
    const cleaned = l
      .replace(/^skills\s*[:\-–—]?\s*/i, '')
      .replace(/[•·]/g, ',')
      .replace(/\s{2,}/g, ' ');
    for (const token of cleaned.split(/,|\||\/|;/g)) {
      const t = token.trim();
      if (!t) continue;
      if (t.length > 40) continue;
      if (/\d{4}/.test(t)) continue;
      skills.push(t);
    }
  }

  return uniqueStrings(skills);
}

function pickNameCandidate(lines: string[]): string | undefined {
  const first = lines[0];
  if (!first) return undefined;

  // Avoid picking headings like "RESUME" or "SUMMARY".
  if (
    /^(resume|curriculum vitae|cv|summary|experience|education|skills)\b/i.test(
      first,
    )
  ) {
    return undefined;
  }

  // Basic sanity: at least two words, mostly letters.
  const words = first.split(/\s+/).filter(Boolean);
  const letters = first.replace(/[^a-z]/gi, '').length;
  if (words.length >= 2 && letters >= Math.min(10, first.length)) return first;

  return undefined;
}

function extractBullets(text: string, max = 8): string[] {
  const rawLines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  const bullets: string[] = [];
  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const m = trimmed.match(/^([\-*•])\s+(.*)$/);
    if (m?.[2]) bullets.push(m[2].trim());
    if (bullets.length >= max) break;
  }
  return uniqueStrings(bullets);
}

export function mockStructureResume(args: {
  originalText: string;
  filename?: string;
}): StructuredResume {
  const lines = splitLines(args.originalText);
  const email = extractEmail(args.originalText);
  const phone = extractPhone(args.originalText);
  const links = extractLinks(args.originalText);
  const fullName = pickNameCandidate(lines);

  const skillTokens = uniqueStrings([
    ...extractSkillLikeTokens(args.originalText),
    ...extractKeywords(args.originalText),
  ]);

  const bullets = extractBullets(args.originalText, 10);

  const structured: StructuredResume = {
    basics: {
      fullName,
      email,
      phone,
      location: undefined,
      links: links.length ? links : undefined,
    },
    summary:
      skillTokens.length >= 2
        ? `Software engineer with experience in ${skillTokens
            .slice(0, 5)
            .join(', ')}.`
        : undefined,
    skills: skillTokens,
    experience: [
      {
        company: 'Previous Company',
        title: 'Software Engineer',
        bullets:
          bullets.length >= 2
            ? bullets.slice(0, 6)
            : [
                'Built and shipped product features in a cross-functional team.',
                'Improved reliability and performance through testing and monitoring.',
              ],
      },
    ],
    education: [],
    projects: [],
    certifications: [],
  };

  return StructuredResumeSchema.parse(structured);
}

export function mockStructureJob(args: {
  rawText: string;
  sourceUrl?: string;
  titleHint?: string;
}): StructuredJob {
  const keywords = extractKeywords(args.rawText);
  const skills = keywords;
  const responsibilities = extractBullets(args.rawText, 10);

  const structured: StructuredJob = {
    title: args.titleHint || 'Software Engineer',
    company: undefined,
    location: undefined,
    employmentType: undefined,
    summary:
      skills.length >= 2
        ? `Looking for a candidate with experience in ${skills
            .slice(0, 6)
            .join(', ')}.`
        : undefined,
    responsibilities,
    requirements: [],
    skills,
    keywords: uniqueStrings([...keywords, ...skills]),
  };

  return StructuredJobSchema.parse(structured);
}

export function mockGapAnalysis(args: {
  resume: StructuredResume;
  job: StructuredJob;
}): GapAnalysis {
  const resumeSkills = new Set(
    (args.resume.skills ?? []).map((s) => s.toLowerCase()),
  );
  const jobKeywords = uniqueStrings([
    ...(args.job.skills ?? []),
    ...(args.job.keywords ?? []),
  ]);

  const matched = jobKeywords.filter((k) => resumeSkills.has(k.toLowerCase()));
  const missing = jobKeywords.filter((k) => !resumeSkills.has(k.toLowerCase()));

  const strengths = matched.length
    ? [
        `Matches ${matched.length} job keywords: ${matched.slice(0, 8).join(', ')}.`,
      ]
    : ['Resume does not clearly surface job keywords in the skills section.'];

  const risks = missing.length
    ? [`Missing/unclear keywords: ${missing.slice(0, 10).join(', ')}.`]
    : ['No obvious keyword gaps detected.'];

  const suggestedSummaryPoints = uniqueStrings([
    matched.length
      ? `Highlight strengths in ${matched.slice(0, 3).join(', ')}.`
      : 'Add a 1–2 line summary aligned to the role.',
    missing.length
      ? `If true, add evidence for ${missing.slice(0, 3).join(', ')}.`
      : '',
    'Quantify impact (latency, conversion, cost, reliability) where possible.',
  ]).filter(Boolean);

  const suggestedSkillOrder = uniqueStrings([
    ...matched,
    ...missing,
    ...(args.resume.skills ?? []),
  ]).slice(0, 30);

  return GapAnalysisSchema.parse({
    matchedKeywords: matched,
    missingKeywords: missing,
    strengths,
    risks,
    suggestedSummaryPoints,
    suggestedSkillOrder,
  });
}

export function mockBulletRewrite(args: {
  resume: StructuredResume;
  job: StructuredJob;
  gap: GapAnalysis;
}): BulletRewrite {
  const highlight = uniqueStrings([
    ...(args.gap.matchedKeywords ?? []),
    ...(args.gap.missingKeywords ?? []),
  ]).slice(0, 3);

  const experience = (args.resume.experience ?? []).map((exp) => {
    const rewrittenBullets = (exp.bullets ?? [])
      .slice(0, 2)
      .map((before, idx) => {
        const addition = highlight.length ? ` (${highlight.join(', ')})` : '';
        const after = before.endsWith('.')
          ? `${before}${addition}`
          : `${before}.${addition}`;

        return {
          index: idx,
          before,
          after,
          rationale: highlight.length
            ? `Surfaced relevant keywords: ${highlight.join(', ')}.`
            : 'Improved clarity and impact with a tighter phrasing.',
        };
      });

    return {
      company: exp.company,
      title: exp.title,
      rewrittenBullets,
    };
  });

  return BulletRewriteSchema.parse({
    experience,
    notes:
      'Mock rewrite: this is a heuristic preview (no external AI key configured).',
  });
}

export function mockSkillsOptimize(args: {
  resume: StructuredResume;
  job: StructuredJob;
  gap: GapAnalysis;
}): SkillsOptimize {
  const resumeSkills = uniqueStrings(args.resume.skills ?? []);
  const jobSkills = uniqueStrings(args.job.skills ?? []);

  const resumeSet = new Set(resumeSkills.map((s) => s.toLowerCase()));
  const jobSet = new Set(jobSkills.map((s) => s.toLowerCase()));

  const primary = jobSkills.slice(0, 12);
  const secondary = resumeSkills
    .filter((s) => !jobSet.has(s.toLowerCase()))
    .slice(0, 12);
  const other = uniqueStrings([
    ...(args.gap.matchedKeywords ?? []),
    ...(args.gap.missingKeywords ?? []),
  ])
    .filter(
      (s) => !resumeSet.has(s.toLowerCase()) && !jobSet.has(s.toLowerCase()),
    )
    .slice(0, 12);

  const rationale = uniqueStrings([
    primary.length
      ? `Prioritized job-relevant skills first: ${primary.slice(0, 5).join(', ')}.`
      : '',
    secondary.length ? 'Kept additional resume skills as secondary.' : '',
    'Order skills by relevance to the target job description.',
  ]).filter(Boolean);

  return SkillsOptimizeSchema.parse({
    primary,
    secondary,
    other,
    rationale,
    notes:
      'Mock optimization: ordering is heuristic until an AI provider is configured.',
  });
}
