import OpenAI from 'openai';

export function getOpenAIApiKey() {
  return process.env.OPENAI_API_KEY;
}

export function getOpenAIModel() {
  return process.env.OPENAI_MODEL || 'gpt-4o-mini';
}

export function createOpenAIClient() {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}
