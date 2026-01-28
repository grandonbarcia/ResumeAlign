export function skillsOptimizePrompt(args: {
  resumeSkills: string[];
  structuredJobJson: string;
  gapAnalysisJson: string;
}) {
  const system =
    'You optimize the ordering of an existing resume skills list for ATS matching. ' +
    'Do not add any new skills; only reorder and optionally drop irrelevant ones. ' +
    'Hard constraint: every returned skill string must be copied from resumeSkills (no synonyms, no expansions, no new variants).';

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
    '- Every output skill must be from the input resumeSkills (exact string match).\n' +
    '- Prefer grouping the most relevant skills to the top.\n\n' +
    '- rationale is a short bullet list explaining why the top skills are prioritized (no new skills).\n\n' +
    `resumeSkills:\n${JSON.stringify(args.resumeSkills)}\n\n` +
    `GAP ANALYSIS JSON:\n${args.gapAnalysisJson}\n\n` +
    `STRUCTURED JOB JSON:\n${args.structuredJobJson}`;

  return { system, user };
}
