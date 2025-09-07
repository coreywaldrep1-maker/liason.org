// app/api/i129f/pdf/route.js
// Node runtime because we need FS + pdf-lib
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { requireAuth } from '@/lib/auth';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

const sql = neon(process.env.DATABASE_URL);

export async function GET(req) {
  try {
    const user = await requireAuth(req);

    // 1) Load saved data
    const rows = await sql`
      SELECT data
      FROM i129f_entries
      WHERE user_id = ${user.id}
      LIMIT 1
    `;
    const data = rows[0]?.data || {};

    // 2) Load the blank form from /public
    const pdfPath = path.join(process.cwd(), 'public', 'i-129f.pdf');
    const bytes = await fs.readFile(pdfPath);
    const doc = await PDFDocument.load(bytes);
    const form = doc.getForm();

    // 3) Minimal mapping example (expand later)
    const val = (s) => (s ?? '').toString();

    const trySet = (name, text) => {
      try {
        const f = form.getTextField(name);
        f.setText(text);
      } catch {
        /* field not found – ignore */
      }
    };

    // Petitioner name → common USCIS fields
    trySet('Pt1Line7a_FamilyName',  val(data?.petitioner?.lastName));
    trySet('Pt1Line7b_GivenName',   val(data?.petitioner?.firstName));
    trySet('Pt1Line7c_MiddleName',  val(data?.petitioner?.middleName));

    // Mailing address
    trySet('Pt1Line8_StreetNumberName', val(data?.mailing?.street));
    trySet('Pt1Line8_AptSteFlrNumber',  val(data?.mailing?.unitNum));
    trySet('Pt1Line8_CityOrTown',       val(data?.mailing?.city));
    trySet('Pt1Line8_State',            val(data?.mailing?.state));
    trySet('Pt1Line8_ZipCode',          val(data?.mailing?.zip));

    // Beneficiary name
    trySet('Pt2Line1a_FamilyName', val(data?.beneficiary?.lastName));
    trySet('Pt2Line1b_GivenName',  val(data?.beneficiary?.firstName));
    trySet('Pt2Line1c_MiddleName', val(data?.beneficiary?.middleName));

    // 4) Flatten more fields later; for now return filled doc
    const out = await doc.save();
    return new NextResponse(out, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="i-129f-filled.pdf"',
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }
}
