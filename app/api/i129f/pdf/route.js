export const runtime = 'nodejs'; // must be Node for fs/pdf-lib
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { neon } from '@neondatabase/serverless';
import fs from 'fs/promises';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

const sql = neon(process.env.DATABASE_URL);

export async function GET(req) {
  try {
    const user = await requireAuth(req);

    // Load saved data
    const rows = await sql`SELECT data FROM i129f_entries WHERE user_id = ${user.id}::uuid`;
    const data = rows[0]?.data || {};

    // Load PDF template from /public
    const templatePath = path.join(process.cwd(), 'public', 'i-129f.pdf');
    const templateBytes = await fs.readFile(templatePath);

    const pdf = await PDFDocument.load(templateBytes, { updateMetadata: false });
    const form = pdf.getForm();

    // ---- Minimal mapping to prove end-to-end ----
    // Petitioner name -> Part 1 names
    try {
      form.getTextField('Pt1Line6a_FamilyName')?.setText(data?.petitioner?.lastName || '');
      form.getTextField('Pt1Line6b_GivenName')?.setText(data?.petitioner?.firstName || '');
      form.getTextField('Pt1Line6c_MiddleName')?.setText(data?.petitioner?.middleName || '');
    } catch {}

    // Mailing address -> Part 1 Line 8*
    try {
      form.getTextField('Pt1Line8_StreetNumberName')?.setText(data?.mailing?.street || '');
      form.getTextField('Pt1Line8_AptSteFlrNumber')?.setText(
        [data?.mailing?.unitType, data?.mailing?.unitNum].filter(Boolean).join(' ')
      );
      form.getTextField('Pt1Line8_CityOrTown')?.setText(data?.mailing?.city || '');
      form.getTextField('Pt1Line8_State')?.setText(data?.mailing?.state || '');
      form.getTextField('Pt1Line8_ZipCode')?.setText(data?.mailing?.zip || '');
    } catch {}

    // Beneficiary name -> Part 2 names
    try {
      form.getTextField('Pt2Line1a_FamilyName')?.setText(data?.beneficiary?.lastName || '');
      form.getTextField('Pt2Line1b_GivenName')?.setText(data?.beneficiary?.firstName || '');
      form.getTextField('Pt2Line1c_MiddleName')?.setText(data?.beneficiary?.middleName || '');
    } catch {}

    // IMPORTANT: Do NOT flatten, so the user can edit the AcroForm
    // form.flatten();

    const out = await pdf.save(); // Uint8Array
    return new NextResponse(out, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="I-129F-filled.pdf"',
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
