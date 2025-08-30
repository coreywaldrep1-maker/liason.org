// app/api/i129f/route.js
import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { promises as fs } from 'fs';
import path from 'path';
import { COORDS } from '@/lib/i129fCoords';

export const dynamic = 'force-dynamic';

// Trim text so it doesn't overflow the box width (very simple fit)
function fitToWidth(font, size, text, maxWidth) {
  if (!maxWidth) return text;
  let s = String(text);
  while (s.length > 0 && font.widthOfTextAtSize(s, size) > maxWidth) {
    s = s.slice(0, -1);
  }
  return s;
}

export async function POST(request) {
  try {
    const body = await request.json(); // expecting { values: {...} }
    const values = body?.values || {};

    const pdfPath = path.join(process.cwd(), 'public', 'forms', 'i-129f.pdf');
    const bytes = await fs.readFile(pdfPath);

    // Allow loading encrypted PDFs (many USCIS PDFs are flagged)
    const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Draw values at coordinates
    for (const row of COORDS) {
      const { key, page, x, y, size = 10, maxWidth, asCheckbox } = row;
      const val = values[key];
      if (val == null || val === '') continue;

      const pages = pdfDoc.getPages();
      if (page < 0 || page >= pages.length) continue;
      const p = pages[page];

      if (asCheckbox) {
        // Draw an "X" for checked
        const text = (val === true || String(val).toLowerCase() === 'true') ? 'X' : '';
        if (text) {
          p.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) });
        }
      } else {
        const text = fitToWidth(font, size, String(val), maxWidth);
        if (text) {
          p.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) });
        }
      }
    }

    // Optional: flatten appearance (not strictly needed since we're drawing, not fields)
    const out = await pdfDoc.save();
    return new NextResponse(Buffer.from(out), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="I-129F-draft.pdf"',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
