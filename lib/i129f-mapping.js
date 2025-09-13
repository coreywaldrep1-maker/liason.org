// lib/i129f-mapping.js
//
// Mapping helpers + full Part 1 & Part 2 coverage scaffold.
// - Safe setters (text, checkbox, radio, dropdown) so we never crash.
// - Normalizes "mailing same as physical": copies mailing -> physicalAddresses[0],
//   sets from/to dates (Present).
// - You can add/adjust entries in I129F_MAP easily.

function fmtDateMMDDYYYY(s) {
  if (!s) return '';
  // Accepts "YYYY-MM-DD", "MM/DD/YYYY", or Date-like strings, outputs MM/DD/YYYY
  const d = new Date(s);
  if (!isNaN(d)) {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }
  // If user already typed MM/DD/YYYY, leave it
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
  // If user typed YYYY-MM-DD, convert
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return `${m[2]}/${m[3]}/${m[1]}`;
  return s;
}

function safeSetText(form, name, val) {
  if (val == null || val === '') return;
  try { form.getTextField(name).setText(String(val)); return true; } catch {}
  return false;
}

function safeSetCheckbox(form, name, val) {
  // Accepts booleans, "Yes"/"No", "Y"/"N", "true"/"false"
  const yes =
    val === true ||
    String(val).toLowerCase() === 'yes' ||
    String(val).toLowerCase() === 'y' ||
    String(val).toLowerCase() === 'true' ||
    String(val) === '1';
  try {
    const cb = form.getCheckBox(name);
    if (yes) cb.check(); else cb.uncheck();
    return true;
  } catch {}
  return false;
}

function safeSetRadio(form, name, val) {
  if (val == null || val === '') return false;
  try { form.getRadioGroup(name).select(String(val)); return true; } catch {}
  return false;
}

function safeSetDropdown(form, name, val) {
  if (val == null || val === '') return false;
  try { form.getDropdown(name).select(String(val)); return true; } catch {}
  return false;
}

function setField(form, pdfName, value, { date = false } = {}) {
  if (value == null) return;
  const v = date ? fmtDateMMDDYYYY(value) : value;

  // Try text first (most fields)
  if (safeSetText(form, pdfName, v)) return;

  // Try checkbox (boolean-y)
  if (safeSetCheckbox(form, pdfName, v)) return;

  // Try radio (string option)
  if (safeSetRadio(form, pdfName, v)) return;

  // Try dropdown/select
  safeSetDropdown(form, pdfName, v);
}

// ---------- Normalization: mailing same as physical ----------
function normalizeData(d = {}) {
  const out = JSON.parse(JSON.stringify(d || {}));
  const m = out.mailing || {};
  if (m.sameAsPhysical) {
    if (!out.physicalAddresses) out.physicalAddresses = [];
    const first = out.physicalAddresses[0] || {};
    out.physicalAddresses[0] = {
      ...first,
      street: m.street || first.street || '',
      unitType: m.unitType || first.unitType || '',
      unitNum: m.unitNum || first.unitNum || '',
      city: m.city || first.city || '',
      state: m.state || first.state || '',
      zip: m.zip || first.zip || '',
      province: m.province || first.province || '',
      postal: m.postal || first.postal || '',
      country: m.country || first.country || 'United States',
      from: m.fromDate || first.from || '',
      to: first.to || 'Present',
    };
  }
  return out;
}

// Helper to join unitType + unitNum for forms that only have one box
function unitTogether(unitType, unitNum) {
  const a = (unitType || '').trim();
  const b = (unitNum || '').trim();
  if (a && b) return `${a} ${b}`;
  return a || b || '';
}

// ---------- Main mapping table (Part 1 & 2, broad coverage) ----------
// NOTE: We map *your JSON paths* => *PDF field names*
//
// If a PDF field is a "unit type" checkbox set or dropdown, we usually
// just put combined unit text in the text box (Apt/Ste/Flr) so it always shows.

export const I129F_MAP = {
  // =========================
  // PART 1 — PETITIONER
  // Names
  'petitioner.lastName': 'Pt1Line6a_FamilyName',
  'petitioner.firstName': 'Pt1Line6b_GivenName',
  'petitioner.middleName': 'Pt1Line6c_MiddleName',

  // Other names used (first row)
  'petitioner.otherNames[0].lastName': 'Pt1Line7a_FamilyName',
  'petitioner.otherNames[0].firstName': 'Pt1Line7b_GivenName',
  'petitioner.otherNames[0].middleName': 'Pt1Line7c_MiddleName',

  // A-Number / SSA / USCIS Online Account (if you collect them)
  'petitioner.aNumber': 'Pt1Line1_AlienNumber',
  'petitioner.uscisAccount': 'Pt1Line2_AcctIdentifier',
  'petitioner.ssn': 'Pt1Line3_SSN',

  // Marital status (Pt1Line4a/b/5a/b look like checkboxes on many revisions)
  // If you collect as a single string ("single","married","divorced","widowed"), pick one below and adjust:
  'petitioner.marital.single': 'Pt1Line4a_Checkboxes_p0_ch2', // update if your PDF differs
  'petitioner.marital.married': 'Pt1Line5_Checkboxes_p0_ch2', // update if your PDF differs

  // Mailing address (Line 8)
  'mailing.inCareOf': 'Pt1Line8_InCareofName',
  'mailing.street': 'Pt1Line8_StreetNumberName',
  // We'll place Apt/Ste/Flr combined into the text box
  'mailing.unitCombined': 'Pt1Line8_AptSteFlrNumber',
  'mailing.city': 'Pt1Line8_CityOrTown',
  'mailing.state': 'Pt1Line8_State',
  'mailing.zip': 'Pt1Line8_ZipCode',
  'mailing.province': 'Pt1Line8_Province',
  'mailing.postal': 'Pt1Line8_PostalCode',
  'mailing.country': 'Pt1Line8_Country',
  // 8j "In the U.S." checkbox
  'mailing.inUS': 'Pt1Line8j_Checkboxes_p0_ch2',

  // Physical address history — we’ll map first two addresses explicitly
  // Current physical (Lines 9–10)
  'physicalAddresses[0].street': 'Pt1Line9_StreetNumberName',
  'physicalAddresses[0].unitCombined': 'Pt1Line9_AptSteFlrNumber',
  'physicalAddresses[0].city': 'Pt1Line9_CityOrTown',
  'physicalAddresses[0].state': 'Pt1Line9_State',
  'physicalAddresses[0].zip': 'Pt1Line9_ZipCode',
  'physicalAddresses[0].province': 'Pt1Line9_Province',
  'physicalAddresses[0].postal': 'Pt1Line9_PostalCode',
  'physicalAddresses[0].country': 'Pt1Line9_Country',
  'physicalAddresses[0].from': 'Pt1Line10a_DateFrom',
  'physicalAddresses[0].to': 'Pt1Line10b_DateFrom', // some PDFs label both a/b as DateFrom/To

  // Prior physical (Lines 11–12)
  'physicalAddresses[1].street': 'Pt1Line11_StreetNumberName',
  'physicalAddresses[1].unitCombined': 'Pt1Line11_AptSteFlrNumber',
  'physicalAddresses[1].city': 'Pt1Line11_CityOrTown',
  'physicalAddresses[1].state': 'Pt1Line11_State',
  'physicalAddresses[1].zip': 'Pt1Line11_ZipCode',
  'physicalAddresses[1].province': 'Pt1Line11_Province',
  'physicalAddresses[1].postal': 'Pt1Line11_PostalCode',
  'physicalAddresses[1].country': 'Pt1Line11_Country',
  'physicalAddresses[1].from': 'Pt1Line12a_DateFrom',
  'physicalAddresses[1].to': 'Pt1Line12b_ToFrom',

  // Employment (current job: Lines 13–16)
  'employment[0].employer': 'Pt1Line13_NameofEmployer',
  'employment[0].street': 'Pt1Line14_StreetNumberName',
  'employment[0].unitCombined': 'Pt1Line14_AptSteFlrNumber',
  'employment[0].city': 'Pt1Line14_CityOrTown',
  'employment[0].state': 'Pt1Line14_State',
  'employment[0].zip': 'Pt1Line14_ZipCode',
  'employment[0].province': 'Pt1Line14_Province',
  'employment[0].postal': 'Pt1Line14_PostalCode',
  'employment[0].country': 'Pt1Line14_Country',
  'employment[0].occupation': 'Pt1Line15_Occupation',
  'employment[0].from': 'Pt1Line16a_DateFrom',
  'employment[0].to': 'Pt1Line16b_ToFrom',

  // Employment (previous job: Lines 17–19)
  'employment[1].employer': 'Pt1Line17_NameofEmployer',
  'employment[1].street': 'Pt1Line18_StreetNumberName',
  'employment[1].unitCombined': 'Pt1Line18_AptSteFlrNumber',
  'employment[1].city': 'Pt1Line18_CityOrTown',
  'employment[1].state': 'Pt1Line18_State',
  'employment[1].zip': 'Pt1Line18_ZipCode',
  'employment[1].province': 'Pt1Line18_Province',
  'employment[1].postal': 'Pt1Line18_PostalCode',
  'employment[1].country': 'Pt1Line18_Country',
  'employment[1].occupation': 'Pt1Line19_Occupation',

  // =========================
  // PART 2 — BENEFICIARY
  // Names
  'beneficiary.lastName': 'Pt2Line1a_FamilyName',
  'beneficiary.firstName': 'Pt2Line1b_GivenName',
  'beneficiary.middleName': 'Pt2Line1c_MiddleName',

  // A-number / SSN / DOB / Sex / Status
  'beneficiary.aNumber': 'Pt2Line2_AlienNumber',
  'beneficiary.ssn': 'Pt2Line3_SSN',
  'beneficiary.dob': 'Pt2Line4_DateOfBirth',
  'beneficiary.sex.male': 'Pt2Line5_Checkboxes_p3_ch2', // update if your PDF differs
  'beneficiary.marital.single': 'Pt2Line6_Checkboxes_p3_ch4', // sample mapping if needed

  // Birth
  'beneficiary.birthCity': 'Pt2Line7_CityTownOfBirth',
  'beneficiary.birthCountry': 'Pt2Line8_CountryOfBirth',
  'beneficiary.citizenship': 'Pt2Line9_CountryofCitzOrNationality',

  // Parents (10a–10c often used for father/mother names on some revisions)
  'beneficiary.parent1.lastName': 'Pt2Line10a_FamilyName',
  'beneficiary.parent1.firstName': 'Pt2Line10b_GivenName',
  'beneficiary.parent1.middleName': 'Pt2Line10c_MiddleName',

  // Mailing/Physical for beneficiary (Lines 11–17; these exist per your field list)
  'beneficiary.mailing.inCareOf': 'Pt2Line11_InCareOfName',
  'beneficiary.mailing.street': 'Pt2Line11_StreetNumberName',
  'beneficiary.mailing.unitCombined': 'Pt2Line11_AptSteFlrNumber',
  'beneficiary.mailing.city': 'Pt2Line11_CityOrTown',
  'beneficiary.mailing.state': 'Pt2Line11_State',
  'beneficiary.mailing.zip': 'Pt2Line11_ZipCode',
  'beneficiary.mailing.province': 'Pt2Line11_Province',
  'beneficiary.mailing.postal': 'Pt2Line11_PostalCode',
  'beneficiary.mailing.country': 'Pt2Line11_Country',

  'beneficiary.mailing.from': 'Pt2Line15a_DateFrom',
  'beneficiary.mailing.to': 'Pt2Line15b_ToFrom',

  'beneficiary.employment[0].employer': 'Pt2Line16_NameofEmployer',
  'beneficiary.employment[0].street': 'Pt2Line12_StreetNumberName',
  'beneficiary.employment[0].unitCombined': 'Pt2Line12_AptSteFlrNumber',
  'beneficiary.employment[0].city': 'Pt2Line12_CityOrTown',
  'beneficiary.employment[0].state': 'Pt2Line12_State',
  'beneficiary.employment[0].zip': 'Pt2Line12_ZipCode',
  'beneficiary.employment[0].province': 'Pt2Line12_Province',
  'beneficiary.employment[0].postal': 'Pt2Line12_PostalCode',
  'beneficiary.employment[0].country': 'Pt2Line12_Country',

  'beneficiary.employment[1].employer': 'Pt2Line20_NameofEmployer',
  'beneficiary.employment[1].street': 'Pt2Line17_StreetNumberName',
  'beneficiary.employment[1].unitCombined': 'Pt2Line17_AptSteFlrNumber',
  'beneficiary.employment[1].city': 'Pt2Line17_CityOrTown',
  'beneficiary.employment[1].state': 'Pt2Line17_State',
  'beneficiary.employment[1].zip': 'Pt2Line17_ZipCode',
  'beneficiary.employment[1].province': 'Pt2Line17_Province',
  'beneficiary.employment[1].postal': 'Pt2Line17_PostalCode',
  'beneficiary.employment[1].country': 'Pt2Line17_Country',
  'beneficiary.employment[1].occupation': 'Pt2Line18_Occupation',
  'beneficiary.employment[1].from': 'Pt2Line19a_DateFrom',
  'beneficiary.employment[1].to': 'Pt2Line19b_ToFrom',
};

// Export for the All-Fields debug page if you’re using it
export const I129F_SECTIONS = [
  { key: 'Part 1', prefix: 'Pt1' },
  { key: 'Part 2', prefix: 'Pt2' },
];

export function applyI129fMapping(rawData, form) {
  // 1) normalize (mailing same as physical)
  const data = normalizeData(rawData);

  // 2) build “derived” fields (unitCombined targets)
  const withDerived = {
    ...data,
    mailing: {
      ...data.mailing,
      unitCombined: unitTogether(data.mailing?.unitType, data.mailing?.unitNum),
    },
    physicalAddresses: (data.physicalAddresses || []).map(a => ({
      ...a,
      unitCombined: unitTogether(a?.unitType, a?.unitNum),
    })),
    beneficiary: {
      ...(data.beneficiary || {}),
      mailing: {
        ...(data.beneficiary?.mailing || {}),
        unitCombined: unitTogether(
          data.beneficiary?.mailing?.unitType,
          data.beneficiary?.mailing?.unitNum
        ),
      },
      employment: (data.beneficiary?.employment || []).map(a => ({
        ...a,
        unitCombined: unitTogether(a?.unitType, a?.unitNum),
      })),
    },
    employment: (data.employment || []).map(a => ({
      ...a,
      unitCombined: unitTogether(a?.unitType, a?.unitNum),
    })),
  };

  // 3) iterate the MAP
  for (const [jsonPath, pdfName] of Object.entries(I129F_MAP)) {
    const val = pick(withDerived, jsonPath);
    const isDate = /(^|\.)(from|to|dob|date|DateOfBirth|DateFrom|DateExpired|DateOfIssuance)$/i.test(jsonPath);
    setField(form, pdfName, val, { date: isDate });
  }
}

// tiny dot/bracket path getter: pick(obj, "a.b[0].c")
function pick(obj, path) {
  if (!obj || !path) return undefined;
  const parts = path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean);
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}
