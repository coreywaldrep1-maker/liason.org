// app/api/i129f/pdf/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { requireAuth } from '@/lib/auth';
import { readFile } from 'fs/promises';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

const sql = neon(process.env.DATABASE_URL);

async function loadTemplate() {
  // Reads /public/i-129f.pdf that you committed to the repo
  const filePath = path.join(process.cwd(), 'public', 'i-129f.pdf');
  return await readFile(filePath);
}

// Safe helpers (don’t crash if a field name is missing in the PDF)
function setText(form, name, value) {
  try {
    if (value == null || value === '') return;
    const f = form.getTextField(name);
    f.setText(String(value));
  } catch {}
}
function setCheck(form, name, checked) {
  try {
    const f = form.getCheckBox(name);
    if (checked) f.check(); else f.uncheck();
  } catch {}
}

export async function GET(req) {
  try {
    const user = await requireAuth(req);

    // Pull saved data
    const rows = await sql`
      SELECT data
      FROM i129f_entries
      WHERE user_id = ${user.id}
      LIMIT 1
    `;
    const data = rows[0]?.data || {};

    // Load template
    const templateBytes = await loadTemplate();
    const pdf = await PDFDocument.load(templateBytes);
    const form = pdf.getForm();

    // ---- Minimal starter mapping (expand as you go) ----
    // Petitioner (Part 1 – USCIS labels vary by revision; adjust if needed)
    setText(form, 'Pt1Line6a_FamilyName', data.petitioner?.lastName);
    setText(form, 'Pt1Line6b_GivenName',  data.petitioner?.firstName);
    setText(form, 'Pt1Line6c_MiddleName', data.petitioner?.middleName);

    // Mailing address (Part 1, Line 8)
    const m = data.mailing || {};
    setText(form, 'Pt1Line8_StreetNumberName', m.street);
    // Optional: if your PDF has a separate unit type checkbox, you can wire it later.
    setText(form, 'Pt1Line8_AptSteFlrNumber', m.unitNum);
    setText(form, 'Pt1Line8_CityOrTown', m.city);
    setText(form, 'Pt1Line8_State', m.state);
    setText(form, 'Pt1Line8_ZipCode', m.zip);

    // Beneficiary (Part 2)
    setText(form, 'Pt2Line1a_FamilyName', data.beneficiary?.lastName);
    setText(form, 'Pt2Line1b_GivenName',  data.beneficiary?.firstName);
    setText(form, 'Pt2Line1c_MiddleName', data.beneficiary?.middleName);

    // If you want to keep the AcroForm editable by the user after download:
    form.updateFieldAppearances();

    const out = await pdf.save();
    return new NextResponse(out, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="i-129f.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
