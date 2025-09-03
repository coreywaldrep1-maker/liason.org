// app/api/i129f/pdf/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';
import { PDFDocument } from 'pdf-lib';
import fs from 'node:fs/promises';
import path from 'node:path';
import { verifyJWT } from '@/lib/auth';

const sql = neon(process.env.DATABASE_URL);
const PDF_PATH = path.join(process.cwd(), 'public', 'forms', 'i-129f.pdf');

// minimal mapping (expand as you go)
const MAP = {
  // Petitioner (Part 1)
  'Pt1Line6a_FamilyName': d => d?.petitioner?.lastName,
  'Pt1Line6b_GivenName':  d => d?.petitioner?.firstName,
  'Pt1Line6c_MiddleName': d => d?.petitioner?.middleName,

  // Mailing (Part 1 Item 8)
  'Pt1Line8_InCareofName':    d => d?.mailing?.inCareOf || '',
  'Pt1Line8_StreetNumberName':d => d?.mailing?.street,
  'Pt1Line8_Unit_p0_ch3':     d => d?.mailing?.unitType, // Apt/Ste/Flr (often a dropdown/checkbox group)
  'Pt1Line8_AptSteFlrNumber': d => d?.mailing?.unitNum,
  'Pt1Line8_CityOrTown':      d => d?.mailing?.city,
  'Pt1Line8_State':           d => d?.mailing?.state,
  'Pt1Line8_ZipCode':         d => d?.mailing?.zip,
  'Pt1Line8_Province':        d => d?.mailing?.province,
  'Pt1Line8_PostalCode':      d => d?.mailing?.postal,
  'Pt1Line8_Country':         d => d?.mailing?.country,

  // Beneficiary (sample)
  'Pt2Line1a_FamilyName': d => d?.beneficiary?.lastName,
  'Pt2Line1b_GivenName':  d => d?.beneficiary?.firstName,
  'Pt2Line1c_MiddleName': d => d?.beneficiary?.middleName,
};

// helper to set value if the field exists
function setField(form, name, val) {
  if (val == null) return;
  try {
    // Try text first
    const tf = form.getTextField(name);
    tf.setText(String(val));
    return;
  } catch {}
  try {
    // Then checkbox/radio
    const cb = form.getCheckBox(name);
    if (val === true || val === 'Y' || val === 'Yes' || val === 'on' || val === 1) cb.check();
    else cb.uncheck();
    return;
  } catch {}
  // If it's a dropdown
  try {
    const dd = form.getDropdown(name);
    dd.select(String(val));
    return;
  } catch {}
  // Silently ignore unknown/missing fields
}

export async function GET() {
  try {
    const token = cookies().get('liason_token')?.value;
    if (!token) return NextResponse.json({ ok:false, error:'Not authenticated' }, { status:401 });
    const user = await verifyJWT(token).catch(() => null);
    if (!user) return NextResponse.json({ ok:false, error:'Bad token' }, { status:401 });

    const rows = await sql`SELECT data FROM i129f_entries WHERE user_id = ${user.id}::uuid LIMIT 1`;
    const data = rows[0]?.data || {};

    const bytes = await fs.readFile(PDF_PATH);
    const pdf = await PDFDocument.load(bytes, { updateFieldAppearances: true, ignoreEncryption: true });
    const form = pdf.getForm();

    for (const [name, fn] of Object.entries(MAP)) {
      const val = typeof fn === 'function' ? fn(data) : data[fn];
      setField(form, name, val);
    }

    // do NOT flatten, so users can edit the AcroForm after download
    const out = await pdf.save();
    return new Response(out, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="I-129F-draft.pdf"'
      }
    });
  } catch (e) {
    return NextResponse.json({ ok:false, error:String(e) }, { status:500 });
  }
}
