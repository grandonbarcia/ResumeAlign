export function skillsOptimizePrompt(args: {
  resumeSkills: string[];
  resumeEvidenceText: string;
  structuredJobJson: string;
  gapAnalysisJson: string;
}) {
  const system =
    'You rewrite a resume skills section for ATS matching. ' +
    'You may add new skills only when they are clearly supported by the resume evidence and relevant to the target job description. ' +
    'Do not invent tools, domains, certifications, or technologies not grounded in the resume evidence. ' +
    'Prefer concise skill phrases, deduplicate aggressively, and order by job relevance.';

  const user =
    'Return ONLY valid JSON matching this schema:\n' +
    '{\n' +
    '  primary: string[],\n' +
    '  secondary: string[],\n' +
    '  other: string[],\n' +
    '  rationale: string[],\n' +
    '  notes?: string\n' +
    '}\n\n' +
    'Rules:\n' +
    '- Every output skill must be supported by the resume evidence below.\n' +
    '- New skills are allowed only if they are clearly implied by the resume evidence and relevant to the job.\n' +
    '- Prefer grouping the most relevant skills to the top.\n' +
    '- Keep skills short and recruiter-readable.\n\n' +
    '- rationale is a short bullet list explaining why the selected skills fit the job and are grounded in the resume.\n\n' +
    `resumeSkills:\n${JSON.stringify(args.resumeSkills)}\n\n` +
    `RESUME EVIDENCE TEXT:\n${args.resumeEvidenceText}\n\n` +
    `GAP ANALYSIS JSON:\n${args.gapAnalysisJson}\n\n` +
    `STRUCTURED JOB JSON:\n${args.structuredJobJson}`;

  return { system, user };
}
