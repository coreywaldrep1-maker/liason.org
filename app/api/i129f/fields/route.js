// app/api/i129f/fields/route.js
import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file') || 'i-129f.pdf';

    const pdfPath = path.join(process.cwd(), 'public', 'forms', file);
    const bytes = await fs.readFile(pdfPath);

    // Quick heuristic to detect XFA (many USCIS forms use XFA, which pdf-lib can't read for fields)
    const isXfa = Buffer.from(bytes).includes(Buffer.from('/XFA'));

    // IMPORTANT: ignoreEncryption allows loading encrypted PDFs
    const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });

    const form = pdfDoc.getForm();
    const fields = form.getFields().map(f => f.getName());

    return NextResponse.json({
      ok: true,
      file,
      count: fields.length,
      isXfaLikely: isXfa,
      note:
        fields.length === 0
          ? 'No AcroForm fields were found. If isXfaLikely is true, this PDF is probably XFA-based, which pdf-lib cannot read for fields.'
          : undefined,
      fields,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
