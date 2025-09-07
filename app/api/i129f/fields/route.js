// app/api/i129f/fields/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';

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

    return NextResponse.json({ ok: true, count: fields.length, fields });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
