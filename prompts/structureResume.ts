export function structureResumePrompt(args: {
  filename?: string;
  resumeText: string;
}) {
  const system =
    'You are a resume parser. Extract structured JSON from resume text. ' +
    'Do not invent facts; only extract what is present. If unsure, omit fields.';

  const user =
    `Return a JSON object that matches this schema (no markdown, no commentary):\n` +
    `basics{fullName?,email?,phone?,location?,links?[]}, summary?, skills[] (strings), ` +
    `experience[] {company,title,startDate?,endDate?,location?,bullets[]}, ` +
    `education[] {school,degree?,field?,startDate?,endDate?}, ` +
    `projects[] {name,description?,bullets[],links?[]}, certifications[] (strings).\n\n` +
    `Filename: ${args.filename ?? '(unknown)'}\n\nRESUME TEXT:\n${args.resumeText}`;

  return { system, user };
}
