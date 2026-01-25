// lib/pdf/fillI129F.js
// Fill the I-129F PDF using pdf-lib (Node runtime only)

import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

// Uses the field names you already extracted from your AcroForm template.
// Logical keys -> PDF field names
import { I129F_FIELD_MAP as FIELD_MAP } from '@/lib/i129fFieldMap';

const DEFAULT_TEMPLATE_PATH = path.join(process.cwd(), 'public', 'forms', 'i-129f.pdf');

function toBool(v) {
  if (typeof v === 'boolean') return v;
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return ['y', 'yes', 'true', '1', 'on', 'checked'].includes(s);
}

function toMMDDYYYY(v) {
  if (!v) return '';
  const s = String(v).trim();
  // already MM/DD/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) return s;
  // ISO
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(s);
  if (m) return `${m[2]}/${m[3]}/${m[1]}`;

  const d = new Date(s);
  if (!Number.isFinite(d.getTime())) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  return `${mm}/${dd}/${yyyy}`;
}

function safeZip(z) {
  const s = (z == null ? '' : String(z)).trim();
  return s.length > 10 ? s.slice(0, 10) : s;
}

function safePhone(p) {
  return (p == null ? '' : String(p)).replace(/[^\d]/g, '').slice(0, 20);
}

// Try to set any field type by name (text, checkbox, radio, dropdown).
function setAnyField(form, fieldName, value) {
  // Text
  try {
    const f = form.getTextField(fieldName);
    f.setText(value == null ? '' : String(value));
    return true;
  } catch {}

  // Checkbox
  try {
    const f = form.getCheckBox(fieldName);
    toBool(value) ? f.check() : f.uncheck();
    return true;
  } catch {}

  // Radio group (select by "export value")
  try {
    const f = form.getRadioGroup(fieldName);
    if (value != null && value !== '') f.select(String(value));
    return true;
  } catch {}

  // Dropdown / combo
  try {
    const f = form.getDropdown(fieldName);
    if (value == null || value === '') {
      const opts = f.getOptions();
      if (opts?.length) f.select(String(opts[0]));
    } else {
      f.select(String(value));
    }
    return true;
  } catch {}

  return false;
}

// Convert your current wizard data shape into the logical keys expected by FIELD_MAP
function buildLogicalFromWizard(data = {}) {
  const p = data.petitioner || {};
  const b = data.beneficiary || {};
  const mail = data.mailing || {};

  const phys = Array.isArray(data.physicalAddresses) ? data.physicalAddresses : [];
  const emp = Array.isArray(data.employment) ? data.employment : [];
  const pOther = Array.isArray(p.otherNames) ? p.otherNames : [];

  const clsType = String(data.classification?.type ?? data.classification ?? '').toLowerCase();
  const i130Filed = toBool(data.classification?.i130Filed ?? data.k3FiledI130 ?? false);

  const out = {
    // IDs / numbers
    petitioner_alien_number: p.aNumber || p.a_number || '',
    petitioner_uscis_online_acct: p.uscisOnlineAccount || p.uscisOnline || p.uscis_online_acct || '',
    petitioner_ssn: p.ssn || '',

    // Legal name
    petitioner_last: p.lastName || p.last || '',
    petitioner_first: p.firstName || p.first || '',
    petitioner_middle: p.middleName || p.middle || '',

    // Other names (first row only; extras are handled in your wizard’s Part 8 spill)
    petitioner_other_last: (pOther[0]?.lastName || pOther[0]?.last || ''),
    petitioner_other_first: (pOther[0]?.firstName || pOther[0]?.first || ''),
    petitioner_other_middle: (pOther[0]?.middleName || pOther[0]?.middle || ''),

    // Mailing address
    mail_in_care_of: mail.inCareOf || '',
    mail_street: mail.street || '',
    mail_unit_number: mail.unitNum || '',
    mail_city: mail.city || '',
    mail_state: mail.state || '',
    mail_zip: safeZip(mail.zip || ''),
    mail_province: mail.province || '',
    mail_postal: mail.postal || '',
    mail_country: mail.country || '',

    // Physical address 1
    phys1_street: phys[0]?.street || '',
    phys1_unit_number: phys[0]?.unitNum || '',
    phys1_city: phys[0]?.city || '',
    phys1_state: phys[0]?.state || '',
    phys1_zip: safeZip(phys[0]?.zip || ''),
    phys1_province: phys[0]?.province || '',
    phys1_postal: phys[0]?.postal || '',
    phys1_country: phys[0]?.country || '',

    // Physical address 2
    phys2_street: phys[1]?.street || '',
    phys2_unit_number: phys[1]?.unitNum || '',
    phys2_city: phys[1]?.city || '',
    phys2_state: phys[1]?.state || '',
    phys2_zip: safeZip(phys[1]?.zip || ''),
    phys2_province: phys[1]?.province || '',
    phys2_postal: phys[1]?.postal || '',
    phys2_country: phys[1]?.country || '',

    // Employment 1
    emp1_name: emp[0]?.employer || '',
    emp1_street: emp[0]?.street || '',
    emp1_unit_number: emp[0]?.unitNum || '',
    emp1_city: emp[0]?.city || '',
    emp1_state: emp[0]?.state || '',
    emp1_zip: safeZip(emp[0]?.zip || ''),
    emp1_province: emp[0]?.province || '',
    emp1_postal: emp[0]?.postal || '',
    emp1_country: emp[0]?.country || '',
    emp1_occupation: emp[0]?.occupation || '',
    emp1_date_from: toMMDDYYYY(emp[0]?.from),
    emp1_date_to: toMMDDYYYY(emp[0]?.to),

    // Employment 2
    emp2_name: emp[1]?.employer || '',
    emp2_street: emp[1]?.street || '',
    emp2_unit_number: emp[1]?.unitNum || '',
    emp2_city: emp[1]?.city || '',
    emp2_state: emp[1]?.state || '',
    emp2_zip: safeZip(emp[1]?.zip || ''),
    emp2_province: emp[1]?.province || '',
    emp2_postal: emp[1]?.postal || '',
    emp2_country: emp[1]?.country || '',
    emp2_occupation: emp[1]?.occupation || '',
    emp2_date_from: toMMDDYYYY(emp[1]?.from),
    emp2_date_to: toMMDDYYYY(emp[1]?.to),

    // DOB / birthplace / contact
    petitioner_dob: toMMDDYYYY(p.dob),
    petitioner_birth_city: p.cityBirth || p.pobCity || '',
    petitioner_birth_state_province: p.provinceBirth || p.pobState || '',
    // The extracted field name in your map is labeled as citizenship/nationality
    petitioner_birth_country: p.countryBirth || p.pobCountry || p.nationality || '',
    petitioner_phone: safePhone(p.phone || ''),
    petitioner_email: p.email || '',

    // (Optional) Beneficiary basics — add more here as your FIELD_MAP expands
    beneficiary_last: b.lastName || b.last || '',
    beneficiary_first: b.firstName || b.first || '',
    beneficiary_middle: b.middleName || b.middle || '',
    beneficiary_dob: toMMDDYYYY(b.dob),
  };

  // Checkboxes (logical key -> boolean)
  out.__checks = {
    class_k1: clsType === 'k1',
    k3_i130_filed: clsType === 'k3' && i130Filed,
    mailing_same_as_physical: toBool(mail.sameAsPhysical),
  };

  return out;
}

export async function fillI129FPdf(inputData, options = {}) {
  const templatePath = options.templatePath || DEFAULT_TEMPLATE_PATH;
  if (!fs.existsSync(templatePath)) {
    throw new Error(`I-129F template not found at ${templatePath}`);
  }

  // Load PDF template
  const bytes = fs.readFileSync(templatePath);
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });

  // If your template is an XFA form, pdf-lib cannot fill it.
  const form = pdf.getForm();
  const fields = form.getFields();
  if (!fields || fields.length === 0) {
    throw new Error(
      'No AcroForm fields found in template. Your PDF may be XFA-based. ' +
      'Use an AcroForm version of I-129F or switch to a drawText/coordinates approach.'
    );
  }

  const data = inputData || {};
  const logical = buildLogicalFromWizard(data);
  const missing = [];

  // 1) Fill text fields
  for (const [logicalKey, pdfFieldName] of Object.entries(FIELD_MAP?.text || {})) {
    const val = logical[logicalKey];
    const ok = setAnyField(form, pdfFieldName, val);
    if (!ok) missing.push({ logicalKey, pdfFieldName });
  }

  // 2) Fill checkboxes
  for (const [logicalKey, pdfFieldName] of Object.entries(FIELD_MAP?.checks || {})) {
    const val = logical.__checks?.[logicalKey];
    const ok = setAnyField(form, pdfFieldName, !!val);
    if (!ok) missing.push({ logicalKey, pdfFieldName });
  }

  // 3) Fill common Part 8 "Additional info" fields (if present in your template)
  // These names are common in some templates; keep them here as best-effort.
  const p8 = data.part8 || {};
  const part8Common = {
    Line3d_AdditionalInfo: p8.line3d,
    Line4d_AdditionalInfo: p8.line4d,
    Line5d_AdditionalInfo: p8.line5d,
    Line6d_AdditionalInfo: p8.line6d,
  };
  for (const [pdfFieldName, val] of Object.entries(part8Common)) {
    if (val) setAnyField(form, pdfFieldName, val);
  }

  // 4) Advanced overrides (wizard stores exact PDF field names in data.other)
  if (data.other && typeof data.other === 'object') {
    for (const [pdfFieldName, val] of Object.entries(data.other)) {
      if (!pdfFieldName) continue;
      setAnyField(form, pdfFieldName, val);
    }
  }

  // 5) Flatten so values are embedded and not editable (set flatten:false to keep fields editable)
  if (options.flatten !== false) {
    form.flatten();
  }

  if (missing.length > 0) {
    console.warn('[fillI129F] Missing/mismatched PDF fields:', missing);
  }

  const out = await pdf.save();
  return Buffer.from(out);
}
