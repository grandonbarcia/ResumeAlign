import type { TailoredResume } from '@/lib/tailoringSchemas';

function lineJoin(parts: Array<string | undefined | null>) {
  return parts.filter((p): p is string => Boolean(p && p.trim())).join(' | ');
}

export function renderATSResumeText(resume: TailoredResume): string {
  const lines: string[] = [];

  if (resume.basics?.fullName) lines.push(resume.basics.fullName);

  const contactLine = lineJoin([
    resume.basics?.email,
    resume.basics?.phone,
    resume.basics?.location,
  ]);
  if (contactLine) lines.push(contactLine);

  if (resume.basics?.links?.length) {
    lines.push(resume.basics.links.join(' | '));
  }

  lines.push('');

  if (resume.summary) {
    lines.push('SUMMARY');
    lines.push(resume.summary);
    lines.push('');
  }

  if (resume.skills.length) {
    lines.push('SKILLS');
    lines.push(resume.skills.join(', '));
    lines.push('');
  }

  if (resume.experience.length) {
    lines.push('EXPERIENCE');
    for (const exp of resume.experience) {
      const header = lineJoin([
        `${exp.title} — ${exp.company}`,
        lineJoin([
          exp.location,
          exp.startDate && exp.endDate
            ? `${exp.startDate}–${exp.endDate}`
            : exp.startDate || exp.endDate,
        ]),
      ]);
      lines.push(header);
      for (const b of exp.bullets) {
        lines.push(`- ${b}`);
      }
      lines.push('');
    }
  }

  if (resume.projects.length) {
    lines.push('PROJECTS');
    for (const proj of resume.projects) {
      lines.push(proj.name);
      if (proj.description) lines.push(proj.description);
      for (const b of proj.bullets) lines.push(`- ${b}`);
      if (proj.links?.length) lines.push(proj.links.join(' | '));
      lines.push('');
    }
  }

  if (resume.education.length) {
    lines.push('EDUCATION');
    for (const edu of resume.education) {
      const header = lineJoin([
        edu.school,
        edu.degree,
        edu.field,
        lineJoin([edu.startDate, edu.endDate]),
      ]);
      lines.push(header);
    }
    lines.push('');
  }

  if (resume.certifications.length) {
    lines.push('CERTIFICATIONS');
    for (const c of resume.certifications) lines.push(`- ${c}`);
    lines.push('');
  }

  return lines.join('\n').trim() + '\n';
}
