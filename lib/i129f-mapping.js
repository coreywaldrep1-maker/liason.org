// lib/i129f-mapping.js

/** small path getter (handles a.b.c, also a[0].b) */
function get(obj, path) {
  if (!obj) return undefined;
  const parts = Array.isArray(path) ? path : String(path).replaceAll('[', '.').replaceAll(']', '').split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

/** normalize date to MM/DD/YYYY if we got YYYY-MM-DD or similar */
function fmtDate(v) {
  if (!v) return '';
  // accept already formatted
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(v)) return v;
  // try ISO-like
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(v);
  if (m) {
    const [, y, mm, dd] = m;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(mm)}\/${pad(dd)}\/${y}`;
  }
  return String(v);
}

/** helpers to write safely */
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

/**
 * Apply our JSON -> PDF field mapping.
 * mapping: { "json.path": "PdfFieldName" } or { ... , transform: (v)=>string }
 */
export function applyI129fMapping(data, pdfForm, { onMissingPdfField } = {}) {
  const mapping = {
    /* ---------- Page 1 / Part 1 (Petitioner) ---------- */
    'petitioner.lastName':  'Pt1Line7a_FamilyName',
    'petitioner.firstName': 'Pt1Line7b_GivenName',
    'petitioner.middleName':'Pt1Line7c_MiddleName',

    'mailing.inCareOf':     'Pt1Line8_InCareofName',
    'mailing.street':       'Pt1Line8_StreetNumberName',
    'mailing.unitType':     'Pt1Line8_Unit_p0_ch3',      // if dropdown/checkbox group we’ll fall back to text if needed
    'mailing.unitNum':      'Pt1Line8_AptSteFlrNumber',
    'mailing.city':         'Pt1Line8_CityOrTown',
    'mailing.state':        'Pt1Line8_State',
    'mailing.zip':          'Pt1Line8_ZipCode',
    'mailing.province':     'Pt1Line8_Province',
    'mailing.postal':       'Pt1Line8_PostalCode',
    'mailing.country':      'Pt1Line8_Country',

    // If you stored a “resides in US?” flag:
    'mailing.inUs':         { pdf: 'Pt1Line8j_Checkboxes_p0_ch2', type: 'checkbox' },

    /* ---------- Page 2 / Pt1 (Lines 9–19) Employment & addresses history ---------- */
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

    /* ---------- Page 3 / Pt1 (Lines 20a–41) — parents & prior marriages etc. ---------- */
    'petitioner.parents[0].lastName':  'Pt1Line27a_FamilyName',
    'petitioner.parents[0].firstName': 'Pt1Line27b_GivenName',
    'petitioner.parents[0].middleName':'Pt1Line27c_MiddleName',
    'petitioner.parents[0].dob':       { pdf:'Pt1Line28_DateofBirth', transform: fmtDate },
    'petitioner.parents[0].citizenship':'Pt1Line30_CountryOfCitzOrNationality',

    'petitioner.parents[1].lastName':  'Pt1Line32a_FamilyName',
    'petitioner.parents[1].firstName': 'Pt1Line32b_GivenName',
    'petitioner.parents[1].middleName':'Pt1Line32c_MiddleName',
    'petitioner.parents[1].dob':       { pdf:'Pt1Line33_DateofBirth', transform: fmtDate },
    'petitioner.parents[1].citizenship':'Pt1Line35_CountryOfCitzOrNationality',

    // example other switches/yes-no:
    'petitioner.usCitizen':            { pdf: 'Pt1Line21_Checkbox_p2_ch2', type: 'checkbox' },

    /* ---------- Page 4 start / Pt1 → Pt2 ---------- */
    // Naturalization info (if you collect it):
    'petitioner.natz.number':          'Pt1Line42a_NaturalizationNumber',
    'petitioner.natz.place':           'Pt1Line42b_NaturalizationPlaceOfIssuance',
    'petitioner.natz.date':            { pdf:'Pt1Line42c_DateOfIssuance', transform: fmtDate },

    /* ---------- Page 4 continued / Pt2 (Beneficiary) names ---------- */
    'beneficiary.lastName':            'Pt2Line1a_FamilyName',
    'beneficiary.firstName':           'Pt2Line1b_GivenName',
    'beneficiary.middleName':          'Pt2Line1c_MiddleName',
    'beneficiary.aNumber':             'Pt2Line2_AlienNumber',
    'beneficiary.ssn':                 'Pt2Line3_SSN',
    'beneficiary.dob':                 { pdf:'Pt2Line4_DateOfBirth', transform: fmtDate },
    'beneficiary.cityOfBirth':         'Pt2Line7_CityTownOfBirth',
    'beneficiary.countryOfBirth':      'Pt2Line8_CountryOfBirth',
    'beneficiary.nationality':         'Pt2Line9_CountryofCitzOrNationality',

    // Beneficiary mailing
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

    // Beneficiary employment row 1
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

    // …continue expanding as needed following the same pattern…
  };

  // write everything
  const pdfFields = new Set(pdfForm.getFields().map(f => f.getName()));
  const missing = [];

  for (const [jsonPath, def] of Object.entries(mapping)) {
    const valRaw = get(data, jsonPath);
    const desc = typeof def === 'string' ? { pdf: def } : def;
    const pdfName = desc.pdf ?? def;

    if (!pdfFields.has(pdfName)) {
      if (onMissingPdfField) onMissingPdfField({ jsonPath, pdfName });
      missing.push({ jsonPath, pdfName });
      continue;
    }

    let out = valRaw;
    if (desc.transform) out = desc.transform(valRaw);
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
