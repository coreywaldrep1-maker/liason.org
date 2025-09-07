// app/api/i129f/fields/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { PDFDocument } from 'pdf-lib';

export async function GET() {
  try {
    const pdfPath = join(process.cwd(), 'public', 'i-129f.pdf');
    const bytes = await readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(bytes, { updateMetadata: false });

    const form = pdfDoc.getForm();
    const fields = form.getFields();

    // Number all widgets across all fields
    let idx = 1;
    const pages = pdfDoc.getPages();

    const items = [];
    for (const f of fields) {
      const name = f.getName();
      const type = f.constructor?.name || 'Field';
      const widgets = f.acroField?.getWidgets?.() || [];
      for (const w of widgets) {
        // Try to find page + rect for each widget
        let pageIndex = 0;
        try {
          const pRef = w.getP?.() || w.P?.();
          if (pRef) {
            const found = pages.findIndex(pg => pg.ref === pRef);
            if (found >= 0) pageIndex = found;
          }
        } catch {}
        let rect = { x: 0, y: 0, width: 0, height: 0 };
        try {
          const r = w.getRectangle?.();
          if (r) rect = { x: r.x, y: r.y, width: r.width, height: r.height };
        } catch {}

        items.push({
          index: idx++,
          name,
          type,
          page: pageIndex + 1, // human-friendly (1-based)
          rect,
        });
      }
    }

    return NextResponse.json({ ok: true, count: items.length, fields: items });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
