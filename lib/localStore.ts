import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { TailoringResult } from '@/lib/tailoringSchemas';

export type ResumeOriginalFileRecord = {
  filename: string;
  mimeType: string;
  size: number;
  storedPath: string;
};

export type ResumeRecord = {
  id: string;
  createdAt: number;
  filename?: string;
  originalText: string;
  parsed?: unknown;
  originalFile?: ResumeOriginalFileRecord;
};

export type JobRecord = {
  id: string;
  createdAt: number;
  sourceUrl?: string;
  rawText: string;
  structured?: unknown;
};

export type TailoringRunRecord = {
  id: string;
  createdAt: number;
  resumeId: string;
  jobId: string;
  tailored: TailoringResult;
  explanations: {
    bulletRewrite: TailoringResult['bulletRewrite'];
    gapAnalysis: TailoringResult['gapAnalysis'];
    skillsOptimize: TailoringResult['skillsOptimize'];
  };
};

type StoreData = {
  resumes: ResumeRecord[];
  jobs: JobRecord[];
  tailoringRuns: TailoringRunRecord[];
};

const STORE_DIR = path.join(process.cwd(), '.local');
const STORE_PATH = path.join(STORE_DIR, 'resumealign-store.json');
const RESUME_FILES_DIR = path.join(STORE_DIR, 'resume-files');

const EMPTY_STORE: StoreData = {
  resumes: [],
  jobs: [],
  tailoringRuns: [],
};

async function ensureStoreFile() {
  await mkdir(STORE_DIR, { recursive: true });
  await mkdir(RESUME_FILES_DIR, { recursive: true });

  try {
    await readFile(STORE_PATH, 'utf8');
  } catch {
    await writeFile(STORE_PATH, JSON.stringify(EMPTY_STORE, null, 2), 'utf8');
  }
}

async function readStore(): Promise<StoreData> {
  await ensureStoreFile();

  try {
    const raw = await readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<StoreData>;

    return {
      resumes: Array.isArray(parsed.resumes) ? parsed.resumes : [],
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
      tailoringRuns: Array.isArray(parsed.tailoringRuns)
        ? parsed.tailoringRuns
        : [],
    };
  } catch {
    return { ...EMPTY_STORE };
  }
}

async function writeStore(data: StoreData) {
  await ensureStoreFile();
  await writeFile(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function createId(prefix: string) {
  return `${prefix}_${randomUUID().replace(/-/g, '')}`;
}

function sanitizeFilename(filename: string) {
  const trimmed = path.basename(filename).trim();
  const normalized = trimmed.replace(/[^A-Za-z0-9._-]+/g, '_');
  return normalized || 'resume-upload';
}

function resolveStoredResumeFilePath(storedPath: string) {
  return path.join(STORE_DIR, storedPath);
}

export async function createResume(input: {
  filename?: string;
  originalText: string;
  parsed?: unknown;
  originalFile?: {
    buffer: Buffer;
    filename?: string;
    mimeType?: string;
  };
}) {
  const store = await readStore();
  const resumeId = createId('resume');

  let originalFile: ResumeOriginalFileRecord | undefined;

  if (input.originalFile?.buffer?.length) {
    const safeFilename = sanitizeFilename(
      input.originalFile.filename || input.filename || 'resume-upload',
    );
    const storedPath = path.join(
      'resume-files',
      `${resumeId}__${safeFilename}`,
    );
    await writeFile(
      resolveStoredResumeFilePath(storedPath),
      input.originalFile.buffer,
    );
    originalFile = {
      filename: safeFilename,
      mimeType: input.originalFile.mimeType || 'application/octet-stream',
      size: input.originalFile.buffer.byteLength,
      storedPath,
    };
  }

  const record: ResumeRecord = {
    id: resumeId,
    createdAt: Date.now(),
    filename: input.filename,
    originalText: input.originalText,
    parsed: input.parsed,
    originalFile,
  };

  store.resumes.unshift(record);
  await writeStore(store);
  return record;
}

export async function createJob(input: {
  sourceUrl?: string;
  rawText: string;
  structured?: unknown;
}) {
  const store = await readStore();

  const record: JobRecord = {
    id: createId('job'),
    createdAt: Date.now(),
    sourceUrl: input.sourceUrl,
    rawText: input.rawText,
    structured: input.structured,
  };

  store.jobs.unshift(record);
  await writeStore(store);
  return record;
}

export async function createTailoringRun(input: {
  resumeId: string;
  jobId: string;
  tailored: TailoringResult;
  explanations: TailoringRunRecord['explanations'];
}) {
  const store = await readStore();

  const record: TailoringRunRecord = {
    id: createId('run'),
    createdAt: Date.now(),
    resumeId: input.resumeId,
    jobId: input.jobId,
    tailored: input.tailored,
    explanations: input.explanations,
  };

  store.tailoringRuns.unshift(record);
  await writeStore(store);
  return record;
}

export async function getResumeById(id: string) {
  const store = await readStore();
  return store.resumes.find((item) => item.id === id) ?? null;
}

export async function getResumeOriginalFileById(id: string) {
  const resume = await getResumeById(id);
  const originalFile = resume?.originalFile;

  if (!resume || !originalFile) {
    return null;
  }

  const buffer = await readFile(
    resolveStoredResumeFilePath(originalFile.storedPath),
  );

  return {
    resume,
    originalFile,
    buffer,
  };
}

export async function getJobById(id: string) {
  const store = await readStore();
  return store.jobs.find((item) => item.id === id) ?? null;
}

export async function getTailoringRunById(id: string) {
  const store = await readStore();
  return store.tailoringRuns.find((item) => item.id === id) ?? null;
}

export async function listDashboardData() {
  const store = await readStore();

  return {
    resumes: store.resumes.slice(0, 20),
    jobs: store.jobs.slice(0, 20),
    runs: store.tailoringRuns.slice(0, 20),
  };
}
