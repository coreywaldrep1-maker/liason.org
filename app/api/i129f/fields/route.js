// app/api/i129f/fields/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

const TEMPLATE_FILE = 'i-129f.pdf';
const TEMPLATE_PATH = path.join(process.cwd(), 'public', 'forms', TEMPLATE_FILE);

export async function GET() {
  try {
    const bytes = await readFile(TEMPLATE_PATH);
    const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const form = pdfDoc.getForm();
    const fields = form.getFields().map(f => f.getName());
    return NextResponse.json({ ok: true, count: fields.length, fields });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
