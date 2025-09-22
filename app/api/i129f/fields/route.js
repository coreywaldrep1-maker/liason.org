// app/api/i129f/fields/route.js
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    // Adjust if your PDF lives somewhere else:
    const PDF_PATH = path.join(process.cwd(), 'public', 'i-129f.pdf');

    const { PDFDocument } = await import('pdf-lib');
    const bytes = await readFile(PDF_PATH);
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const form = pdf.getForm();

    const fields = form.getFields().map((f, i) => {
      const type = f.constructor?.name || 'Unknown';
      const name = f.getName?.() || `Unknown_${i+1}`;
      return { index: i + 1, name, type };
    });

    return NextResponse.json({ ok: true, count: fields.length, fields });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
