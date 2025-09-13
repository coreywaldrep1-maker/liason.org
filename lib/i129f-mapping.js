// lib/i129f-mapping.js

/** small path getter (a.b.c and a[0].b) */
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

/** normalize date to MM/DD/YYYY if we got YYYY-MM-DD */
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

/* ========= UI catalog (used by /flow/us/i-129f/all-fields) ========= */
export const I129F_SECTIONS = [
  {
    key: 'petitioner',
    title: 'Part 1 — Petitioner (names)',
    fields: [
      { path: 'petitioner.lastName',  label: 'Last (family) name' },
      { path: 'petitioner.firstName', label: 'First (given) name' },
      { path: 'petitioner.middleName',label: 'Middle name' },
      { path: 'mailing.inCareOf',     label: 'In care of (Line 8)' },
      { path: 'mailing.street',       label: 'Street' },
      { path: 'mailing.unitType',     label: 'Unit type (Apt/Ste/Flr)' },
      { path: 'mailing.unitNum',      label: 'Unit number' },
      { path: 'mailing.city',         label: 'City' },
      { path: 'mailing.state',        label: 'State' },
      { path: 'mailing.zip',          label: 'ZIP' },
      { path: 'mailing.province',     label: 'Province' },
      { path: 'mailing.postal',       label: 'Postal code' },
      { path: 'mailing.country',      label: 'Country' },
      { path: 'mailing.inUs',         label: 'Address in U.S.? (checkbox)', type: 'checkbox' },
    ],
  },
  {
    key: 'employment',
    title: 'Part 1 — Employment history',
    fields: [
      { path: 'employment[0].employer',   label: 'Employer 1 — name' },
      { path: 'employment[0].street',     label: 'Employer 1 — street' },
      { path: 'employment[0].unitType',   label: 'Employer 1 — unit type' },
      { path: 'employment[0].unitNum',    label: 'Employer 1 — unit num' },
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
      { path: 'employment[1].unitNum',    label: 'Employer 2 — unit num' },
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
    title: 'Part 2 — Beneficiary (names)',
    fields: [
      { path: 'beneficiary.lastName',  label: 'Last (family) name' },
      { path: 'beneficiary.firstName', label: 'First (given) name' },
      { path: 'beneficiary.middleName',label: 'Middle name' },
      { path: 'beneficiary.aNumber',   label: 'A-Number' },
      { path: 'beneficiary.ssn',       label: 'SSN' },
      { path: 'beneficiary.dob',       label: 'Date of birth (MM/DD/YYYY)' },
      { path: 'beneficiary.cityOfBirth',    label: 'City/town of birth' },
      { path: 'beneficiary.countryOfBirth', label: 'Country of birth' },
      { path: 'beneficiary.nationality',    label: 'Citizenship/Nationality' },
      { path: 'beneficiary.mailing.inCareOf', label: 'Mailing — in care of' },
      { path: 'beneficiary.mailing.street',   label: 'Mailing — street' },
      { path: 'beneficiary.mailing.unitType', label: 'Mailing — unit type' },
      { path: 'beneficiary.mailing.unitNum',  label: 'Mailing — unit num' },
      { path: 'beneficiary.mailing.city',     label: 'Mailing — city' },
      { path: 'beneficiary.mailing.state',    label: 'Mailing — state' },
      { path: 'beneficiary.mailing.zip',      label: 'Mailing — ZIP' },
      { path: 'beneficiary.mailing.province', label: 'Mailing — province' },
      { path: 'beneficiary.mailing.postal',   label: 'Mailing — postal' },
      { path: 'beneficiary.mailing.country',  label: 'Mailing — country' },
    ],
  },
];

/* ========= JSON -> PDF mapping (write into form) ========= */

function setText(form, name, val) {
  const f = form.getTextField(name);
  if (!f) return false;
  f.setText(val ?? '');
  return true;
}
function setCheck(form, name, checked) {
  const f = form.getCheckBox(name);
  if (!f) return false;
  if (checked) f.check(); else f.uncheck();
  return true;
}
function setOption(form, name, value) {
  const f = form.getDropdown(name);
  if (!f) return false;
  if (value == null || value === '') return false;
  try { f.select(String(value)); } catch { /* ignore */ }
  return true;
}

export function applyI129fMapping(data, pdfForm, { onMissingPdfField } = {}) {
  const mapping = {
    // Part 1 name/address
    'petitioner.lastName':  'Pt1Line7a_FamilyName',
    'petitioner.firstName': 'Pt1Line7b_GivenName',
    'petitioner.middleName':'Pt1Line7c_MiddleName',

    'mailing.inCareOf':     'Pt1Line8_InCareofName',
    'mailing.street':       'Pt1Line8_StreetNumberName',
    'mailing.unitType':     'Pt1Line8_Unit_p0_ch3',
    'mailing.unitNum':      'Pt1Line8_AptSteFlrNumber',
    'mailing.city':         'Pt1Line8_CityOrTown',
    'mailing.state':        'Pt1Line8_State',
    'mailing.zip':          'Pt1Line8_ZipCode',
    'mailing.province':     'Pt1Line8_Province',
    'mailing.postal':       'Pt1Line8_PostalCode',
    'mailing.country':      'Pt1Line8_Country',
    'mailing.inUs':         { pdf: 'Pt1Line8j_Checkboxes_p0_ch2', type: 'checkbox' },

    // Part 1 employment (two rows shown; add more as needed)
    'employment[0].employer':   'Pt1Line13_NameofEmployer',
    'employment[0].street':     'Pt1Line14_StreetNumberName',
    'employment[0].unitType':   'Pt1Line14_Unit_p1_ch3',
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

    'employment[1].employer':   'Pt1Line17_NameofEmployer',
    'employment[1].street':     'Pt1Line18_StreetNumberName',
    'employment[1].unitType':   'Pt1Line18_Unit_p1_ch3',
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

    // Part 2 beneficiary (names/mail)
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
    'beneficiary.mailing.unitType':    'Pt2Line11_Unit_p4_ch3',
    'beneficiary.mailing.unitNum':     'Pt2Line11_AptSteFlrNumber',
    'beneficiary.mailing.city':        'Pt2Line11_CityOrTown',
    'beneficiary.mailing.state':       'Pt2Line11_State',
    'beneficiary.mailing.zip':         'Pt2Line11_ZipCode',
    'beneficiary.mailing.province':    'Pt2Line11_Province',
    'beneficiary.mailing.postal':      'Pt2Line11_PostalCode',
    'beneficiary.mailing.country':     'Pt2Line11_Country',

    'beneficiary.employment[0].employer':   'Pt2Line16_NameofEmployer',
    'beneficiary.employment[0].street':     'Pt2Line17_StreetNumberName',
    'beneficiary.employment[0].unitType':   'Pt2Line17_Unit_p4_ch3',
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

  const pdfFields = new Set(pdfForm.getFields().map(f => f.getName()));
  const missing = [];

  for (const [jsonPath, def] of Object.entries(mapping)) {
    const raw = get(data, jsonPath);
    const desc = typeof def === 'string' ? { pdf: def } : def;
    const pdfName = desc.pdf ?? def;

    if (!pdfFields.has(pdfName)) {
      if (onMissingPdfField) onMissingPdfField({ jsonPath, pdfName });
      missing.push({ jsonPath, pdfName });
      continue;
    }

    let out = raw;
    if (desc.transform) out = desc.transform(raw);

    if (desc.type === 'checkbox') {
      setCheck(pdfForm, pdfName, !!out);
    } else if (desc.type === 'dropdown') {
      setOption(pdfForm, pdfName, out ?? '');
    } else {
      setText(pdfForm, pdfName, out == null ? '' : String(out));
    }
  }

  return { missing };
}
