export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import path from 'path';
import { readFile } from 'fs/promises';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { neon } from '@neondatabase/serverless';
import { requireAuth } from '@/lib/auth';
const sql = neon(process.env.DATABASE_URL);

async function loadTemplate() {
  const filePath = path.join(process.cwd(), 'public', 'i-129f.pdf');
  return await readFile(filePath);
}
const get = (o, p) => p.reduce((a, k) => (a && a[k] !== undefined ? a[k] : undefined), o);
const toMMDDYYYY = s => {
  if (!s) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? `${m[2]}/${m[3]}/${m[1]}` : s;
};

// Start with these; we’ll expand as you add more fields in the wizard
const MAP = {
  Pt1Line7a_FamilyName: ['petitioner','lastName'],
  Pt1Line7b_GivenName:  ['petitioner','firstName'],
  Pt1Line7c_MiddleName: ['petitioner','middleName'],

  Pt1Line8_StreetNumberName: ['mailing','street'],
  Pt1Line8_AptSteFlrNumber:  ['mailing','unitNum'],
  Pt1Line8_CityOrTown:       ['mailing','city'],
  Pt1Line8_State:            ['mailing','state'],
  Pt1Line8_ZipCode:          ['mailing','zip'],

  Pt2Line10a_FamilyName:     ['beneficiary','lastName'],
  Pt2Line10b_GivenName:      ['beneficiary','firstName'],
  Pt2Line10c_MiddleName:     ['beneficiary','middleName'],

  Pt3Line4b_AdditionalInformation: ['history','howMet'],
};

export async function GET(req) {
  try {
    const user = await requireAuth(req);
    const rows = await sql`SELECT data FROM i129f_entries WHERE user_id = ${user.id} LIMIT 1`;
    const data = rows[0]?.data || {};

    const bytes = await loadTemplate();
    const pdfDoc = await PDFDocument.load(bytes);
    const form = pdfDoc.getForm();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    form.updateFieldAppearances(font);

    for (const [pdfName, pathArr] of Object.entries(MAP)) {
      const raw = get(data, pathArr);
      const val = typeof raw === 'string' ? raw : (raw ?? '');
      try {
        const tf = form.getTextField(pdfName);
        tf.setText(/Date/i.test(pdfName) ? toMMDDYYYY(val) : String(val));
      } catch {}
    }

    const out = await pdfDoc.save();
    return new NextResponse(out, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="i-129f-filled.pdf"',
      },
    });
  } catch (e) {
    return NextResponse.json({ ok:false, error:String(e) }, { status:500 });
  }
}
