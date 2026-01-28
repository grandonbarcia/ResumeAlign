import { StructuredJobSchema, type StructuredJob } from '@/lib/jobStructured';
import {
  StructuredResumeSchema,
  type StructuredResume,
} from '@/lib/resumeStructured';
import {
  BulletRewriteSchema,
  GapAnalysisSchema,
  SkillsOptimizeSchema,
  TailoringResultSchema,
  type TailoringResult,
  type TailoredResume,
} from '@/lib/tailoringSchemas';
import { createOpenAIClient, getOpenAIModel } from '@/lib/openaiClient';
import { chatJson } from '@/lib/jsonModel';
import { gapAnalysisPrompt } from '@/prompts/gapAnalysis';
import { bulletRewritePrompt } from '@/prompts/bulletRewrite';
import { skillsOptimizePrompt } from '@/prompts/skillsOptimize';
import { structureResumePrompt } from '@/prompts/structureResume';
import { structureJobPrompt } from '@/prompts/structureJob';
import { renderATSResumeText } from '@/lib/renderResume';
import {
  mockBulletRewrite,
  mockGapAnalysis,
  mockSkillsOptimize,
  mockStructureJob,
  mockStructureResume,
} from '@/lib/mockAi';

export type TailorPipelineInput = {
  resume: {
    filename?: string;
    originalText: string;
    parsed?: unknown;
  };
  job: {
    sourceUrl?: string;
    rawText: string;
    structured?: unknown;
  };
};

function safeJsonStringify(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function normalizeKey(s: string) {
  return s.trim().toLowerCase();
}

function uniqueByKey(values: string[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of values) {
    const key = normalizeKey(v);
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

function buildSkillCanonicalMap(skills: string[]) {
  const map = new Map<string, string>();
  for (const s of skills) {
    const key = normalizeKey(s);
    if (!key) continue;
    if (!map.has(key)) map.set(key, s);
  }
  return map;
}

function filterToAllowedSkills(args: {
  skills: string[];
  allowed: Map<string, string>;
}): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of args.skills) {
    const key = normalizeKey(s);
    if (!key) continue;
    const canonical = args.allowed.get(key);
    if (!canonical) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(canonical);
  }
  return out;
}

function extractNumberTokens(text: string): string[] {
  // Tokens like 10, 10.5, 1,000, 20%, $5,000
  const matches = text.match(/[$€£]?\d[\d,]*(?:\.\d+)?%?/g);
  return (matches ?? []).map((m) => m.replace(/,/g, '').trim());
}

function extractUrlTokens(text: string): string[] {
  const matches = text.match(/\b(https?:\/\/\S+|www\.[^\s)\]]+)\b/gi);
  return (matches ?? []).map((m) => m.trim());
}

function extractAcronymTokens(text: string): string[] {
  // Examples: API, SRE, CI/CD, AWS, SOC2
  const matches = text.match(/\b[A-Z]{2,}(?:[\/-][A-Z]{2,})*\b/g);
  return (matches ?? []).map((m) => m.trim());
}

function extractTechLikeTokens(text: string): string[] {
  // Heuristic tokens that often represent technologies/skills.
  // Examples: TypeScript, Next.js, Node.js, PostgresQL, C#, C++, React, GraphQL
  const matches = text.match(/\b[A-Za-z][A-Za-z0-9.+#/-]{1,}\b/g);
  const tokens = (matches ?? []).map((m) => m.trim());

  return tokens.filter((t) => {
    if (t.length < 2) return false;
    // Ignore common sentence words.
    if (
      /^(the|and|for|with|from|into|over|under|to|of|in|on|at|by|as|a|an)$/i.test(
        t,
      )
    ) {
      return false;
    }

    const hasSpecial = /[.+#/-]/.test(t);
    const hasDigit = /\d/.test(t);
    const isAllCaps = /^[A-Z]{2,}$/.test(t);
    const isCamel = /[A-Z]/.test(t) && /[a-z]/.test(t);
    const isKnownSuffix = /(\.js|\.net)$/i.test(t);

    // Only keep tokens that look "tech-like".
    return hasSpecial || hasDigit || isAllCaps || isCamel || isKnownSuffix;
  });
}

function buildResumeEvidenceText(resume: StructuredResume): string {
  const parts: string[] = [];
  if (resume.summary) parts.push(resume.summary);
  if (resume.skills?.length) parts.push(resume.skills.join('\n'));
  if (resume.certifications?.length)
    parts.push(resume.certifications.join('\n'));

  if (resume.basics?.links?.length) parts.push(resume.basics.links.join('\n'));
  if (resume.basics?.fullName) parts.push(resume.basics.fullName);
  if (resume.basics?.email) parts.push(resume.basics.email);
  if (resume.basics?.phone) parts.push(resume.basics.phone);
  if (resume.basics?.location) parts.push(resume.basics.location);

  for (const exp of resume.experience ?? []) {
    parts.push(exp.company);
    parts.push(exp.title);
    if (exp.bullets?.length) parts.push(exp.bullets.join('\n'));
  }

  for (const proj of resume.projects ?? []) {
    parts.push(proj.name);
    if (proj.description) parts.push(proj.description);
    if (proj.bullets?.length) parts.push(proj.bullets.join('\n'));
    if (proj.links?.length) parts.push(proj.links.join('\n'));
  }

  for (const edu of resume.education ?? []) {
    parts.push(edu.school);
    if (edu.degree) parts.push(edu.degree);
    if (edu.field) parts.push(edu.field);
  }

  return parts.filter(Boolean).join('\n');
}

function hasOnlySameNumbers(args: { before: string; after: string }) {
  const beforeNums = new Set(extractNumberTokens(args.before));
  const afterNums = new Set(extractNumberTokens(args.after));

  if (beforeNums.size !== afterNums.size) return false;
  for (const n of beforeNums) if (!afterNums.has(n)) return false;
  return true;
}

function shouldUseMockAI() {
  const mode = (
    process.env.AI_MODE ||
    process.env.AI_PROVIDER ||
    ''
  ).toLowerCase();
  return mode === 'mock' || !process.env.OPENAI_API_KEY;
}

async function structureResumeIfNeeded(args: {
  originalText: string;
  filename?: string;
  parsed?: unknown;
}) {
  if (args.parsed) {
    try {
      return StructuredResumeSchema.parse(args.parsed);
    } catch {
      // fall through to AI
    }
  }

  if (shouldUseMockAI()) {
    return mockStructureResume({
      originalText: args.originalText,
      filename: args.filename,
    });
  }

  const client = createOpenAIClient();
  if (!client) throw new Error('OPENAI_API_KEY is not set.');
  const model = getOpenAIModel();

  const prompt = structureResumePrompt({
    filename: args.filename,
    resumeText: args.originalText,
  });

  return await chatJson({
    client,
    model,
    system: prompt.system,
    user: prompt.user,
    schema: StructuredResumeSchema,
  });
}

async function structureJobIfNeeded(args: {
  rawText: string;
  structured?: unknown;
  sourceUrl?: string;
}) {
  if (args.structured) {
    try {
      return StructuredJobSchema.parse(args.structured);
    } catch {
      // fall through to AI
    }
  }

  if (shouldUseMockAI()) {
    return mockStructureJob({
      rawText: args.rawText,
      sourceUrl: args.sourceUrl,
    });
  }

  const client = createOpenAIClient();
  if (!client) throw new Error('OPENAI_API_KEY is not set.');
  const model = getOpenAIModel();

  const prompt = structureJobPrompt({
    url: args.sourceUrl,
    jobText: args.rawText,
  });

  return await chatJson({
    client,
    model,
    system: prompt.system,
    user: prompt.user,
    schema: StructuredJobSchema,
  });
}

function applyBulletRewrites(
  resume: StructuredResume,
  rewrites: {
    experience: Array<{
      company: string;
      title: string;
      rewrittenBullets: Array<{ index: number; before: string; after: string }>;
    }>;
  },
): StructuredResume {
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim();

  const evidenceText = buildResumeEvidenceText(resume);
  const allowedAcronyms = new Set(extractAcronymTokens(evidenceText));
  const allowedUrls = new Set(
    extractUrlTokens(evidenceText).map((u) => u.toLowerCase()),
  );
  const allowedTech = new Set(
    extractTechLikeTokens(evidenceText).map(normalizeKey),
  );

  const next: StructuredResume = {
    ...resume,
    experience: resume.experience.map((exp) => ({
      ...exp,
      bullets: [...exp.bullets],
    })),
  };

  for (const expRewrite of rewrites.experience) {
    const target = next.experience.find(
      (e) => e.company === expRewrite.company && e.title === expRewrite.title,
    );
    if (!target) continue;

    for (const b of expRewrite.rewrittenBullets) {
      if (b.index < 0 || b.index >= target.bullets.length) continue;
      const original = target.bullets[b.index] ?? '';
      if (norm(original) !== norm(b.before)) continue;
      if (!b.after || !norm(b.after)) continue;
      // Extra guardrail: never allow metric invention/dropping.
      if (!hasOnlySameNumbers({ before: original, after: b.after })) continue;

      // Extra guardrail: do not introduce new acronyms or URLs unless already present in the resume.
      const beforeAcronyms = new Set(extractAcronymTokens(original));
      const afterAcronyms = extractAcronymTokens(b.after);
      if (
        afterAcronyms.some(
          (t) => !beforeAcronyms.has(t) && !allowedAcronyms.has(t),
        )
      ) {
        continue;
      }

      const beforeUrls = new Set(
        extractUrlTokens(original).map((u) => u.toLowerCase()),
      );
      const afterUrls = extractUrlTokens(b.after).map((u) => u.toLowerCase());
      if (afterUrls.some((u) => !beforeUrls.has(u) && !allowedUrls.has(u))) {
        continue;
      }

      // Extra guardrail: do not introduce new "tech-like" tokens unless already present somewhere in the resume.
      const beforeTech = new Set(
        extractTechLikeTokens(original).map(normalizeKey),
      );
      const afterTech = extractTechLikeTokens(b.after).map(normalizeKey);
      if (afterTech.some((t) => !beforeTech.has(t) && !allowedTech.has(t))) {
        continue;
      }

      target.bullets[b.index] = b.after;
    }
  }

  return next;
}

function buildTailoredResume(args: {
  structuredResume: StructuredResume;
  skills: string[];
  job: StructuredJob;
}): TailoredResume {
  // Keep summary conservative: if resume already has a summary, keep it.
  const summary = args.structuredResume.summary;

  return {
    basics: args.structuredResume.basics,
    summary,
    skills: args.skills,
    experience: args.structuredResume.experience,
    education: args.structuredResume.education,
    projects: args.structuredResume.projects,
    certifications: args.structuredResume.certifications,
  };
}

export async function runTailorPipeline(
  input: TailorPipelineInput,
): Promise<TailoringResult> {
  const useMock = shouldUseMockAI();
  const client = useMock ? null : createOpenAIClient();
  const model = useMock ? null : getOpenAIModel();

  const structuredResume = await structureResumeIfNeeded({
    originalText: input.resume.originalText,
    filename: input.resume.filename,
    parsed: input.resume.parsed,
  });

  const structuredJob = await structureJobIfNeeded({
    rawText: input.job.rawText,
    structured: input.job.structured,
    sourceUrl: input.job.sourceUrl,
  });

  const structuredResumeJson = safeJsonStringify(structuredResume);
  const structuredJobJson = safeJsonStringify(structuredJob);

  const gapAnalysis = useMock
    ? mockGapAnalysis({ resume: structuredResume, job: structuredJob })
    : await (async () => {
        if (!client || !model) throw new Error('OpenAI client not configured.');
        const gapPrompt = gapAnalysisPrompt({
          structuredResumeJson,
          structuredJobJson,
        });
        return await chatJson({
          client,
          model,
          system: gapPrompt.system,
          user: gapPrompt.user,
          schema: GapAnalysisSchema,
        });
      })();

  // Enforce: suggestedSkillOrder must be subset of resume skills.
  const resumeSkillMap = buildSkillCanonicalMap(structuredResume.skills ?? []);
  const sanitizedSuggestedSkillOrder = filterToAllowedSkills({
    skills: gapAnalysis.suggestedSkillOrder ?? [],
    allowed: resumeSkillMap,
  });
  const safeGapAnalysis = GapAnalysisSchema.parse({
    ...gapAnalysis,
    suggestedSkillOrder:
      sanitizedSuggestedSkillOrder.length > 0
        ? sanitizedSuggestedSkillOrder
        : uniqueByKey(structuredResume.skills ?? []).slice(0, 30),
  });

  const gapAnalysisJson = safeJsonStringify(safeGapAnalysis);

  const bulletRewrite = useMock
    ? mockBulletRewrite({
        resume: structuredResume,
        job: structuredJob,
        gap: safeGapAnalysis,
      })
    : await (async () => {
        if (!client || !model) throw new Error('OpenAI client not configured.');
        const rewritePrompt = bulletRewritePrompt({
          structuredResumeJson,
          structuredJobJson,
          gapAnalysisJson,
        });
        return await chatJson({
          client,
          model,
          system: rewritePrompt.system,
          user: rewritePrompt.user,
          schema: BulletRewriteSchema,
        });
      })();

  const rewrittenResume = applyBulletRewrites(structuredResume, {
    experience: bulletRewrite.experience.map((e) => ({
      company: e.company,
      title: e.title,
      rewrittenBullets: e.rewrittenBullets.map((b) => ({
        index: b.index,
        before: b.before,
        after: b.after,
      })),
    })),
  });

  const originalSkills = [...rewrittenResume.skills];

  const skillsPrompt = skillsOptimizePrompt({
    resumeSkills: rewrittenResume.skills,
    structuredJobJson,
    gapAnalysisJson,
  });

  const skillsOptimize = useMock
    ? mockSkillsOptimize({
        resume: rewrittenResume,
        job: structuredJob,
        gap: safeGapAnalysis,
      })
    : await (async () => {
        if (!client || !model) throw new Error('OpenAI client not configured.');
        return await chatJson({
          client,
          model,
          system: skillsPrompt.system,
          user: skillsPrompt.user,
          schema: SkillsOptimizeSchema,
        });
      })();

  // Enforce: every skill must come from rewrittenResume.skills.
  const allowedSkillMap = buildSkillCanonicalMap(rewrittenResume.skills ?? []);
  const primary = filterToAllowedSkills({
    skills: skillsOptimize.primary ?? [],
    allowed: allowedSkillMap,
  });
  const secondary = filterToAllowedSkills({
    skills: skillsOptimize.secondary ?? [],
    allowed: allowedSkillMap,
  }).filter((s) => !new Set(primary.map(normalizeKey)).has(normalizeKey(s)));
  const other = filterToAllowedSkills({
    skills: skillsOptimize.other ?? [],
    allowed: allowedSkillMap,
  }).filter((s) => {
    const key = normalizeKey(s);
    return (
      !new Set(primary.map(normalizeKey)).has(key) &&
      !new Set(secondary.map(normalizeKey)).has(key)
    );
  });

  const safeSkillsOptimize = SkillsOptimizeSchema.parse({
    ...skillsOptimize,
    primary: primary.length
      ? primary
      : uniqueByKey(rewrittenResume.skills ?? []).slice(0, 12),
    secondary,
    other,
  });

  const skills = [
    ...safeSkillsOptimize.primary,
    ...safeSkillsOptimize.secondary,
    ...safeSkillsOptimize.other,
  ];

  const tailored = buildTailoredResume({
    structuredResume: rewrittenResume,
    skills,
    job: structuredJob,
  });

  const renderedText = renderATSResumeText(tailored);

  const result = {
    originalSkills,
    tailored,
    renderedText,
    gapAnalysis: safeGapAnalysis,
    bulletRewrite,
    skillsOptimize: safeSkillsOptimize,
  } satisfies TailoringResult;

  return TailoringResultSchema.parse(result);
}
