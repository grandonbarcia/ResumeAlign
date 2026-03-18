import { z } from 'zod';

const optionalNonEmptyString = z.preprocess((value) => {
  if (value == null) return undefined;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().min(1).optional());

const nonEmptyStringArray = z.preprocess(
  (value) => {
    if (!Array.isArray(value)) return value;
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : item))
      .filter((item) => typeof item !== 'string' || item.length > 0);
  },
  z.array(z.string().min(1)).default([]),
);

export const StructuredJobSchema = z
  .object({
    title: optionalNonEmptyString,
    company: optionalNonEmptyString,
    location: optionalNonEmptyString,
    employmentType: optionalNonEmptyString,
    summary: optionalNonEmptyString,
    responsibilities: nonEmptyStringArray,
    requirements: nonEmptyStringArray,
    skills: nonEmptyStringArray,
    keywords: nonEmptyStringArray,
  })
  .strict();

export type StructuredJob = z.infer<typeof StructuredJobSchema>;
