import { z } from 'zod';

export const GapAnalysisSchema = z
  .object({
    matchedKeywords: z.array(z.string().min(1)).default([]),
    missingKeywords: z.array(z.string().min(1)).default([]),
    strengths: z.array(z.string().min(1)).default([]),
    risks: z.array(z.string().min(1)).default([]),
    suggestedSummaryPoints: z.array(z.string().min(1)).default([]),
    suggestedSkillOrder: z.array(z.string().min(1)).default([]),
  })
  .strict();

export type GapAnalysis = z.infer<typeof GapAnalysisSchema>;

export const BulletRewriteSchema = z
  .object({
    experience: z
      .array(
        z
          .object({
            company: z.string().min(1),
            title: z.string().min(1),
            rewrittenBullets: z
              .array(
                z
                  .object({
                    index: z.number().int().nonnegative(),
                    before: z.string().min(1),
                    after: z.string().min(1),
                    rationale: z.string().min(1),
                  })
                  .strict(),
              )
              .default([]),
          })
          .strict(),
      )
      .default([]),
    notes: z.string().min(1).optional(),
  })
  .strict();

export type BulletRewrite = z.infer<typeof BulletRewriteSchema>;

export const SkillsOptimizeSchema = z
  .object({
    primary: z.array(z.string().min(1)).default([]),
    secondary: z.array(z.string().min(1)).default([]),
    other: z.array(z.string().min(1)).default([]),
    rationale: z.array(z.string().min(1)).default([]),
    notes: z.string().min(1).optional(),
  })
  .strict();

export type SkillsOptimize = z.infer<typeof SkillsOptimizeSchema>;

export const TailoredResumeSchema = z
  .object({
    basics: z
      .object({
        fullName: z.string().min(1).optional(),
        email: z.string().min(1).optional(),
        phone: z.string().min(1).optional(),
        location: z.string().min(1).optional(),
        links: z.array(z.string().min(1)).optional(),
      })
      .strict()
      .optional(),
    summary: z.string().min(1).optional(),
    skills: z.array(z.string().min(1)).default([]),
    experience: z
      .array(
        z
          .object({
            company: z.string().min(1),
            title: z.string().min(1),
            startDate: z.string().min(1).optional(),
            endDate: z.string().min(1).optional(),
            location: z.string().min(1).optional(),
            bullets: z.array(z.string().min(1)).default([]),
          })
          .strict(),
      )
      .default([]),
    education: z
      .array(
        z
          .object({
            school: z.string().min(1),
            degree: z.string().min(1).optional(),
            field: z.string().min(1).optional(),
            startDate: z.string().min(1).optional(),
            endDate: z.string().min(1).optional(),
          })
          .strict(),
      )
      .default([]),
    projects: z
      .array(
        z
          .object({
            name: z.string().min(1),
            description: z.string().min(1).optional(),
            bullets: z.array(z.string().min(1)).default([]),
            links: z.array(z.string().min(1)).optional(),
          })
          .strict(),
      )
      .default([]),
    certifications: z.array(z.string().min(1)).default([]),
  })
  .strict();

export type TailoredResume = z.infer<typeof TailoredResumeSchema>;

export const TailoringResultSchema = z
  .object({
    originalSkills: z.array(z.string().min(1)).default([]),
    tailored: TailoredResumeSchema,
    renderedText: z.string().min(1),
    gapAnalysis: GapAnalysisSchema,
    bulletRewrite: BulletRewriteSchema,
    skillsOptimize: SkillsOptimizeSchema,
  })
  .strict();

export type TailoringResult = z.infer<typeof TailoringResultSchema>;
