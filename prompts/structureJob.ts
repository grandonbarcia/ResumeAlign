export function structureJobPrompt(args: {
  url?: string;
  title?: string;
  jobText: string;
}) {
  const system =
    'You are a job description parser. Extract structured JSON from job text. ' +
    'Do not invent facts. If unsure, omit fields.';

  const user =
    `Return a JSON object that matches this schema (no markdown):\n` +
    `{ title?, company?, location?, employmentType?, summary?, responsibilities[], requirements[], skills[], keywords[] }\n\n` +
    `URL: ${args.url ?? '(unknown)'}\n` +
    `TITLE: ${args.title ?? '(unknown)'}\n\n` +
    `JOB TEXT:\n${args.jobText}`;

  return { system, user };
}
