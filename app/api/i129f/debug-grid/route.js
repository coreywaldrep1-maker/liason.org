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

    for (const page of pdfDoc.getPages()) {
      const { width, height } = page.getSize();

      // vertical “lines” as thin rectangles
      for (let x = 0; x <= width; x += 50) {
        page.drawRectangle({
          x,
          y: 0,
          width: 0.5,
          height,
          color: rgb(0.88, 0.88, 0.88),
        });
        if (x % 100 === 0) {
          page.drawText(String(x), {
            x: x + 2,
            y: 5,
            size: 8,
            font,
            color: rgb(0.4, 0.4, 0.4),
          });
        }
      }

      // horizontal “lines” as thin rectangles
      for (let y = 0; y <= height; y += 50) {
        page.drawRectangle({
          x: 0,
          y,
          width,
          height: 0.5,
          color: rgb(0.88, 0.88, 0.88),
        });
        if (y % 100 === 0) {
          page.drawText(String(y), {
            x: 5,
            y: y + 2,
            size: 8,
            font,
            color: rgb(0.4, 0.4, 0.4),
          });
        }
      }
    }

    const out = await pdfDoc.save();
    return new NextResponse(Buffer.from(out), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="i129f-grid.pdf"',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
