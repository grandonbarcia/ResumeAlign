import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { renderATSResumeText } from '@/lib/renderResume';
import type { TailoringResult } from '@/lib/tailoringSchemas';

export const TAILORED_RESUME_EXPORT_TITLE = 'ResumeAlign - Tailored Resume';

type ExportPreviewLine =
  | { kind: 'blank'; key: string }
  | { kind: 'heading'; key: string; text: string }
  | { kind: 'bullet'; key: string; text: string }
  | { kind: 'text'; key: string; text: string };

function normalizeSkillValue(value: string) {
  return value.trim().toLowerCase();
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((entry) => typeof entry === 'string')
  );
}

function isHeading(line: string) {
  return /^[A-Z][A-Z\s]{2,}$/.test(line.trim());
}

function isBullet(line: string) {
  return line.trim().startsWith('- ');
}

function getLines(text: string) {
  return text.replace(/\r\n/g, '\n').split('\n');
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildExportPreviewLines(text: string): ExportPreviewLine[] {
  return getLines(text).map((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return { kind: 'blank', key: `blank-${index}` };
    }

    if (isHeading(trimmed)) {
      return {
        kind: 'heading',
        key: `heading-${index}-${trimmed}`,
        text: trimmed,
      };
    }

    if (isBullet(trimmed)) {
      return {
        kind: 'bullet',
        key: `bullet-${index}-${trimmed}`,
        text: trimmed.slice(2),
      };
    }

    return { kind: 'text', key: `line-${index}-${trimmed}`, text: trimmed };
  });
}

function renderExportPreviewHtml(args: { title: string; text: string }) {
  const lines = buildExportPreviewLines(args.text);
  const body = lines.length
    ? lines
        .map((line) => {
          if (line.kind === 'blank') {
            return '<div class="blank"></div>';
          }

          if (line.kind === 'heading') {
            return `<div class="heading">${escapeHtml(line.text)}</div>`;
          }

          if (line.kind === 'bullet') {
            return `<div class="bullet"><span class="bullet-dot">•</span><span class="bullet-text">${escapeHtml(line.text)}</span></div>`;
          }

          return `<div class="text">${escapeHtml(line.text)}</div>`;
        })
        .join('')
    : '<div class="empty">No exported resume text found.</div>';

  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    '<style>',
    '@page { size: Letter; margin: 0; }',
    'html, body { margin: 0; padding: 0; background: #ffffff; }',
    'body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; }',
    '.page-shell { width: 816px; min-height: 1056px; margin: 0 auto; padding: 64px 72px 80px; box-sizing: border-box; background: #ffffff; }',
    '.title { margin: 0 0 20px; font-size: 14px; line-height: 20px; font-weight: 700; }',
    '.content { font-size: 11px; line-height: 1.35rem; }',
    '.blank { height: 12px; }',
    '.heading { margin-top: 16px; padding-bottom: 4px; border-bottom: 1px solid #cbd5e1; font-size: 11px; line-height: 16px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }',
    '.heading:first-child { margin-top: 0; }',
    '.bullet { display: flex; align-items: flex-start; gap: 8px; padding-left: 16px; }',
    '.bullet-dot { color: #64748b; padding-top: 1px; }',
    '.bullet-text { flex: 1; }',
    '.text { white-space: pre-wrap; }',
    '.empty { font-size: 14px; color: #64748b; }',
    '</style>',
    '</head>',
    '<body>',
    '<main class="page-shell">',
    `<div class="title">${escapeHtml(args.title)}</div>`,
    `<div class="content">${body}</div>`,
    '</main>',
    '</body>',
    '</html>',
  ].join('');
}

function applySkillsRewriteToExportText(args: {
  text: string;
  finalSkills?: string[];
  skillsRewrite: TailoringResult['skillsRewrite'] | null | undefined;
}) {
  if (!args.text.trim()) return '';

  const finalSkills =
    args.finalSkills?.map((skill) => skill.trim()).filter(Boolean) ??
    args.skillsRewrite?.rewrittenSkills
      .map((skill) => skill.after.trim())
      .filter(Boolean) ??
    [];

  const skillsSectionRegex =
    /(\bSKILLS\b\s*)([\s\S]*?)(?=\b(?:WORK EXPERIENCE|EXPERIENCE|EDUCATION|PROJECTS|CERTIFICATIONS|ACHIEVEMENTS|SUMMARY)\b|$)/i;

  if (!finalSkills.length) {
    return args.text.replace(skillsSectionRegex, '').trim();
  }

  const nextSkillsBlock = finalSkills.join(' • ');

  if (skillsSectionRegex.test(args.text)) {
    return args.text.replace(
      skillsSectionRegex,
      (_, heading: string) => `${heading}${nextSkillsBlock}\n\n`,
    );
  }

  return `SKILLS\n${nextSkillsBlock}\n\n${args.text}`;
}

function buildTailoredResumeWithRewrites(
  tailored: TailoringResult | null | undefined,
) {
  const tailoredResume = tailored?.tailored;
  if (!tailoredResume) return null;

  const originalSkills = isStringArray(tailored.originalSkills)
    ? tailored.originalSkills
    : [];
  const optimizedSkills = isStringArray(tailoredResume.skills)
    ? tailoredResume.skills
    : [];

  const originalSkillKeys = new Set(originalSkills.map(normalizeSkillValue));
  const filteredOptimizedSkills = optimizedSkills.filter(
    (skill) => !originalSkillKeys.has(normalizeSkillValue(skill)),
  );

  const bulletRewriteByRole = new Map(
    (tailored.bulletRewrite?.experience ?? []).map((experience) => [
      `${experience.company}::${experience.title}`,
      experience,
    ]),
  );

  return {
    ...tailoredResume,
    skills: filteredOptimizedSkills,
    experience: tailoredResume.experience.map((experience) => {
      const rewrittenExperience = bulletRewriteByRole.get(
        `${experience.company}::${experience.title}`,
      );

      if (!rewrittenExperience) {
        return experience;
      }

      const rewrittenBullets = [...experience.bullets];
      for (const rewrittenBullet of rewrittenExperience.rewrittenBullets) {
        if (rewrittenBullet.index < 0) continue;
        if (rewrittenBullet.index >= rewrittenBullets.length) continue;
        rewrittenBullets[rewrittenBullet.index] = rewrittenBullet.after;
      }

      return {
        ...experience,
        bullets: rewrittenBullets,
      };
    }),
  };
}

export function getTailoredResumeExportPayload(
  tailored: TailoringResult | null | undefined,
) {
  const rewrittenResume = buildTailoredResumeWithRewrites(tailored);
  const fallbackText = applySkillsRewriteToExportText({
    text: tailored?.renderedText ?? '',
    finalSkills: rewrittenResume?.skills,
    skillsRewrite: tailored?.skillsRewrite,
  });

  return {
    title: TAILORED_RESUME_EXPORT_TITLE,
    text: rewrittenResume ? renderATSResumeText(rewrittenResume) : fallbackText,
  };
}

export async function exportResumePdf(args: {
  text: string;
  title?: string;
}): Promise<Uint8Array> {
  const puppeteer = await import('puppeteer');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(
      renderExportPreviewHtml({
        title: args.title ?? TAILORED_RESUME_EXPORT_TITLE,
        text: args.text,
      }),
      { waitUntil: 'networkidle0' },
    );

    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
    });

    return new Uint8Array(pdf);
  } finally {
    await browser.close();
  }
}

export async function exportResumeDocx(args: {
  text: string;
  title?: string;
}): Promise<Uint8Array> {
  const lines = args.text.replace(/\r\n/g, '\n').split('\n');
  const paragraphs: Paragraph[] = [];

  if (args.title) {
    paragraphs.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: args.title, bold: true })],
      }),
    );
  }

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      paragraphs.push(new Paragraph({ children: [new TextRun({ text: '' })] }));
      continue;
    }

    const isHeading = /^[A-Z][A-Z\s]{2,}$/.test(line.trim());
    const isBullet = line.trim().startsWith('- ');

    if (isHeading) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: line.trim(), bold: true })],
        }),
      );
      continue;
    }

    if (isBullet) {
      paragraphs.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun({ text: line.trim().slice(2) })],
        }),
      );
      continue;
    }

    paragraphs.push(new Paragraph({ children: [new TextRun({ text: line })] }));
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
