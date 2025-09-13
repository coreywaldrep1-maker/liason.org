// app/api/i129f/pdf/route.js
import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { requireAuth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { applyI129fMapping } from '@/lib/i129f-mapping';

export const runtime = 'nodejs';

async function loadTemplate() {
  const p = path.join(process.cwd(), 'public', 'i-129f.pdf');
  return readFile(p);
}

// Try text -> checkbox -> radio
function fillAnyField(pdfForm, name, value) {
  // normalize common truthy strings for checkboxes
  const truthy = v => {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v !== 0;
    if (typeof v === 'string') return ['y','yes','true','1','checked','on'].includes(v.trim().toLowerCase());
    return false;
  };

  // 1) Text field
  try {
    const f = pdfForm.getTextField(name);
    f.setText(value == null ? '' : String(value));
    return true;
  } catch {}

  // 2) Checkbox
  try {
    const cb = pdfForm.getCheckBox(name);
    if (truthy(value)) cb.check(); else cb.uncheck();
    return true;
  } catch {}

  // 3) Radio group
  try {
    const rg = pdfForm.getRadioGroup(name);
    if (value != null) rg.select(String(value));
    return true;
  } catch {}

  // Not found or unsupported — ignore
  return false;
}

export async function GET(req) {
  try {
    const user = await requireAuth(req);

    const { rows } = await sql`
      SELECT data FROM i129f_entries
      WHERE user_id = ${user.id} LIMIT 1
    `;
    if (!rows?.length) {
      return NextResponse.json({ ok: false, error: 'No saved data' }, { status: 400 });
    }
    const formJson = rows[0].data || {};

    const mapped = applyI129fMapping(formJson);

    const bytes = await loadTemplate();
    const pdf = await PDFDocument.load(bytes);
    const form = pdf.getForm();

    for (const [name, val] of Object.entries(mapped)) {
      fillAnyField(form, name, val);
    }
    form.updateFieldAppearances();

    const out = await pdf.save(); // keep fields editable
    return new NextResponse(out, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="i-129f-filled.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
