// app/api/i129f/pdf/route.js
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { requireUser } from '@/lib/auth';
import { PDFDocument } from 'pdf-lib';
import fs from 'node:fs/promises';
import path from 'node:path';

const sql = neon(process.env.DATABASE_URL);

export async function GET(req) {
  try {
    const user = await requireUser(req);
    if (!user?.id) {
      return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
    }

    // 1) Load saved data
    const rows = await sql`SELECT data FROM i129f_entries WHERE user_id = ${user.id}::uuid LIMIT 1`;
    const data = rows.length ? rows[0].data : {};
    const { petitioner = {}, mailing = {}, beneficiary = {}, history = {} } = data;

    // 2) Load the AcroForm PDF template under /public/forms/i-129f.pdf
    const filePath = path.join(process.cwd(), 'public', 'forms', 'i-129f.pdf');
    const bytes = await fs.readFile(filePath);

    const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const form = pdfDoc.getForm();

    // 3) Fill a few example fields; extend with your full MAPPING object
    // Example names from your field list:
    try { form.getTextField('Pt1Line6a_FamilyName').setText(petitioner.lastName || ''); } catch {}
    try { form.getTextField('Pt1Line6b_GivenName').setText(petitioner.firstName || ''); } catch {}
    try { form.getTextField('Pt1Line6c_MiddleName').setText(petitioner.middleName || ''); } catch {}

    try { form.getTextField('Pt1Line8_StreetNumberName').setText(mailing.street || ''); } catch {}
    try { form.getTextField('Pt1Line8_AptSteFlrNumber').setText((mailing.unitType && mailing.unitNum) ? `${mailing.unitType} ${mailing.unitNum}` : (mailing.unitNum || '')); } catch {}
    try { form.getTextField('Pt1Line8_CityOrTown').setText(mailing.city || ''); } catch {}
    try { form.getTextField('Pt1Line8_State').setText(mailing.state || ''); } catch {}
    try { form.getTextField('Pt1Line8_ZipCode').setText(mailing.zip || ''); } catch {}

    try { form.getTextField('Pt2Line1a_FamilyName').setText(beneficiary.lastName || ''); } catch {}
    try { form.getTextField('Pt2Line1b_GivenName').setText(beneficiary.firstName || ''); } catch {}
    try { form.getTextField('Pt2Line1c_MiddleName').setText(beneficiary.middleName || ''); } catch {}

    // Leave the form editable (don't flatten) so users can adjust
    const out = await pdfDoc.save();
    return new NextResponse(out, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="i-129f.pdf"',
      }
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
