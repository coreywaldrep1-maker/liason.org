export const runtime = 'nodejs';

import fs from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown } from 'pdf-lib';
import { NextResponse } from 'next/server';

function setField(form, name, value) {
  const f = form.getFieldMaybe?.(name) ?? (() => {
    try { return form.getField(name); } catch { return null; }
  })();
  if (!f) return false;

  // Infer type and set appropriately
  const ctor = f.constructor?.name;
  try {
    if (ctor === PDFTextField.name) {
      f.setText(value ?? '');
      return true;
    }
    if (ctor === PDFCheckBox.name) {
      if (value === true || String(value).toLowerCase() === 'yes') f.check();
      else f.uncheck();
      return true;
    }
    if (ctor === PDFRadioGroup.name) {
      if (value) f.select(String(value));
      return true;
    }
    if (ctor === PDFDropdown.name) {
      if (value) f.select(String(value));
      return true;
    }
    // Fallback if text-like
    if (typeof f.setText === 'function') {
      f.setText(value ?? '');
      return true;
    }
  } catch {
    // skip
  }
  return false;
}

/**
 * Map your wizard keys -> actual PDF field names
 * 1. Visit /api/i129f/fields
 * 2. Copy the exact field names into the arrays below.
 */
const MAPPING = {
  // Petitioner
  petitioner_full_name: ['Pt1_FullName', 'Pt1Line1_FullName'],
  petitioner_dob:       ['Pt1_DOB', 'Pt1Line3_DOB'],
  petitioner_us_citizen:['Pt1_USCitizen'],
  petitioner_phone:     ['Pt1_Phone'],
  petitioner_email:     ['Pt1_Email'],
  petitioner_address:   ['Pt1_Address'],

  // Beneficiary
  beneficiary_full_name:   ['Pt2_FullName'],
  beneficiary_dob:         ['Pt2_DOB'],
  beneficiary_citizenship: ['Pt2_Citizenship'],
  beneficiary_passport:    ['Pt2_Passport'],
  beneficiary_address:     ['Pt2_Address'],

  // Relationship
  met_in_person:     ['Pt3_MetInPerson'],
  meeting_details:   ['Pt3_MeetingDetails'],
  intent_to_marry:   ['Pt3_IntentToMarry'],

  // Prior marriages
  petitioner_prior_marriages:  ['Pt4_PetitionerPriorMarriages'],
  beneficiary_prior_marriages: ['Pt4_BeneficiaryPriorMarriages'],

  // Notes (optional)
  notes: ['Extra_Notes'],
};

function normalizeValue(key, raw) {
  if (key === 'petitioner_us_citizen') {
    // many forms expect Yes/No on a checkbox/radio
    if (raw === 'Yes' || raw === true) return 'Yes';
    return 'No';
  }
  return raw ?? '';
}

export async function POST(req) {
  try {
    const body = await req.json();
    const answers = body?.answers || {};

    // Load the blank USCIS form from /public/forms/i-129f.pdf
    const pdfPath = path.join(process.cwd(), 'public', 'forms', 'i-129f.pdf');
    const bytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(bytes);
    const form = pdfDoc.getForm();

    // Fill mapped fields
    Object.entries(MAPPING).forEach(([answerKey, pdfFieldNames]) => {
      const v = normalizeValue(answerKey, answers[answerKey]);
      for (const fieldName of pdfFieldNames) {
        const ok = setField(form, fieldName, v);
        if (ok) break; // stop on first matching field found
      }
    });

    // Example: if “met_in_person” is a yes/no checkbox pair (common setup)
    // You can uncomment and adapt after seeing your field list:
    // const met = (answers.met_in_person || '').toLowerCase().startsWith('yes');
    // setField(form, 'Pt3_MetInPerson_Yes', met ? 'Yes' : '');
    // setField(form, 'Pt3_MetInPerson_No', !met ? 'Yes' : '');

    // Flatten (make non-editable and print-safe)
    form.flatten();

    const out = await pdfDoc.save();
    return new NextResponse(out, {
      status: 200,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': 'attachment; filename="I-129F-prefilled.pdf"',
        'cache-control': 'no-store',
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
