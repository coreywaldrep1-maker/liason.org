// app/api/i129f/fields/route.js
import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic'; // don't cache during dev

export async function GET(request) {
  try {
    // Optional ?file= query param, defaults to i-129f.pdf
    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file') || 'i-129f.pdf';

    const pdfPath = path.join(process.cwd(), 'public', 'forms', file);
    const bytes = await fs.readFile(pdfPath);

    const pdfDoc = await PDFDocument.load(bytes);
    const form = pdfDoc.getForm();

    // If this returns empty, your PDF might be XFA (not AcroForm)
    const fields = form.getFields().map(f => f.getName());

    return NextResponse.json({
      ok: true,
      file,
      count: fields.length,
      fields,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
