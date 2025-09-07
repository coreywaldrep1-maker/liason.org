import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { neon } from '@neondatabase/serverless';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { buildPdfData } from '@/lib/i129f-map';

export const runtime = 'nodejs';

const sql = neon(process.env.DATABASE_URL);

export async function GET(req) {
  try {
    const user = await requireAuth(req);

    // 1) Load saved wizard data
    const rows = await sql`SELECT data FROM i129f_entries WHERE user_id = ${user.id} LIMIT 1`;
    const form = rows?.[0]?.data || {};

    // 2) Build flat { pdfFieldName: value } map
    const pdfVals = buildPdfData(form);

    // 3) Load your AcroForm PDF
    const pdfPath = path.join(process.cwd(), 'public', 'i-129f.pdf');
    const pdfBytes = await fs.readFile(pdfPath);

    // 4) Fill fields with pdf-lib
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const formAcro = pdfDoc.getForm();

    Object.entries(pdfVals).forEach(([fieldName, value]) => {
      const f = formAcro.getFieldMaybe(fieldName) || safeFind(formAcro, fieldName);
      if (!f) return;
      try {
        // text fields:
        if (f.setText) f.setText(String(value));
        // checkboxes/radio (if you add later):
        if (typeof value === 'boolean' && f.check) value ? f.check() : f.uncheck();
      } catch {}
    });

    formAcro.updateFieldAppearances();
    const out = await pdfDoc.save();

    return new NextResponse(out, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="I-129F.pdf"',
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }
}

// Helper: pdf-lib doesn't have getFieldMaybe; this is a safe finder.
function safeFind(form, name) {
  try {
    return form.getField(name);
  } catch {
    return null;
  }
}
