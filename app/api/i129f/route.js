// app/api/i129f/route.js
import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { promises as fs } from 'fs';
import path from 'path';

// Example mapping: LEFT = exact PDF field name, RIGHT = your wizard keys
// Replace these with the real field names you saw from /api/i129f/fields
const MAPPING = {
  // 'TopmostSubform[0].Page1[0].PtName_First[0]': 'petitioner_first_name',
  // 'TopmostSubform[0].Page1[0].PtName_Last[0]': 'petitioner_last_name',
};

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json(); // { values: {...} }
    const values = body?.values || {};

    const pdfPath = path.join(process.cwd(), 'public', 'forms', 'i-129f.pdf');
    const bytes = await fs.readFile(pdfPath);

    // Allow loading encrypted PDFs
    const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });

    // If the PDF is XFA-based, pdf-lib cannot fill fields. We'll detect no fields.
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    if (fields.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'No fillable AcroForm fields found. The PDF is likely XFA-based. Use an AcroForm version of the I-129F or convert it.',
        },
        { status: 400 }
      );
    }

    for (const [pdfFieldName, key] of Object.entries(MAPPING)) {
      const val = values[key];
      if (val == null) continue;
      const field = form.getFieldMaybe(pdfFieldName);
      if (!field) continue;

      // pdf-lib sets text via field.setText for text fields.
      try {
        // setText works for text fields; if other field type, catch and ignore for now
        field.setText(String(val));
      } catch {
        // no-op for non-text fields in this simple example
      }
    }

    // Flatten if you want the fields to be non-editable:
    // form.flatten();

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
