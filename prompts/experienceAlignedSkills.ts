import type { StructuredJob } from '@/lib/jobStructured';
import type { StructuredResume } from '@/lib/resumeStructured';

export function experienceAlignedSkillsPrompt(args: {
  jobDescriptionText: string;
  structuredJob: StructuredJob;
  structuredResume: StructuredResume;
  gapAnalysisJson: string;
  resumeEvidenceText: string;
}) {
  const system =
    "You generate ATS-friendly resume skills by comparing a submitted job description with the candidate's prior work experience. " +
    "Give me a list of skills based on this job description and the user's work experience. " +
    "Do research on the user's previous work experience using only the provided resume evidence, then generate keywords that coincide with keywords from the submitted job description. " +
    "Only return skills that are supported by both the job description and the candidate's experience. " +
    'Prefer exact or near-exact job-description wording when it is grounded in the resume evidence, and keep output concise, searchable, and recruiter-readable.';

  const user =
    'Return ONLY valid JSON matching this schema:\n' +
    '{\n' +
    '  skills: string[],\n' +
    '  rationale: string[],\n' +
    '  notes?: string\n' +
    '}\n\n' +
    'Rules:\n' +
    "- Give me a list of skills based on this job description and the user's work experience.\n" +
    "- Do research on the user's previous work experience only within the provided resume evidence.\n" +
    '- Generate keywords that coincide with keywords generated from the submitted job description.\n' +
    "- Every skill must be supported by both the job description and the candidate's experience evidence.\n" +
    '- Prefer technologies, methods, domains, and platform skills over fluff or soft skills.\n' +
    '- Keep each skill short, ATS-friendly, and plain-text friendly.\n' +
    '- Return 6 to 12 skills when enough signal exists.\n' +
    '- rationale should briefly explain why the overlap is valid.\n\n' +
    `JOB DESCRIPTION:\n${args.jobDescriptionText}\n\n` +
    `STRUCTURED JOB JSON:\n${JSON.stringify(args.structuredJob, null, 2)}\n\n` +
    `RESUME EXPERIENCE JSON:\n${JSON.stringify(args.structuredResume.experience ?? [], null, 2)}\n\n` +
    `RESUME EVIDENCE TEXT:\n${args.resumeEvidenceText}\n\n` +
    `GAP ANALYSIS JSON:\n${args.gapAnalysisJson}`;

  return { system, user };
}
