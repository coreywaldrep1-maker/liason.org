// app/api/i129f/pdf/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';
import { neon } from '@neondatabase/serverless';
import { requireAuth } from '@/lib/auth';
import { WIZARD_TO_PDF, flatten } from '@/lib/i129f-mapping';

const sql = neon(process.env.DATABASE_URL);

export async function GET(req) {
  try {
    // 1) Auth
    const user = await requireAuth(req); // throws if no cookie
    const userId = user.id;

    // 2) Load saved wizard data
    const rows = await sql`SELECT data FROM i129f_entries WHERE user_id = ${userId} LIMIT 1`;
    const data = rows.length ? rows[0].data : {};
    const flat = flatten(data);

    // 3) Load PDF base
    const pdfPath = path.join(process.cwd(), 'public', 'i-129f.pdf');
    const pdfBytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    // 4) Fill mapped fields we know about
    for (const [wizKey, pdfName] of Object.entries(WIZARD_TO_PDF)) {
      const val = flat[wizKey];
      if (val == null || val === '') continue;

      const field = form.getTextField?.(pdfName) ||
                    form.getFieldMaybe?.(pdfName) || // not a real API; safe fallback
                    form.getField(pdfName);          // will throw if missing

      // pdf-lib fields can be TextField, Dropdown, etc. Try setText if available.
      if (field && field.setText) {
        field.setText(String(val));
      } else if (field && field.select) {
        field.select(String(val));
      }
    }

    // Keep fields editable (AcroForm intact)
    const out = await pdfDoc.save(); // default keeps AcroForm, not flattened
    return new NextResponse(Buffer.from(out), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="i-129f-filled.pdf"',
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
