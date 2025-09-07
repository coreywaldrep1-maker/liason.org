// app/api/i129f/annotate/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const startAt = Number(url.searchParams.get('start')) || 1; // optional ?start=101 to begin numbering at 101
    const size = Number(url.searchParams.get('size')) || 9;     // optional ?size=12
    const color = rgb(1, 0, 0); // bright red
    const offset = { x: 2, y: 2 }; // draw number just above/right of the field

    const pdfPath = join(process.cwd(), 'public', 'i-129f.pdf');
    const bytes = await readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(bytes, { updateMetadata: false });

    const helv = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    const pages = pdfDoc.getPages();

    let idx = startAt;

    // Loop through all field widgets and draw numbers on their page near each field rectangle
    for (const f of fields) {
      const widgets = f.acroField?.getWidgets?.() || [];
      for (const w of widgets) {
        // Page
        let pageIndex = 0;
        try {
          const pRef = w.getP?.() || w.P?.();
          if (pRef) {
            const found = pages.findIndex(pg => pg.ref === pRef);
            if (found >= 0) pageIndex = found;
          }
        } catch {}
        const page = pages[pageIndex];

        // Rect
        let x = 30, y = page.getHeight() - 30;
        try {
          const r = w.getRectangle?.();
          if (r) {
            x = (r.x || r.x1 || 0) + (r.width ? r.width : ((r.x2 || 0) - (r.x1 || 0))) + offset.x;
            y = (r.y || r.y1 || 0) + (r.height ? r.height : ((r.y2 || 0) - (r.y1 || 0))) + offset.y;
          }
        } catch {}

        // Draw the number
        page.drawText(String(idx), {
          x,
          y,
          size,
          color,
          font: helv,
        });

        idx++;
      }
    }

    // Return annotated PDF bytes
    const out = await pdfDoc.save();
    return new NextResponse(out, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="i-129f-numbered.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
