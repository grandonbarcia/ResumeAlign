import { z } from 'zod';

export const StructuredJobSchema = z
  .object({
    title: z.string().min(1).optional(),
    company: z.string().min(1).optional(),
    location: z.string().min(1).optional(),
    employmentType: z.string().min(1).optional(),
    summary: z.string().min(1).optional(),
    responsibilities: z.array(z.string().min(1)).default([]),
    requirements: z.array(z.string().min(1)).default([]),
    skills: z.array(z.string().min(1)).default([]),
    keywords: z.array(z.string().min(1)).default([]),
  })
  .strict();

export type StructuredJob = z.infer<typeof StructuredJobSchema>;
