// lib/i129f-mapping.js

/** tiny path getter that supports a.b[0].c */
function get(obj, path) {
  if (!obj) return undefined;
  const parts = String(path).replaceAll('[', '.').replaceAll(']', '').split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

/** normalize date to MM/DD/YYYY if input is YYYY-MM-DD */
function fmtDate(v) {
  if (!v) return '';
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(v)) return v;
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(v);
  if (m) {
    const [, y, mm, dd] = m;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(mm)}/${pad(dd)}/${y}`;
  }
  return String(v);
}

/* ============= UI catalog (used by /flow/us/i-129f/all-fields) ============= */
export const I129F_SECTIONS = [
  {
    key: 'petitioner',
    title: 'Part 1 — Petitioner (names & mailing)',
    fields: [
      { path: 'petitioner.lastName',  label: 'Petitioner — last name' },
      { path: 'petitioner.firstName', label: 'Petitioner — first name' },
      { path: 'petitioner.middleName',label: 'Petitioner — middle name' },

      { path: 'mailing.inCareOf', label: 'Mailing — In care of' },
      { path: 'mailing.street',   label: 'Mailing — Street' },
      { path: 'mailing.unitType', label: 'Mailing — Unit type (Apt/Ste/Flr)' },
      { path: 'mailing.unitNum',  label: 'Mailing — Unit number' },
      { path: 'mailing.city',     label: 'Mailing — City' },
      { path: 'mailing.state',    label: 'Mailing — State' },
      { path: 'mailing.zip',      label: 'Mailing — ZIP' },
      { path: 'mailing.province', label: 'Mailing — Province' },
      { path: 'mailing.postal',   label: 'Mailing — Postal code' },
      { path: 'mailing.country',  label: 'Mailing — Country' },
      { path: 'mailing.inUs',     label: 'Mailing — In the U.S.?', type: 'checkbox' },
    ],
  },
  {
    key: 'employment',
    title: 'Part 1 — Petitioner Employment',
    fields: [
      { path: 'employment[0].employer',   label: 'Employer 1 — name' },
      { path: 'employment[0].street',     label: 'Employer 1 — street' },
      { path: 'employment[0].unitType',   label: 'Employer 1 — unit type' },
      { path: 'employment[0].unitNum',    label: 'Employer 1 — unit number' },
      { path: 'employment[0].city',       label: 'Employer 1 — city' },
      { path: 'employment[0].state',      label: 'Employer 1 — state' },
      { path: 'employment[0].zip',        label: 'Employer 1 — ZIP' },
      { path: 'employment[0].province',   label: 'Employer 1 — province' },
      { path: 'employment[0].postal',     label: 'Employer 1 — postal' },
      { path: 'employment[0].country',    label: 'Employer 1 — country' },
      { path: 'employment[0].occupation', label: 'Employer 1 — occupation' },
      { path: 'employment[0].dateFrom',   label: 'Employer 1 — from (MM/DD/YYYY)' },
      { path: 'employment[0].dateTo',     label: 'Employer 1 — to' },

      { path: 'employment[1].employer',   label: 'Employer 2 — name' },
      { path: 'employment[1].street',     label: 'Employer 2 — street' },
      { path: 'employment[1].unitType',   label: 'Employer 2 — unit type' },
      { path: 'employment[1].unitNum',    label: 'Employer 2 — unit number' },
      { path: 'employment[1].city',       label: 'Employer 2 — city' },
      { path: 'employment[1].state',      label: 'Employer 2 — state' },
      { path: 'employment[1].zip',        label: 'Employer 2 — ZIP' },
      { path: 'employment[1].province',   label: 'Employer 2 — province' },
      { path: 'employment[1].postal',     label: 'Employer 2 — postal' },
      { path: 'employment[1].country',    label: 'Employer 2 — country' },
      { path: 'employment[1].occupation', label: 'Employer 2 — occupation' },
      { path: 'employment[1].dateFrom',   label: 'Employer 2 — from (MM/DD/YYYY)' },
      { path: 'employment[1].dateTo',     label: 'Employer 2 — to' },
    ],
  },
  {
    key: 'beneficiary',
    title: 'Part 2 — Beneficiary (names & mailing)',
    fields: [
      { path: 'beneficiary.lastName',  label: 'Beneficiary — last name' },
      { path: 'beneficiary.firstName', label: 'Beneficiary — first name' },
      { path: 'beneficiary.middleName',label: 'Beneficiary — middle name' },
      { path: 'beneficiary.aNumber',   label: 'Beneficiary — A-Number' },
      { path: 'beneficiary.ssn',       label: 'Beneficiary — SSN' },
      { path: 'beneficiary.dob',       label: 'Beneficiary — Date of birth (MM/DD/YYYY)' },
      { path: 'beneficiary.cityOfBirth',    label: 'Beneficiary — City of birth' },
      { path: 'beneficiary.countryOfBirth', label: 'Beneficiary — Country of birth' },
      { path: 'beneficiary.nationality',    label: 'Beneficiary — Citizenship/Nationality' },

      { path: 'beneficiary.mailing.inCareOf', label: 'Beneficiary mailing — In care of' },
      { path: 'beneficiary.mailing.street',   label: 'Beneficiary mailing — Street' },
      { path: 'beneficiary.mailing.unitType', label: 'Beneficiary mailing — Unit type' },
      { path: 'beneficiary.mailing.unitNum',  label: 'Beneficiary mailing — Unit number' },
      { path: 'beneficiary.mailing.city',     label: 'Beneficiary mailing — City' },
      { path: 'beneficiary.mailing.state',    label: 'Beneficiary mailing — State' },
      { path: 'beneficiary.mailing.zip',      label: 'Beneficiary mailing — ZIP' },
      { path: 'beneficiary.mailing.province', label: 'Beneficiary mailing — Province' },
      { path: 'beneficiary.mailing.postal',   label: 'Beneficiary mailing — Postal' },
      { path: 'beneficiary.mailing.country',  label: 'Beneficiary mailing — Country' },
    ],
  },
];

/* ==================== tolerant field setters ==================== */

function trySetText(form, name, val) {
  try { const f = form.getTextField(name); f.setText(val ?? ''); return true; } catch { return false; }
}
function trySetDropdown(form, name, val) {
  try { const f = form.getDropdown(name); if (val != null && val !== '') f.select(String(val)); return true; } catch { return false; }
}
function trySetCheckbox(form, name, checked) {
  try { const f = form.getCheckBox(name); checked ? f.check() : f.uncheck(); return true; } catch { return false; }
}

/** Special helper for USCIS-style Unit controls (Apt/Ste/Flr) */
function setUnitTriCheckbox(form, ch3Name, raw) {
  // Example: Pt1Line8_Unit_p0_ch3  -> base Pt1Line8_Unit_p0_ch
  const base = ch3Name.replace(/_ch\d+$/, '_ch');
  const want = String(raw || '').trim().toLowerCase();
  const norm =
    want.startsWith('a') ? 'apt' :
    want.startsWith('s') ? 'ste' :
    want.startsWith('f') ? 'flr' : '';

  const map = { apt: 1, ste: 2, flr: 3 };
  const chosen = map[norm];

  let any = false;
  for (let i = 1; i <= 3; i++) {
    const name = `${base}${i}`;
    const checked = (i === chosen);
    const ok = trySetCheckbox(form, name, checked);
    any = any || ok;
  }
  return any;
}

/** Tolerant "set anything": try text → dropdown → checkbox */
function setAny(form, name, value) {
  if (trySetText(form, name, value)) return true;
  if (trySetDropdown(form, name, value)) return true;
  // Use truthiness for checkbox; commonly used for booleans
  if (trySetCheckbox(form, name, !!value)) return true;
  return false;
}

/* ==================== JSON -> PDF mapping ==================== */

export function applyI129fMapping(data, pdfForm, { onMissingPdfField } = {}) {
  const mapping = {
    // Part 1 — Petitioner names & mailing
    'petitioner.lastName':   'Pt1Line7a_FamilyName',
    'petitioner.firstName':  'Pt1Line7b_GivenName',
    'petitioner.middleName': 'Pt1Line7c_MiddleName',

    'mailing.inCareOf':  'Pt1Line8_InCareofName',
    'mailing.street':    'Pt1Line8_StreetNumberName',
    // unitType: 3-way checkbox group (Apt/Ste/Flr). We store user text and pick a box.
    'mailing.unitType':  { pdf: 'Pt1Line8_Unit_p0_ch3', type: 'unit' },
    'mailing.unitNum':   'Pt1Line8_AptSteFlrNumber',
    'mailing.city':      'Pt1Line8_CityOrTown',
    'mailing.state':     'Pt1Line8_State',
    'mailing.zip':       'Pt1Line8_ZipCode',
    'mailing.province':  'Pt1Line8_Province',
    'mailing.postal':    'Pt1Line8_PostalCode',
    'mailing.country':   'Pt1Line8_Country',
    'mailing.inUs':      { pdf: 'Pt1Line8j_Checkboxes_p0_ch2', type: 'checkbox' },

    // Part 1 — Employment 1
    'employment[0].employer':   'Pt1Line13_NameofEmployer',
    'employment[0].street':     'Pt1Line14_StreetNumberName',
    'employment[0].unitType':   { pdf:'Pt1Line14_Unit_p1_ch3', type: 'unit' },
    'employment[0].unitNum':    'Pt1Line14_AptSteFlrNumber',
    'employment[0].city':       'Pt1Line14_CityOrTown',
    'employment[0].state':      'Pt1Line14_State',
    'employment[0].zip':        'Pt1Line14_ZipCode',
    'employment[0].province':   'Pt1Line14_Province',
    'employment[0].postal':     'Pt1Line14_PostalCode',
    'employment[0].country':    'Pt1Line14_Country',
    'employment[0].occupation': 'Pt1Line15_Occupation',
    'employment[0].dateFrom':   { pdf:'Pt1Line16a_DateFrom', transform: fmtDate },
    'employment[0].dateTo':     'Pt1Line16b_ToFrom',

    // Part 1 — Employment 2
    'employment[1].employer':   'Pt1Line17_NameofEmployer',
    'employment[1].street':     'Pt1Line18_StreetNumberName',
    'employment[1].unitType':   { pdf:'Pt1Line18_Unit_p1_ch3', type: 'unit' },
    'employment[1].unitNum':    'Pt1Line18_AptSteFlrNumber',
    'employment[1].city':       'Pt1Line18_CityOrTown',
    'employment[1].state':      'Pt1Line18_State',
    'employment[1].zip':        'Pt1Line18_ZipCode',
    'employment[1].province':   'Pt1Line18_Province',
    'employment[1].postal':     'Pt1Line18_PostalCode',
    'employment[1].country':    'Pt1Line18_Country',
    'employment[1].occupation': 'Pt1Line19_Occupation',
    'employment[1].dateFrom':   { pdf:'Pt1Line20a_DateFrom', transform: fmtDate },
    'employment[1].dateTo':     'Pt1Line20b_ToFrom',

    // Part 2 — Beneficiary (names & mailing)
    'beneficiary.lastName':            'Pt2Line1a_FamilyName',
    'beneficiary.firstName':           'Pt2Line1b_GivenName',
    'beneficiary.middleName':          'Pt2Line1c_MiddleName',
    'beneficiary.aNumber':             'Pt2Line2_AlienNumber',
    'beneficiary.ssn':                 'Pt2Line3_SSN',
    'beneficiary.dob':                 { pdf:'Pt2Line4_DateOfBirth', transform: fmtDate },
    'beneficiary.cityOfBirth':         'Pt2Line7_CityTownOfBirth',
    'beneficiary.countryOfBirth':      'Pt2Line8_CountryOfBirth',
    'beneficiary.nationality':         'Pt2Line9_CountryofCitzOrNationality',

    'beneficiary.mailing.inCareOf':    'Pt2Line11_InCareOfName',
    'beneficiary.mailing.street':      'Pt2Line11_StreetNumberName',
    'beneficiary.mailing.unitType':    { pdf:'Pt2Line11_Unit_p4_ch3', type: 'unit' },
    'beneficiary.mailing.unitNum':     'Pt2Line11_AptSteFlrNumber',
    'beneficiary.mailing.city':        'Pt2Line11_CityOrTown',
    'beneficiary.mailing.state':       'Pt2Line11_State',
    'beneficiary.mailing.zip':         'Pt2Line11_ZipCode',
    'beneficiary.mailing.province':    'Pt2Line11_Province',
    'beneficiary.mailing.postal':      'Pt2Line11_PostalCode',
    'beneficiary.mailing.country':     'Pt2Line11_Country',

    // Beneficiary employment 1
    'beneficiary.employment[0].employer':   'Pt2Line16_NameofEmployer',
    'beneficiary.employment[0].street':     'Pt2Line17_StreetNumberName',
    'beneficiary.employment[0].unitType':   { pdf:'Pt2Line17_Unit_p4_ch3', type: 'unit' },
    'beneficiary.employment[0].unitNum':    'Pt2Line17_AptSteFlrNumber',
    'beneficiary.employment[0].city':       'Pt2Line17_CityOrTown',
    'beneficiary.employment[0].state':      'Pt2Line17_State',
    'beneficiary.employment[0].zip':        'Pt2Line17_ZipCode',
    'beneficiary.employment[0].province':   'Pt2Line17_Province',
    'beneficiary.employment[0].postal':     'Pt2Line17_PostalCode',
    'beneficiary.employment[0].country':    'Pt2Line17_Country',
    'beneficiary.employment[0].occupation': 'Pt2Line18_Occupation',
    'beneficiary.employment[0].dateFrom':   { pdf:'Pt2Line19a_DateFrom', transform: fmtDate },
    'beneficiary.employment[0].dateTo':     'Pt2Line19b_ToFrom',
  };

  const pdfNames = new Set(pdfForm.getFields().map(f => f.getName()));
  const missing = [];

  for (const [jsonPath, def] of Object.entries(mapping)) {
    const raw = get(data, jsonPath);
    const desc = typeof def === 'string' ? { pdf: def } : def;
    const pdfName = desc.pdf;

    if (!pdfNames.has(pdfName)) {
      onMissingPdfField?.({ jsonPath, pdfName });
      missing.push({ jsonPath, pdfName });
      continue;
    }

    let val = raw;
    if (desc.transform) val = desc.transform(raw);

    let ok = false;
    if (desc.type === 'checkbox') {
      ok = trySetCheckbox(pdfForm, pdfName, !!val);
    } else if (desc.type === 'unit') {
      // special: Apt/Ste/Flr tri-checkbox
      ok = setUnitTriCheckbox(pdfForm, pdfName, val);
      if (!ok) {
        // as fallback try generic
        ok = setAny(pdfForm, pdfName, val);
      }
    } else {
      ok = setAny(pdfForm, pdfName, val);
    }

    if (!ok) {
      onMissingPdfField?.({ jsonPath, pdfName });
      missing.push({ jsonPath, pdfName });
    }
  }

  return { missing };
}
