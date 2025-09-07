import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { requireAuth } from '@/lib/auth';
import { PDFDocument } from 'pdf-lib';
import fs from 'node:fs/promises';
import path from 'node:path';

const sql = neon(process.env.DATABASE_URL);

export async function GET(req) {
  try {
    const user = await requireAuth(req);

    const rows = await sql`
      SELECT data FROM i129f_entries WHERE user_id = ${user.id}::uuid LIMIT 1
    `;
    const data = rows[0]?.data || {};

    // Load template from public/i-129f.pdf
    const pdfPath = path.join(process.cwd(), 'public', 'i-129f.pdf');
    const bytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(bytes);
    const form = pdfDoc.getForm();

    // Helper to set a field if present
    function fill(name, value) {
      if (value == null || value === '') return;
      const f = form.getFieldMaybe?.(name) || form.getField(name); // pdf-lib v1.17.1 has getField; try-catch alternative
      if (!f) return;
      // Text field only here
      if (f.setText) f.setText(String(value));
    }

    // Example mappings (expand later):
    fill('Pt1Line7a_FamilyName', data.petitioner?.lastName);
    fill('Pt1Line7b_GivenName',  data.petitioner?.firstName);
    fill('Pt1Line7c_MiddleName', data.petitioner?.middleName);

    fill('Pt1Line8_StreetNumberName', data.mailing?.street);
    fill('Pt1Line8_AptSteFlrNumber',  data.mailing?.unitNum);
    fill('Pt1Line8_CityOrTown',       data.mailing?.city);
    fill('Pt1Line8_State',            data.mailing?.state);
    fill('Pt1Line8_ZipCode',          data.mailing?.zip);

    fill('Pt2Line10a_FamilyName', data.beneficiary?.lastName);
    fill('Pt2Line10b_GivenName',  data.beneficiary?.firstName);
    fill('Pt2Line10c_MiddleName', data.beneficiary?.middleName);

    form.updateFieldAppearances(); // ensure text renders

    const out = await pdfDoc.save();
    return new NextResponse(out, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="i-129f-filled.pdf"',
      }
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
