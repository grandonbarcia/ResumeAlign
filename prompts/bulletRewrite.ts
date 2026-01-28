export function bulletRewritePrompt(args: {
  structuredResumeJson: string;
  structuredJobJson: string;
  gapAnalysisJson: string;
}) {
  const system =
    'You rewrite resume bullets to better match a job description. ' +
    'Safety rules: NEVER invent experience, companies, titles, projects, metrics, tools, or outcomes. ' +
    'You may rephrase, reorder wording, and emphasize existing facts. ' +
    'You may only mention technologies that already appear in the resume skills, resume bullets, or job description. ' +
    'Hard constraint: do not add any new numbers, dates, percentages, dollar amounts, or counts. Preserve every number that appears in the original bullet.';

  const user =
    'Return ONLY valid JSON (no markdown) matching this schema:\n' +
    '{\n' +
    '  experience: Array<{\n' +
    '    company: string,\n' +
    '    title: string,\n' +
    '    rewrittenBullets: Array<{ index: number, before: string, after: string, rationale: string }>\n' +
    '  }>,\n' +
    '  notes?: string\n' +
    '}\n\n' +
    'Rules:\n' +
    '- Preserve each bullet count per experience entry.\n' +
    '- index is the 0-based bullet index in the original bullets array.\n' +
    '- If a bullet is already strong, set after=before and explain why in rationale.\n' +
    '- Do not add new claims or metrics not present in before.\n' +
    '- Preserve all numbers from before exactly; do not introduce any new numbers.\n' +
    '- Preserve proper nouns (company/product names) from before; do not add new named entities.\n\n' +
    `GAP ANALYSIS JSON:\n${args.gapAnalysisJson}\n\n` +
    `STRUCTURED JOB JSON:\n${args.structuredJobJson}\n\n` +
    `STRUCTURED RESUME JSON:\n${args.structuredResumeJson}`;

  return { system, user };
}
