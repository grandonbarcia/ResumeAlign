import { z } from 'zod';

export const ResumeBasicsSchema = z
  .object({
    fullName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(3).optional(),
    location: z.string().min(2).optional(),
    links: z.array(z.string().min(3)).optional(),
  })
  .strict();

export const ResumeExperienceSchema = z
  .object({
    company: z.string().min(1),
    title: z.string().min(1),
    startDate: z.string().min(1).optional(),
    endDate: z.string().min(1).optional(),
    location: z.string().min(1).optional(),
    bullets: z.array(z.string().min(1)).default([]),
  })
  .strict();

export const ResumeEducationSchema = z
  .object({
    school: z.string().min(1),
    degree: z.string().min(1).optional(),
    field: z.string().min(1).optional(),
    startDate: z.string().min(1).optional(),
    endDate: z.string().min(1).optional(),
  })
  .strict();

export const StructuredResumeSchema = z
  .object({
    basics: ResumeBasicsSchema.optional(),
    summary: z.string().min(1).optional(),
    skills: z.array(z.string().min(1)).default([]),
    experience: z.array(ResumeExperienceSchema).default([]),
    education: z.array(ResumeEducationSchema).default([]),
    projects: z
      .array(
        z
          .object({
            name: z.string().min(1),
            description: z.string().min(1).optional(),
            bullets: z.array(z.string().min(1)).default([]),
            links: z.array(z.string().min(3)).optional(),
          })
          .strict(),
      )
      .default([]),
    certifications: z.array(z.string().min(1)).default([]),
  })
  .strict();

export type StructuredResume = z.infer<typeof StructuredResumeSchema>;
