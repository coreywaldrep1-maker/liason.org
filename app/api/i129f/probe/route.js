// app/api/i129f/probe/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const fsPath = path.join(process.cwd(), 'public', 'forms', 'i-129f.pdf');
    const bytes = await fs.readFile(fsPath);
    const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    return NextResponse.json({ ok: true, pages: pdfDoc.getPageCount() });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e?.message || String(e) },
      { status: 500 }
    );
  }
}

