import { z } from 'zod';
import type OpenAI from 'openai';

export function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

export async function chatJson<T>(args: {
  client: OpenAI;
  model: string;
  system: string;
  user: string;
  schema: z.ZodType<T>;
}): Promise<T> {
  const completion = await args.client.chat.completions.create({
    model: args.model,
    temperature: 0,
    messages: [
      { role: 'system', content: args.system },
      { role: 'user', content: args.user },
    ],
  });

  const content = completion.choices[0]?.message?.content ?? '';
  const json = extractFirstJsonObject(content);
  if (!json) {
    throw new Error('Model did not return JSON.');
  }

  const parsed = JSON.parse(json);
  return args.schema.parse(parsed);
}
