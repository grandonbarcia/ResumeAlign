import type { StructuredJob } from '@/lib/jobStructured';

export function jobSkillsPrompt(args: {
  jobDescriptionText: string;
  structuredJob?: StructuredJob;
}) {
  const system =
    'You generate concise resume skills directly from a job description. ' +
    'Give me a list of skills based on this job description. ' +
    'Return ATS-optimized, recruiter-readable skill phrases only, deduplicate aggressively, and prioritize the most important skills first. ' +
    'Prefer exact or near-exact job-description terminology, but normalize to standard searchable skill names.';

  const user =
    'Return ONLY valid JSON matching this schema:\n' +
    '{\n' +
    '  skills: string[]\n' +
    '}\n\n' +
    'Rules:\n' +
    '- Give me a list of skills based on this job description.\n' +
    '- Focus on tools, technologies, methods, and domain skills explicitly or strongly implied by the posting.\n' +
    '- Keep skills short, ATS-friendly, and plain-text friendly.\n' +
    '- Prefer standard, searchable resume skill phrases and exact job-description wording where appropriate.\n' +
    '- Avoid company names, benefits, soft fluff, and full sentences.\n' +
    '- Return 8 to 15 skills when enough signal exists.\n\n' +
    `JOB DESCRIPTION:\n${args.jobDescriptionText}\n\n` +
    `STRUCTURED JOB JSON:\n${JSON.stringify(args.structuredJob ?? null, null, 2)}`;

  return { system, user };
}
