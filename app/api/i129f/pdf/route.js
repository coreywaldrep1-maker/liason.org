import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getUserFromCookie } from '@/lib/auth';
import { PDFDocument } from 'pdf-lib';
import fs from 'node:fs/promises';
import path from 'node:path';

const sql = neon(process.env.DATABASE_URL);

export async function GET(request) {
  try {
    const user = await getUserFromCookie(request.headers.get('cookie') || '');
    if (!user?.id) return NextResponse.json({ ok:false, error:'Not authenticated' }, { status:401 });

    // Load user data
    const rows = await sql`SELECT data FROM i129f_sessions WHERE user_id=${user.id} LIMIT 1`;
    const data = rows[0]?.data || {};

    // Load PDF
    const p = path.join(process.cwd(), 'public', 'forms', 'i-129f.pdf');
    const bytes = await fs.readFile(p);
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const form = pdf.getForm();

    // === MAPPING ===
    // Replace the right-hand names with your AcroForm field names.
    // Use /api/i129f/fields to list all fields from the PDF.
    const map = {
      // Petitioner
      petitionerLast: data?.petitioner?.lastName || '',
      petitionerFirst: data?.petitioner?.firstName || '',
      petitionerMiddle: data?.petitioner?.middleName || '',
      // Mailing
      mailStreet: data?.mailing?.street || '',
      mailUnitType: data?.mailing?.unitType || '',
      mailUnitNum: data?.mailing?.unitNum || '',
      mailCity: data?.mailing?.city || '',
      mailState: data?.mailing?.state || '',
      mailZip: data?.mailing?.zip || '',
      // Beneficiary
      beneLast: data?.beneficiary?.lastName || '',
      beneFirst: data?.beneficiary?.firstName || '',
      beneMiddle: data?.beneficiary?.middleName || '',
      // History short examples
      howMet: data?.history?.howMet || '',
      dates: data?.history?.dates || '',
      priorMarriages: data?.history?.priorMarriages || '',
    };

    // ACTUAL PDF FIELD NAMES (left side) -> our keys (right side)
    const FIELD_NAMES = {
      'Petitioner_Last_Name': 'petitionerLast',
      'Petitioner_First_Name': 'petitionerFirst',
      'Petitioner_Middle_Name': 'petitionerMiddle',
      'Mail_Street': 'mailStreet',
      'Mail_Unit_Type': 'mailUnitType',
      'Mail_Unit_Num': 'mailUnitNum',
      'Mail_City': 'mailCity',
      'Mail_State': 'mailState',
      'Mail_Zip': 'mailZip',
      'Beneficiary_Last_Name': 'beneLast',
      'Beneficiary_First_Name': 'beneFirst',
      'Beneficiary_Middle_Name': 'beneMiddle',
      'How_Met': 'howMet',
      'Important_Dates': 'dates',
      'Prior_Marriages': 'priorMarriages',
    };

    // Fill text fields if present
    for (const [pdfFieldName, key] of Object.entries(FIELD_NAMES)) {
      try {
        const tf = form.getTextField(pdfFieldName);
        tf.setText(String(map[key] ?? ''));
      } catch {
        // silently skip if not found
      }
    }

    const filled = await pdf.save();
    const res = new NextResponse(filled, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="I-129F.pdf"',
      },
    });
    return res;
  } catch (e) {
    return NextResponse.json({ ok:false, error:String(e) }, { status:500 });
  }
}
