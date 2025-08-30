import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

const FORM_PATH = path.join(process.cwd(), 'public', 'forms', 'i-129f.pdf');

export async function GET() {
  try {
    // Ensure file exists
    await fs.access(FORM_PATH);

    const bytes = await fs.readFile(FORM_PATH);
    // ignoreEncryption helps when the source file had security flags
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = pdf.getPages().length;

    return NextResponse.json({
      ok: true,
      file: 'i-129f.pdf',
      pages,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
