import { PDFDocument, StandardFonts } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

export async function exportResumePdf(args: {
  text: string;
  title?: string;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageSize = { width: 612, height: 792 }; // Letter
  const margin = 54;
  const fontSize = 11;
  const lineHeight = 14;

  let page = pdfDoc.addPage([pageSize.width, pageSize.height]);
  let y = pageSize.height - margin;

  const lines = args.text.replace(/\r\n/g, '\n').split('\n');

  function drawLine(text: string) {
    const isHeading = /^[A-Z][A-Z\s]{2,}$/.test(text.trim());
    const f = isHeading ? fontBold : font;

    const maxWidth = pageSize.width - margin * 2;
    const words = text.split(/\s+/).filter(Boolean);

    if (words.length === 0) {
      y -= lineHeight;
      return;
    }

    let current = '';
    for (const w of words) {
      const candidate = current ? `${current} ${w}` : w;
      const width = f.widthOfTextAtSize(candidate, fontSize);
      if (width <= maxWidth) {
        current = candidate;
      } else {
        if (y - lineHeight < margin) {
          page = pdfDoc.addPage([pageSize.width, pageSize.height]);
          y = pageSize.height - margin;
        }
        page.drawText(current, { x: margin, y, size: fontSize, font: f });
        y -= lineHeight;
        current = w;
      }
    }

    if (current) {
      if (y - lineHeight < margin) {
        page = pdfDoc.addPage([pageSize.width, pageSize.height]);
        y = pageSize.height - margin;
      }
      page.drawText(current, { x: margin, y, size: fontSize, font: f });
      y -= lineHeight;
    }
  }

  if (args.title) {
    page.drawText(args.title, {
      x: margin,
      y,
      size: 14,
      font: fontBold,
    });
    y -= lineHeight * 1.5;
  }

  for (const line of lines) {
    drawLine(line);
  }

  return await pdfDoc.save();
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
