import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const FORM_PATH = path.join(process.cwd(), 'public', 'forms', 'i-129f.pdf');

export async function GET() {
  try {
    const bytes = await fs.readFile(FORM_PATH);
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });

    const helv = await pdf.embedFont(StandardFonts.Helvetica);
    const page = pdf.getPage(0);

    // Draw a tiny test label near bottom-left
    page.drawText('LIASON TEST', {
      x: 36,
      y: 36,
      size: 10,
      font: helv,
      color: rgb(0, 0, 0),
    });

    const out = await pdf.save();
    return new NextResponse(out, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="i-129f-text-test.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
