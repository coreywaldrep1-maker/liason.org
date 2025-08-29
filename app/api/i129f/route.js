export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function POST(request) {
  try {
    const { answers = {} } = await request.json();

    // Create a simple multi-page PDF summary
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const titleFont = await pdf.embedFont(StandardFonts.HelveticaBold);

    const margin = 50;
    const lineHeight = 16;

    // helper to add a page with header
    const addPage = (pageTitle) => {
      const page = pdf.addPage([612, 792]); // Letter
      const { width, height } = page.getSize();
      page.drawText('Form I-129F (Draft Summary)', {
        x: margin, y: height - margin,
        size: 14, font: titleFont, color: rgb(0,0,0),
      });
      page.drawText(pageTitle, {
        x: margin, y: height - margin - 22,
        size: 12, font, color: rgb(0.1,0.1,0.1),
      });
      return page;
    };

    let page = addPage('Your provided answers');
    let y = 792 - margin - 50;

    const entries = Object.entries(answers);
    if (entries.length === 0) {
      page.drawText('No data provided.', { x: margin, y, size: 12, font });
    } else {
      for (const [k, v] of entries) {
        const text = `${k}: ${Array.isArray(v) ? v.join(', ') : (v ?? '')}`;
        // wrap to new page if needed
        if (y < margin + 40) {
          page = addPage('Continued');
          y = 792 - margin - 50;
        }
        page.drawText(text, { x: margin, y, size: 12, font, color: rgb(0,0,0) });
        y -= lineHeight;
      }
    }

    const bytes = await pdf.save();
    return new Response(bytes, {
      status: 200,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': 'attachment; filename="I-129F-draft.pdf"',
        'cache-control': 'no-store',
      },
    });
  } catch (e) {
    console.error('PDF error', e);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
