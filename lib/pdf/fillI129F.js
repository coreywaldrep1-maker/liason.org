// lib/pdf/fillI129F.js
export const runtime = 'nodejs';

import fs from 'node:fs';
import path from 'node:path';
import { access } from 'node:fs/promises';
import { constants as FS } from 'node:fs';
import { PDFDocument, StandardFonts } from 'pdf-lib';

import { I129F_FIELD_MAP } from '@/lib/i129fFieldMap';

const CANDIDATE_PDFS = [
  'public/i-129f.pdf',
  'public/forms/i-129f.pdf',
  'public/us/i-129f.pdf',
  'public/i129f.pdf',
  'public/forms/i129f.pdf',
];

async function resolveTemplatePath() {
  for (const rel of CANDIDATE_PDFS) {
    const p = path.join(process.cwd(), rel);
    try {
      await access(p, FS.R_OK);
      return p;
    } catch {}
  }
  return path.join(process.cwd(), CANDIDATE_PDFS[0]);
}

function toBool(v) {
  if (typeof v === 'boolean') return v;
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return ['y', 'yes', 'true', '1', 'on', 'checked'].includes(s);
}

function safeZip(z) {
  const s = (z == null ? '' : String(z)).trim();
  return s.length > 10 ? s.slice(0, 10) : s;
}

function safePhone(p) {
  return (p == null ? '' : String(p)).replace(/[^\d]/g, '').slice(0, 20);
}

function toMMDDYYYY(v) {
  if (!v) return '';
  const s = String(v).trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) return s;
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(s);
  if (m) return `${m[2]}/${m[3]}/${m[1]}`;
  const d = new Date(s);
  if (!Number.isFinite(d.getTime())) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  return `${mm}/${dd}/${yyyy}`;
}

function detectUnitType(unitStr) {
  const s = String(unitStr || '').toLowerCase();
  if (!s) return null;
  if (/\b(ste|suite)\b/.test(s)) return 'ste';
  if (/\b(flr|floor)\b/.test(s)) return 'flr';
  if (/\b(apt|apartment|unit)\b/.test(s)) return 'apt';
  return null;
}

function setAnyField(form, fieldName, value) {
  // text
  try {
    const f = form.getTextField(fieldName);
    f.setText(value == null ? '' : String(value));
    return true;
  } catch {}

  // checkbox
  try {
    const f = form.getCheckBox(fieldName);
    toBool(value) ? f.check() : f.uncheck();
    return true;
  } catch {}

  // radio group
  try {
    const rg = form.getRadioGroup(fieldName);
    if (value == null || value === '') return true;
    rg.select(String(value).replace(/^\//, ''));
    return true;
  } catch {}

  // dropdown
  try {
    const d = form.getDropdown(fieldName);
    if (value == null || value === '') return true;
    d.select(String(value));
    return true;
  } catch {}

  return false;
}

function setTargets(form, target, value, missing) {
  const targets = Array.isArray(target) ? target : [target];
  for (const t of targets) {
    if (!t) continue;
    const ok = setAnyField(form, t, value);
    if (!ok) missing.push({ field: t, value });
  }
}

function tryRadioYesNo(form, groupField, desired) {
  if (!groupField) return false;
  const candidates = desired
    ? ['Yes', 'YES', 'yes', 'Y', 'True', 'true']
    : ['No', 'NO', 'no', 'N', 'False', 'false'];

  // also try selecting the widget field name as an option (some PDFs export that)
  // (we don’t know; but it’s harmless to try)
  const extra = desired ? ['yes', 'Yes'] : ['no', 'No'];
  const all = [...candidates, ...extra];

  for (const opt of all) {
    try {
      const rg = form.getRadioGroup(groupField);
      rg.select(String(opt).replace(/^\//, ''));
      return true;
    } catch {}
  }
  return false;
}

/**
 * Convert wizard shape -> logical keys
 * (Matches your current wizard structure from the file you pasted)
 */
function buildLogicalFromWizard(data = {}) {
  const p = data.petitioner || {};
  const mail = data.mailing || {};
  const phys = Array.isArray(data.physicalAddresses) ? data.physicalAddresses : [];
  const emp = Array.isArray(data.employment) ? data.employment : [];
  const pOther = Array.isArray(p.otherNames) ? p.otherNames : [];
  const clsType = String(data.classification?.type ?? 'k1').toLowerCase();

  return {
    petitioner_alien_number: p.aNumber || '',
    petitioner_uscis_online_acct: p.uscisOnlineAccount || '',
    petitioner_ssn: p.ssn || '',

    petitioner_last: p.lastName || '',
    petitioner_first: p.firstName || '',
    petitioner_middle: p.middleName || '',

    petitioner_other_last: pOther[0]?.lastName || '',
    petitioner_other_first: pOther[0]?.firstName || '',
    petitioner_other_middle: pOther[0]?.middleName || '',

    mail_in_care_of: mail.inCareOf || '',
    mail_street: mail.street || '',
    mail_unit_number: mail.unitNum || '',
    mail_city: mail.city || '',
    mail_state: mail.state || '',
    mail_zip: safeZip(mail.zip || ''),
    mail_province: mail.province || '',
    mail_postal: mail.postal || '',
    mail_country: mail.country || '',

    phys1_street: phys[0]?.street || '',
    phys1_unit_number: phys[0]?.unitNum || '',
    phys1_city: phys[0]?.city || '',
    phys1_state: phys[0]?.state || '',
    phys1_zip: safeZip(phys[0]?.zip || ''),
    phys1_province: phys[0]?.province || '',
    phys1_postal: phys[0]?.postal || '',
    phys1_country: phys[0]?.country || '',

    phys2_street: phys[1]?.street || '',
    phys2_unit_number: phys[1]?.unitNum || '',
    phys2_city: phys[1]?.city || '',
    phys2_state: phys[1]?.state || '',
    phys2_zip: safeZip(phys[1]?.zip || ''),
    phys2_province: phys[1]?.province || '',
    phys2_postal: phys[1]?.postal || '',
    phys2_country: phys[1]?.country || '',

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

    petitioner_dob: toMMDDYYYY(p.dob),
    petitioner_birth_city: p.cityBirth || '',
    petitioner_birth_state_province: p.provinceBirth || '',
    petitioner_birth_country: p.countryBirth || '',

    petitioner_phone: safePhone(p.phone || ''),
    petitioner_email: p.email || '',

    // logical booleans
    __class_type: clsType === 'k3' ? 'k3' : 'k1',
    __k3_i130_filed: toBool(data.classification?.i130Filed),
    __mailing_same_as_physical: toBool(mail.sameAsPhysical),

    // unit type inference
    __mail_unit_type: detectUnitType(mail.unitNum),
    __phys1_unit_type: detectUnitType(phys[0]?.unitNum),
    __phys2_unit_type: detectUnitType(phys[1]?.unitNum),
    __emp1_unit_type: detectUnitType(emp[0]?.unitNum),
    __emp2_unit_type: detectUnitType(emp[1]?.unitNum),
  };
}

export async function fillI129FPdf(inputData, options = {}) {
  const templatePath = options.templatePath || (await resolveTemplatePath());
  if (!fs.existsSync(templatePath)) {
    throw new Error(`I-129F template not found at ${templatePath}`);
  }

  const bytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });

  const form = pdfDoc.getForm();
  const fields = form.getFields();
  if (!fields || fields.length === 0) {
    throw new Error(
      'No AcroForm fields found in template. If this is an XFA PDF, pdf-lib cannot fill it.'
    );
  }

  const logical = buildLogicalFromWizard(inputData || {});
  const missing = [];

  // 1) Fill text mappings
  for (const [logicalKey, target] of Object.entries(I129F_FIELD_MAP?.text || {})) {
    setTargets(form, target, logical[logicalKey], missing);
  }

  // 2) Select One (K1 vs K3)
  const classDef = I129F_FIELD_MAP?.selectOne?.class_type;
  if (classDef) {
    const chosen = logical.__class_type;
    for (const [opt, fieldName] of Object.entries(classDef)) {
      setTargets(form, fieldName, opt === chosen, missing); // checkbox true/false
    }
  }

  // 3) Boolean yes/no pairs
  for (const [logicalKey, def] of Object.entries(I129F_FIELD_MAP?.booleanPairs || {})) {
    const v =
      logicalKey === 'k3_i130_filed'
        ? logical.__k3_i130_filed
        : logicalKey === 'mailing_same_as_physical'
        ? logical.__mailing_same_as_physical
        : toBool(logical[logicalKey]);

    // checkbox attempt
    const yesOk = def?.yes ? setAnyField(form, def.yes, !!v) : false;
    const noOk = def?.no ? setAnyField(form, def.no, !v) : false;

    // if checkboxes didn’t exist, try radio group fallback
    if (!yesOk && !noOk && def?.group) {
      const ok = tryRadioYesNo(form, def.group, !!v);
      if (!ok) missing.push({ field: def.group, value: v, type: 'radioYesNo' });
    }
  }

  // 4) Unit type checkboxes (optional)
  const ug = I129F_FIELD_MAP?.unitTypeGroups || {};
  const unitSets = [
    ['mail_unit_type', logical.__mail_unit_type],
    ['phys1_unit_type', logical.__phys1_unit_type],
    ['phys2_unit_type', logical.__phys2_unit_type],
    ['emp1_unit_type', logical.__emp1_unit_type],
    ['emp2_unit_type', logical.__emp2_unit_type],
  ];
  for (const [groupKey, unitType] of unitSets) {
    const def = ug[groupKey];
    if (!def) continue;
    for (const [t, fieldName] of Object.entries(def)) {
      setTargets(form, fieldName, unitType ? t === unitType : false, missing);
    }
  }

  // ✅ Make values visible in viewers, then flatten for reliability
  const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
  try {
    form.updateFieldAppearances(helv);
  } catch {}

  if (options.flatten !== false) {
    form.flatten();
  }

  if (missing.length) {
    console.warn('[I129F] Some fields were not found/set. Sample:', missing.slice(0, 30));
  }

  const out = await pdfDoc.save();
  return Buffer.from(out);
}
