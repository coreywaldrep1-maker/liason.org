import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import fs from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const pdfPath = path.join(process.cwd(), 'public', 'forms', 'i-129f.pdf');
    const bytes = await fs.readFile(pdfPath);
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const form = pdf.getForm();
    const fields = form.getFields().map(f => ({ name: f.getName(), type: f.constructor.name }));
    return NextResponse.json({ ok: true, count: fields.length, fields });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
