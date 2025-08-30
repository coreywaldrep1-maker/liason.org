// app/api/i129f/debug-grid/route.js
import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const pdfPath = path.join(process.cwd(), 'public', 'forms', 'i-129f.pdf');
    const bytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    pdfDoc.getPages().forEach((page) => {
      const { width, height } = page.getSize();

      // Light grid every 50 pts
      for (let x = 0; x <= width; x += 50) {
        page.drawLine({ start: { x, y: 0 }, end: { x, y: height }, color: rgb(0.8, 0.8, 0.8), thickness: 0.5 });
        if (x % 100 === 0) {
          page.drawText(String(x), { x: x + 2, y: 5, size: 8, font, color: rgb(0.4, 0.4, 0.4) });
        }
      }
      for (let y = 0; y <= height; y += 50) {
        page.drawLine({ start: { x: 0, y }, end: { x: width, y }, color: rgb(0.8, 0.8, 0.8), thickness: 0.5 });
        if (y % 100 === 0) {
          page.drawText(String(y), { x: 5, y: y + 2, size: 8, font, color: rgb(0.4, 0.4, 0.4) });
        }
      }
    });

    const out = await pdfDoc.save();
    return new NextResponse(Buffer.from(out), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="i129f-grid.pdf"',
      },
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}
