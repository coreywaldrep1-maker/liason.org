// app/api/i129f/pdf/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { requireAuth } from '@/lib/auth';
import {
  PDFDocument,
  PDFTextField,
  PDFCheckBox,
  PDFRadioGroup,
  PDFDropdown,
  PDFOptionList,
} from 'pdf-lib';

const sql = neon(process.env.DATABASE_URL);

// -- Small helpers -----------------------------------------------------------
function get(obj, path, dflt = '') {
  try {
    return path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj) ?? dflt;
  } catch {
    return dflt;
  }
}

// US date helper (keeps the field editable)
function fmtDateMMDDYYYY(str = '') {
  if (!str) return '';
  // accept yyyy-mm-dd or mm/dd/yyyy
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-');
    return `${m}/${d}/${y}`;
  }
  return str; // assume already mm/dd/yyyy
}

// Safe getField (no throw if not found)
function getFieldSafe(form, name) {
  try { return form.getField(name); } catch { return null; }
}

// Set any field by detecting its pdf-lib type
function setAnyField(field, value) {
  if (!field) return;
  if (field instanceof PDFTextField) {
    field.setText(value ?? '');
  } else if (field instanceof PDFCheckBox) {
    // treat truthy values (true, 'Y', 'Yes', 'on', '1', any non-empty) as checked
    const v = typeof value === 'string' ? value.trim().toLowerCase() : value;
    const shouldCheck =
      v === true || v === 1 || v === '1' ||
      v === 'y' || v === 'yes' || v === 'on' || (typeof v === 'string' && v.length > 0);
    shouldCheck ? field.check() : field.uncheck();
  } else if (field instanceof PDFRadioGroup) {
    if (value) {
      try { field.select(String(value)); } catch { /* ignore bad option */ }
    }
  } else if (field instanceof PDFDropdown || field instanceof PDFOptionList) {
    if (value) {
      try { field.select(String(value)); } catch { /* ignore */ }
    }
  } else {
    // Unknown field type: ignore silently
  }
}

// If your template is in public/i-129f.pdf
async function loadTemplate() {
  const url = new URL('../../../../public/i-129f.pdf', import.meta.url);
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Template not found at public/i-129f.pdf');
  return await resp.arrayBuffer();
}

// Optional mapping for unit type -> checkbox index guess (Apt/Ste/Flr)
// Adjust indices if your PDF uses different ch numbers.
function unitTypeToCheckboxName(base, unitType) {
  if (!unitType) return null;
  const t = unitType.toLowerCase();
  if (t.startsWith('apt')) return `${base}_Unit_p0_ch1`;
  if (t.startsWith('ste') || t.startsWith('suite')) return `${base}_Unit_p0_ch2`;
  if (t.startsWith('flr') || t.startsWith('floor')) return `${base}_Unit_p0_ch3`;
  return null;
}

// -- Route -------------------------------------------------------------------
export async function GET(req) {
  try {
    // 1) Require auth (cookie is sent automatically on same-origin GET)
    const user = await requireAuth(req); // throws if not logged in

    // 2) Load saved wizard data
    const rows = await sql`
      SELECT data
      FROM i129f_entries
      WHERE user_id = ${user.id}
      LIMIT 1
    `;
    const data = rows.length ? rows[0].data || {} : {};
    const petitioner = get(data, 'petitioner', {});
    const mailing    = get(data, 'mailing', {});
    const beneficiary= get(data, 'beneficiary', {});
    const history    = get(data, 'history', {});

    // 3) Load PDF template
    const bytes = await loadTemplate();
    const pdfDoc = await PDFDocument.load(bytes);
    const form = pdfDoc.getForm();

    // ---- Minimal initial mapping (expand as needed) -------------------------
    // Petitioner names (adjust if your template uses Pt1Line7* instead)
    setAnyField(getFieldSafe(form, 'Pt1Line6a_FamilyName'), petitioner.lastName);
    setAnyField(getFieldSafe(form, 'Pt1Line6b_GivenName'), petitioner.firstName);
    setAnyField(getFieldSafe(form, 'Pt1Line6c_MiddleName'), petitioner.middleName);

    // Mailing address
    setAnyField(getFieldSafe(form, 'Pt1Line8_InCareofName'), ''); // if you capture it
    setAnyField(getFieldSafe(form, 'Pt1Line8_StreetNumberName'), mailing.street);
    setAnyField(getFieldSafe(form, 'Pt1Line8_AptSteFlrNumber'), mailing.unitNum);
    setAnyField(getFieldSafe(form, 'Pt1Line8_CityOrTown'), mailing.city);
    setAnyField(getFieldSafe(form, 'Pt1Line8_State'), mailing.state);
    setAnyField(getFieldSafe(form, 'Pt1Line8_ZipCode'), mailing.zip);
    setAnyField(getFieldSafe(form, 'Pt1Line8_Province'), mailing.province);
    setAnyField(getFieldSafe(form, 'Pt1Line8_PostalCode'), mailing.postal);
    setAnyField(getFieldSafe(form, 'Pt1Line8_Country'), mailing.country);

    // Mailing unit type checkboxes (guessing ch1=Apt, ch2=Ste, ch3=Flr)
    const unitBox = unitTypeToCheckboxName('Pt1Line8', mailing.unitType);
    if (unitBox) setAnyField(getFieldSafe(form, unitBox), true);

    // Beneficiary names (adjust field names as your template expects)
    setAnyField(getFieldSafe(form, 'Pt2Line1a_FamilyName'), beneficiary.lastName);
    setAnyField(getFieldSafe(form, 'Pt2Line1b_GivenName'), beneficiary.firstName);
    setAnyField(getFieldSafe(form, 'Pt2Line1c_MiddleName'), beneficiary.middleName);

    // Example date fields (convert yyyy-mm-dd -> mm/dd/yyyy if needed)
    // setAnyField(getFieldSafe(form, 'Pt1Line11_DateofBirth'), fmtDateMMDDYYYY(petitioner.dob));

    // Keep fields editable (don’t flatten)
    const out = await pdfDoc.save();

    return new NextResponse(out, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="i-129f.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }
}
