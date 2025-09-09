// app/api/i129f/pdf-debug/route.js
export const runtime = 'nodejs';

import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { NextResponse } from 'next/server';
import { PDFDocument, rgb } from 'pdf-lib';

async function loadTemplate() {
  const filePath = path.join(process.cwd(), 'public', 'i-129f.pdf');
  return await readFile(filePath);
}

export async function GET() {
  try {
    const bytes = await loadTemplate();
    const pdfDoc = await PDFDocument.load(bytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    const pages = pdfDoc.getPages();

    // Draw overlay for each widget
    fields.forEach((f, idx) => {
      const name = f.getName();
      const widgets = f.acroField?.getWidgets?.() || [];
      widgets.forEach((w, wi) => {
        try {
          const rect = w.getRectangle?.();
          const page = w.getPage?.() || pages[0];
          if (!rect || !page) return;

          const { x, y, width, height } = rect;
          page.drawRectangle({
            x, y, width, height,
            borderColor: rgb(1, 0, 0),
            borderWidth: 0.8,
            color: undefined,
            opacity: 0.0,
          });
          page.drawText(`${idx + 1}:${wi + 1}  ${name}`, {
            x, y: y + height + 2,
            size: 6,
            color: rgb(1, 0, 0),
          });
        } catch {
          // skip if widget lacks geometry
        }
      });
    });

    const out = await pdfDoc.save();
    return new NextResponse(out, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="i-129f-debug.pdf"',
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }
}
