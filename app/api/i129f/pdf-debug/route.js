// app/api/i129f/pdf-debug/route.js
export const runtime = 'nodejs';

import path from 'path';
import { readFile } from 'fs/promises';
import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

async function loadTemplate() {
  const filePath = path.join(process.cwd(), 'public', 'i-129f.pdf');
  return await readFile(filePath);
}

export async function GET() {
  try {
    // Load the existing I-129F PDF from /public
    const bytes = await loadTemplate();
    const pdfDoc = await PDFDocument.load(bytes);

    // Extract field names using pdf-lib
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    const names = fields.map((f) => f.getName());

    // Add a new page listing all fields with numbers
    const page = pdfDoc.addPage([612, 792]); // US Letter portrait
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const title = 'I-129F Field Index (debug overlay)';
    page.drawText(title, { x: 40, y: 752, size: 16, font, color: rgb(0, 0, 0) });

    let y = 720;
    let i = 1;
    const lineHeight = 12;

    for (const name of names) {
      const line = `[${i}] ${name}`;
      page.drawText(line, { x: 40, y, size: 10, font, color: rgb(0, 0, 0) });
      y -= lineHeight;
      i++;
      if (y < 40) {
        // start a new page if we run out of vertical space
        const p = pdfDoc.addPage([612, 792]);
        p.drawText('Field Index (continued)', { x: 40, y: 752, size: 14, font });
        y = 720;
      }
    }

    const outBytes = await pdfDoc.save();
    return new NextResponse(outBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="i129f-field-index.pdf"',
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
