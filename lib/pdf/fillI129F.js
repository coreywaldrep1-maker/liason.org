// lib/pdf/fillI129F.js
// Fill the I-129F PDF using pdf-lib (Node runtime only)

import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

const TEMPLATE_PATH = path.join(process.cwd(), 'public', 'forms', 'i129f-template.pdf');

// Map your app's data keys -> PDF AcroForm field names in the template.
// ⚠️ Replace the right-hand values with the EXACT field names from your PDF.
// Tip: open the PDF in Acrobat > Prepare Form to see true field names.
export const I129F_FIELD_MAP = {
  // --- Petitioner (Part 1) ---
  petitioner_last_name: 'Pt1_LastName',
  petitioner_first_name: 'Pt1_FirstName',
  petitioner_middle_name: 'Pt1_MiddleName',
  petitioner_a_number: 'Pt1_ANumber',
  petitioner_dob: 'Pt1_DOB',
  petitioner_ssn: 'Pt1_SSN',
  petitioner_us_citizen_yes: 'Pt1_USCitizen_Yes',   // checkbox/radio
  petitioner_us_citizen_no:  'Pt1_USCitizen_No',    // checkbox/radio

  // --- Beneficiary (Part 2) ---
  beneficiary_last_name: 'Pt2_LastName',
  beneficiary_first_name: 'Pt2_FirstName',
  beneficiary_middle_name: 'Pt2_MiddleName',
  beneficiary_dob: 'Pt2_DOB',
  beneficiary_country_birth: 'Pt2_PlaceOfBirth_Country',
  beneficiary_city_birth: 'Pt2_PlaceOfBirth_City',
  beneficiary_alien_number: 'Pt2_ANumber',

  // --- Contact & Address examples ---
  petitioner_street: 'Pt1_Address_Street',
  petitioner_city: 'Pt1_Address_City',
  petitioner_state: 'Pt1_Address_State',
  petitioner_zip: 'Pt1_Address_Zip',
  petitioner_phone: 'Pt1_Phone',
  petitioner_email: 'Pt1_Email',

  // ...continue mapping all the fields you collect
};

// If your template uses a single radio group name with different "export values",
// put those export values here so we can select the correct option.
// Example: { marital_status: { group: 'Pt1_MaritalStatus', options: { single: 'Single', married: 'Married' } } }
export const RADIO_GROUPS = {
  // marital_status: { group: 'Pt1_MaritalStatus', options: { single: 'Single', married: 'Married', divorced: 'Divorced' } },
};

// In case your data uses booleans/yes-no strings for checkboxes:
function toBool(v) {
  if (typeof v === 'boolean') return v;
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return ['y', 'yes', 'true', '1', 'on', 'checked'].includes(s);
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

  // Radio group (select by "export value" which must match the option value)
  try {
    const f = form.getRadioGroup(fieldName);
    if (value != null) f.select(String(value));
    return true;
  } catch {}

  // Dropdown / combo
  try {
    const f = form.getDropdown(fieldName);
    if (value == null || value === '') {
      // leave blank if allowed; otherwise select first option
      const opts = f.getOptions();
      if (opts?.length) f.select(String(opts[0]));
    } else {
      f.select(String(value));
    }
    return true;
  } catch {}

  return false;
}

// Optional helper for radio groups that share one field name with multiple choices.
function setRadioGroupByExportValue(form, spec, rawValue) {
  if (!spec) return false;
  const { group, options } = spec;
  const raw = rawValue == null ? '' : String(rawValue).trim().toLowerCase();
  const exportValue =
    options?.[raw] ??
    // if the raw value is already an exact export value, use it as-is:
    Object.values(options || {}).find(v => String(v).toLowerCase() === raw);

  if (!group || !exportValue) return false;

  try {
    const rg = form.getRadioGroup(group);
    rg.select(String(exportValue));
    return true;
  } catch {
    return false;
  }
}

export async function fillI129FPdf(inputData, options = {}) {
  const templatePath = options.templatePath || TEMPLATE_PATH;
  if (!fs.existsSync(templatePath)) {
    throw new Error(`I-129F template not found at ${templatePath}`);
  }

  // Load PDF template
  const bytes = fs.readFileSync(templatePath);
  const pdf = await PDFDocument.load(bytes);

  // If your template is an XFA form (some older USCIS PDFs are), pdf-lib cannot fill it.
  // A quick heuristic: no AcroForm or 0 fields detected.
  const form = pdf.getForm();
  const fields = form.getFields();
  if (!fields || fields.length === 0) {
    throw new Error(
      'No AcroForm fields found in template. Your PDF may be XFA-based. ' +
      'Use a standard AcroForm version of I-129F or switch to a drawText/coordinates approach.'
    );
  }

  const missing = [];
  const data = inputData || {};

  // 1) Fill simple one-to-one fields
  for (const [appKey, pdfFieldName] of Object.entries(I129F_FIELD_MAP)) {
    const val = data[appKey];
    const ok = setAnyField(form, pdfFieldName, val);
    if (!ok) missing.push({ appKey, pdfFieldName, value: val });
  }

  // 2) Handle radio groups defined in RADIO_GROUPS (optional)
  for (const [appKey, spec] of Object.entries(RADIO_GROUPS)) {
    const rawVal = data[appKey];
    const ok = setRadioGroupByExportValue(form, spec, rawVal);
    if (!ok) {
      // If it failed, try setting a field literally named as the group (in case the map above is enough)
      // This is just a last-ditch attempt and usually not needed.
      setAnyField(form, spec.group, rawVal);
    }
  }

  // 3) Flatten so values are embedded and not editable (set to false in options to keep fields editable)
  if (options.flatten !== false) {
    form.flatten();
  }

  // Log any missing fields for debugging (server logs)
  if (missing.length > 0) {
    console.warn('[fillI129F] These PDF fields were not found or type mismatched:', missing);
  }

  const out = await pdf.save();
  // Return Node Buffer for API route to stream as application/pdf
  return Buffer.from(out);
}

/**
 * (Optional) Dev helper to list all fields in the template so you can copy/paste exact names
 * Run this in a local script or call it temporarily from an API route in dev.
 */
export async function listI129FFieldNames(templatePath = TEMPLATE_PATH) {
  const bytes = fs.readFileSync(templatePath);
  const pdf = await PDFDocument.load(bytes);
  const form = pdf.getForm();
  const fields = form.getFields();

  return fields.map(f => {
    const type = f.constructor?.name || 'Unknown';
    return { name: f.getName(), type };
  });
}
