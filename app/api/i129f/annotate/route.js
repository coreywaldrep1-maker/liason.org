// app/api/i129f/annotate/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function GET() {
  try {
    const pdfPath = path.join(process.cwd(), 'public', 'i-129f.pdf');
    const pdfBytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const form = pdfDoc.getForm();
    const fields = form.getFields().map((f, i) => ({
      idx: i + 1,
      name: f.getName(),
      type: f.constructor.name,
    }));

    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // crude per-page “directory” of fields: split the global list evenly
    const perPage = Math.ceil(fields.length / pages.length);
    pages.forEach((page, pidx) => {
      const { width, height } = page.getSize();
      // page watermark in corner
      page.drawText(`Page ${pidx + 1}`, {
        x: 12,
        y: height - 18,
        size: 10,
        color: rgb(0.85, 0.1, 0.1),
        opacity: 0.8,
        font,
      });

      // list some field indices at the top for that page
      const start = pidx * perPage;
      const end = Math.min(start + perPage, fields.length);
      const slice = fields.slice(start, end);
      const baseY = height - 36;
      const lineH = 10;

      page.drawText('Fields on this page:', {
        x: 12,
        y: baseY,
        size: 9,
        color: rgb(0.2, 0.2, 0.2),
        font,
      });

      slice.forEach((f, i) => {
        const y = baseY - (i + 1) * (lineH + 2);
        if (y < 24) return; // stop near footer
        page.drawText(`${f.idx}. ${f.name}`, {
          x: 12,
          y,
          size: 8,
          color: rgb(0.15, 0.15, 0.15),
          font,
        });
      });
    });

    const out = await pdfDoc.save();
    return new NextResponse(Buffer.from(out), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="i-129f-numbered.pdf"',
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
