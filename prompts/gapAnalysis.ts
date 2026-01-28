export function gapAnalysisPrompt(args: {
  structuredResumeJson: string;
  structuredJobJson: string;
}) {
  const system =
    'You are an expert resume tailoring assistant. ' +
    'Your job is to compare a resume to a job description and produce a gap analysis. ' +
    'Do not invent facts about the candidate. Only infer gaps from the provided inputs.';

  const user =
    'Return ONLY valid JSON (no markdown, no commentary) matching this schema:\n' +
    '{\n' +
    '  matchedKeywords: string[],\n' +
    '  missingKeywords: string[],\n' +
    '  strengths: string[],\n' +
    '  risks: string[],\n' +
    '  suggestedSummaryPoints: string[],\n' +
    '  suggestedSkillOrder: string[]\n' +
    '}\n\n' +
    'Rules:\n' +
    '- Keywords should be specific (tools, domains, methodologies).\n' +
    '- If unsure, omit rather than guess.\n' +
    '- suggestedSkillOrder must be a reordering/subset of resume skills (no new skills).\n' +
    '- Every item in suggestedSkillOrder must be copied verbatim from resume skills (no normalization, no synonyms).\n\n' +
    `STRUCTURED RESUME JSON:\n${args.structuredResumeJson}\n\n` +
    `STRUCTURED JOB JSON:\n${args.structuredJobJson}`;

  return { system, user };
}
