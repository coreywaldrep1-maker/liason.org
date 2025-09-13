// lib/i129f-mapping.js
//
// Extended mapping for I-129F Part 1 (Petitioner) and Part 2 (Beneficiary).
// - Safe setters (skips missing PDF fields and non-text fields)
// - Uses dotted JSON paths from your wizard data.
// - If a field isn’t present in your saved JSON, it’s silently ignored.
// - Checkboxes are intentionally skipped here to avoid type errors;
//   we’ll wire those once you confirm the exact PDF checkbox names.
//
// After you paste this, your /api/i129f/pdf route should call:
//   import { applyI129fMapping } from '@/lib/i129f-mapping';
//   applyI129fMapping(savedJson, form);

//////////////////////////////
// Helpers
//////////////////////////////

function getByPath(obj, path) {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

function setText(form, pdfFieldName, value) {
  if (value == null || value === '') return;
  try {
    const tf = form.getTextField(pdfFieldName);
    tf.setText(String(value));
  } catch {
    // Field missing or not a text field – skip safely
  }
}

//////////////////////////////
// Mapping dictionary
//////////////////////////////

// NOTE: These keys assume a JSON shape like:
// {
//   petitioner: { ... , otherNames: [{...}], parents: [{...},{...}], priorSpouses:[{...}], ... },
//   mailing: {...},
//   physicalAddresses: [{...},{...}],
//   employment: [{...},{...}],
//   beneficiary: {
//     ...,
//     otherNames:[{...}],
//     addressAbroad:{...},
//     usAddress:{...},
//     employment:[{...},{...}],
//     parents:[{...},{...}],
//   }
// }
//
// If your keys differ, tell me and I’ll align them.

export const I129F_MAPPING = {
  ////////////////////////////////////////
  // PART 1 — PETITIONER
  ////////////////////////////////////////

  // (Lines 1–3) IDs
  'petitioner.aNumber'             : 'Pt1Line1_AlienNumber',
  'petitioner.uscisOnlineAccount'  : 'Pt1Line2_AcctIdentifier',
  'petitioner.ssn'                 : 'Pt1Line3_SSN',

  // (Line 6) Petitioner primary name
  'petitioner.lastName'            : 'Pt1Line6a_FamilyName',
  'petitioner.firstName'           : 'Pt1Line6b_GivenName',
  'petitioner.middleName'          : 'Pt1Line6c_MiddleName',

  // (Line 7) Other names used (first alias only)
  'petitioner.otherNames.0.lastName'   : 'Pt1Line7a_FamilyName',
  'petitioner.otherNames.0.firstName'  : 'Pt1Line7b_GivenName',
  'petitioner.otherNames.0.middleName' : 'Pt1Line7c_MiddleName',

  // (Line 8) Mailing address (text fields only)
  'mailing.inCareOf'               : 'Pt1Line8_InCareofName',
  'mailing.street'                 : 'Pt1Line8_StreetNumberName',
  // 'mailing.unitType'             : 'Pt1Line8_Unit_p0_ch3', // likely checkbox group – skip here
  'mailing.unitNum'                : 'Pt1Line8_AptSteFlrNumber',
  'mailing.city'                   : 'Pt1Line8_CityOrTown',
  'mailing.state'                  : 'Pt1Line8_State',
  'mailing.zip'                    : 'Pt1Line8_ZipCode',
  'mailing.province'               : 'Pt1Line8_Province',
  'mailing.postal'                 : 'Pt1Line8_PostalCode',
  'mailing.country'                : 'Pt1Line8_Country',
  // 'mailing.safeMail'            : 'Pt1Line8j_Checkboxes_p0_ch2', // checkbox-ish – skip

  // (Lines 9–12) Physical address history (2 slots present in PDF)
  // Address #1 (Line 9) + dates (Line 10)
  'physicalAddresses.0.street'     : 'Pt1Line9_StreetNumberName',
  // 'physicalAddresses.0.unitType': 'Pt1Line9_Unit_p1_ch3', // skip (likely checkbox)
  'physicalAddresses.0.unitNum'    : 'Pt1Line9_AptSteFlrNumber',
  'physicalAddresses.0.city'       : 'Pt1Line9_CityOrTown',
  'physicalAddresses.0.state'      : 'Pt1Line9_State',
  'physicalAddresses.0.zip'        : 'Pt1Line9_ZipCode',
  'physicalAddresses.0.province'   : 'Pt1Line9_Province',
  'physicalAddresses.0.postal'     : 'Pt1Line9_PostalCode',
  'physicalAddresses.0.country'    : 'Pt1Line9_Country',
  'physicalAddresses.0.from'       : 'Pt1Line10a_DateFrom',
  'physicalAddresses.0.to'         : 'Pt1Line10b_DateFrom', // PDF label is weird; still a date

  // Address #2 (Line 11) + dates (Line 12)
  'physicalAddresses.1.street'     : 'Pt1Line11_StreetNumberName',
  // 'physicalAddresses.1.unitType': 'Pt1Line11_Unit_p1_ch3', // skip
  'physicalAddresses.1.unitNum'    : 'Pt1Line11_AptSteFlrNumber',
  'physicalAddresses.1.city'       : 'Pt1Line11_CityOrTown',
  'physicalAddresses.1.state'      : 'Pt1Line11_State',
  'physicalAddresses.1.zip'        : 'Pt1Line11_ZipCode',
  'physicalAddresses.1.province'   : 'Pt1Line11_Province',
  'physicalAddresses.1.postal'     : 'Pt1Line11_PostalCode',
  'physicalAddresses.1.country'    : 'Pt1Line11_Country',
  'physicalAddresses.1.from'       : 'Pt1Line12a_DateFrom',
  'physicalAddresses.1.to'         : 'Pt1Line12b_ToFrom',

  // (Lines 13–20) Employment history (2 employers)
  // Employer #1 (13–16)
  'employment.0.employer'          : 'Pt1Line13_NameofEmployer',
  'employment.0.street'            : 'Pt1Line14_StreetNumberName',
  // 'employment.0.unitType'       : 'Pt1Line14_Unit_p1_ch3', // skip
  'employment.0.unitNum'           : 'Pt1Line14_AptSteFlrNumber',
  'employment.0.city'              : 'Pt1Line14_CityOrTown',
  'employment.0.state'             : 'Pt1Line14_State',
  'employment.0.zip'               : 'Pt1Line14_ZipCode',
  'employment.0.province'          : 'Pt1Line14_Province',
  'employment.0.postal'            : 'Pt1Line14_PostalCode',
  'employment.0.country'           : 'Pt1Line14_Country',
  'employment.0.occupation'        : 'Pt1Line15_Occupation',
  'employment.0.from'              : 'Pt1Line16a_DateFrom',
  'employment.0.to'                : 'Pt1Line16b_ToFrom',

  // Employer #2 (17–20)
  'employment.1.employer'          : 'Pt1Line17_NameofEmployer',
  'employment.1.street'            : 'Pt1Line18_StreetNumberName',
  // 'employment.1.unitType'       : 'Pt1Line18_Unit_p1_ch3', // skip
  'employment.1.unitNum'           : 'Pt1Line18_AptSteFlrNumber',
  'employment.1.city'              : 'Pt1Line18_CityOrTown',
  'employment.1.state'             : 'Pt1Line18_State',
  'employment.1.zip'               : 'Pt1Line18_ZipCode',
  'employment.1.province'          : 'Pt1Line18_Province',
  'employment.1.postal'            : 'Pt1Line18_PostalCode',
  'employment.1.country'           : 'Pt1Line18_Country',
  'employment.1.occupation'        : 'Pt1Line19_Occupation',
  'employment.1.from'              : 'Pt1Line20a_DateFrom',
  'employment.1.to'                : 'Pt1Line20b_ToFrom',

  // (Lines 22–26) Petitioner birth & citizenship
  'petitioner.dob'                 : 'Pt1Line22_DateofBirth',
  'petitioner.cityOfBirth'         : 'Pt1Line24_CityTownOfBirth',
  'petitioner.stateOfBirth'        : 'Pt1Line25_ProvinceOrStateOfBirth',
  'petitioner.citizenshipCountry'  : 'Pt1Line26_CountryOfCitzOrNationality',

  // (Lines 27–31) Parent #1
  'petitioner.parents.0.lastName'      : 'Pt1Line27a_FamilyName',
  'petitioner.parents.0.firstName'     : 'Pt1Line27b_GivenName',
  'petitioner.parents.0.middleName'    : 'Pt1Line27c_MiddleName',
  'petitioner.parents.0.dob'           : 'Pt1Line28_DateofBirth',
  'petitioner.parents.0.citizenship'   : 'Pt1Line30_CountryOfCitzOrNationality',
  'petitioner.parents.0.cityOfBirth'   : 'Pt1Line31_CityTownOfBirth',
  'petitioner.parents.0.countryOfBirth': 'Pt1Line31_CountryOfCitzOrNationality',

  // (Lines 32–37) Parent #2
  'petitioner.parents.1.lastName'      : 'Pt1Line32a_FamilyName',
  'petitioner.parents.1.firstName'     : 'Pt1Line32b_GivenName',
  'petitioner.parents.1.middleName'    : 'Pt1Line32c_MiddleName',
  'petitioner.parents.1.dob'           : 'Pt1Line33_DateofBirth',
  'petitioner.parents.1.citizenship'   : 'Pt1Line35_CountryOfCitzOrNationality',
  'petitioner.parents.1.cityOfBirth'   : 'Pt1Line36a_CityTownOfBirth',
  'petitioner.parents.1.countryOfBirth': 'Pt1Line36b_CountryOfCitzOrNationality',

  // (Lines 38–39) Prior spouse #1
  'petitioner.priorSpouses.0.lastName'   : 'Pt1Line38a_FamilyName',
  'petitioner.priorSpouses.0.firstName'  : 'Pt1Line38b_GivenName',
  'petitioner.priorSpouses.0.middleName' : 'Pt1Line38c_MiddleName',
  'petitioner.priorSpouses.0.dateMarriageEnded' : 'Pt1Line39_DateMarriageEnded',

  // (Lines 42–46) Naturalization / A-number (if applicable)
  'petitioner.natzNumber' : 'Pt1Line42a_NaturalizationNumber',
  'petitioner.natzPlace'  : 'Pt1Line42b_NaturalizationPlaceOfIssuance',
  'petitioner.natzDate'   : 'Pt1Line42c_DateOfIssuance',
  // 'petitioner.aNumber2' : 'Pt1Line44_A_Number', // optional if your PDF expects another A#
  // 'petitioner.someName' : 'Pt1Line45a/b/c',     // unknown context – wire if needed
  // 'petitioner.someDate' : 'Pt1Line46_DateOfFilling',
};

////////////////////////////////////////
// PART 2 — BENEFICIARY
////////////////////////////////////////

const PART2_MAP = {
  // (Line 1) Primary name
  'beneficiary.lastName'      : 'Pt2Line1a_FamilyName',
  'beneficiary.firstName'     : 'Pt2Line1b_GivenName',
  'beneficiary.middleName'    : 'Pt2Line1c_MiddleName',

  // (Lines 2–4) IDs & DOB
  'beneficiary.aNumber'       : 'Pt2Line2_AlienNumber',
  'beneficiary.ssn'           : 'Pt2Line3_SSN',
  'beneficiary.dob'           : 'Pt2Line4_DateOfBirth',

  // (Lines 7–9) Birth & citizenship
  'beneficiary.cityOfBirth'       : 'Pt2Line7_CityTownOfBirth',
  'beneficiary.countryOfBirth'    : 'Pt2Line8_CountryOfBirth',
  'beneficiary.citizenshipCountry': 'Pt2Line9_CountryofCitzOrNationality',

  // (Line 10) Other names used (first alias)
  'beneficiary.otherNames.0.lastName'   : 'Pt2Line10a_FamilyName',
  'beneficiary.otherNames.0.firstName'  : 'Pt2Line10b_GivenName',
  'beneficiary.otherNames.0.middleName' : 'Pt2Line10c_MiddleName',

  // (Lines 11–15) Address Abroad (name as you prefer)
  'beneficiary.addressAbroad.inCareOf' : 'Pt2Line11_InCareOfName',
  'beneficiary.addressAbroad.street'   : 'Pt2Line11_StreetNumberName',
  // 'beneficiary.addressAbroad.unitType': 'Pt2Line11_Unit_p4_ch3', // checkbox-ish – skip
  'beneficiary.addressAbroad.unitNum'  : 'Pt2Line11_AptSteFlrNumber',
  'beneficiary.addressAbroad.city'     : 'Pt2Line11_CityOrTown',
  'beneficiary.addressAbroad.state'    : 'Pt2Line11_State',
  'beneficiary.addressAbroad.zip'      : 'Pt2Line11_ZipCode',
  'beneficiary.addressAbroad.province' : 'Pt2Line11_Province',
  'beneficiary.addressAbroad.postal'   : 'Pt2Line11_PostalCode',
  'beneficiary.addressAbroad.country'  : 'Pt2Line11_Country',
  'beneficiary.addressAbroad.from'     : 'Pt2Line15a_DateFrom',
  'beneficiary.addressAbroad.to'       : 'Pt2Line15b_ToFrom',

  // (Lines 14–? ) U.S. Address (if any)
  'beneficiary.usAddress.street'   : 'Pt2Line14_StreetNumberName',
  // 'beneficiary.usAddress.unitType': 'Pt2Line14_Unit_p4_ch3', // skip
  'beneficiary.usAddress.unitNum'  : 'Pt2Line14_AptSteFlrNumber',
  'beneficiary.usAddress.city'     : 'Pt2Line14_CityOrTown',
  'beneficiary.usAddress.state'    : 'Pt2Line14_State',
  'beneficiary.usAddress.zip'      : 'Pt2Line14_ZipCode',
  'beneficiary.usAddress.province' : 'Pt2Line14_Province',
  'beneficiary.usAddress.postal'   : 'Pt2Line14_PostalCode',
  'beneficiary.usAddress.country'  : 'Pt2Line14_Country',

  // (Lines 16–19) Employment #1
  'beneficiary.employment.0.employer'   : 'Pt2Line16_NameofEmployer',
  'beneficiary.employment.0.street'     : 'Pt2Line17_StreetNumberName',
  // 'beneficiary.employment.0.unitType' : 'Pt2Line17_Unit_p4_ch3', // skip
  'beneficiary.employment.0.unitNum'    : 'Pt2Line17_AptSteFlrNumber',
  'beneficiary.employment.0.city'       : 'Pt2Line17_CityOrTown',
  'beneficiary.employment.0.state'      : 'Pt2Line17_State',
  'beneficiary.employment.0.zip'        : 'Pt2Line17_ZipCode',
  'beneficiary.employment.0.province'   : 'Pt2Line17_Province',
  'beneficiary.employment.0.postal'     : 'Pt2Line17_PostalCode',
  'beneficiary.employment.0.country'    : 'Pt2Line17_Country',
  'beneficiary.employment.0.occupation' : 'Pt2Line18_Occupation',
  'beneficiary.employment.0.from'       : 'Pt2Line19a_DateFrom',
  'beneficiary.employment.0.to'         : 'Pt2Line19b_ToFrom',

  // (Lines 20–23) Employment #2
  'beneficiary.employment.1.employer'   : 'Pt2Line20_NameofEmployer',
  'beneficiary.employment.1.street'     : 'Pt2Line21_StreetNumberName',
  // 'beneficiary.employment.1.unitType' : 'Pt2Line21_Unit_p5_ch3', // skip
  'beneficiary.employment.1.unitNum'    : 'Pt2Line21_AptSteFlrNumber',
  'beneficiary.employment.1.city'       : 'Pt2Line21_CityOrTown',
  'beneficiary.employment.1.state'      : 'Pt2Line21_State',
  'beneficiary.employment.1.zip'        : 'Pt2Line21_ZipCode',
  'beneficiary.employment.1.province'   : 'Pt2Line21_Province',
  'beneficiary.employment.1.postal'     : 'Pt2Line21_PostalCode',
  'beneficiary.employment.1.country'    : 'Pt2Line21_Country',
  'beneficiary.employment.1.occupation' : 'Pt2Line22_Occupation',
  'beneficiary.employment.1.from'       : 'Pt2Line23a_DateFrom',
  'beneficiary.employment.1.to'         : 'Pt2Line23b_ToFrom',

  // (Lines 24–33-ish) Beneficiary’s parents (best-effort; confirm with your template)
  // Parent #1
  'beneficiary.parents.0.lastName'   : 'Pt2Line24a_FamilyName',
  'beneficiary.parents.0.firstName'  : 'Pt2Line24b_GivenName',
  'beneficiary.parents.0.middleName' : 'Pt2Line24c_MiddleName',
  // There’s a gap in the PDF numbering; using the later set for DOB etc. (30–33)
  'beneficiary.parents.0.dob'           : 'Pt2Line30_DateofBirth',
  'beneficiary.parents.0.citizenship'   : 'Pt2Line32_CountryOfCitzOrNationality',
  'beneficiary.parents.0.cityOfBirth'   : 'Pt2Line33a_CityTownOfBirth',
  'beneficiary.parents.0.countryOfBirth': 'Pt2Line33b_CountryOfCitzOrNationality',

  // Parent #2
  'beneficiary.parents.1.lastName'   : 'Pt2Line29a_FamilyName',
  'beneficiary.parents.1.firstName'  : 'Pt2Line29b_GivenName',
  'beneficiary.parents.1.middleName' : 'Pt2Line29c_MiddleName',
  'beneficiary.parents.1.dob'           : 'Pt2Line30_DateofBirth', // if your PDF duplicates, we’ll split on correction pass
  'beneficiary.parents.1.citizenship'   : 'Pt2Line32_CountryOfCitzOrNationality',
  'beneficiary.parents.1.cityOfBirth'   : 'Pt2Line33a_CityTownOfBirth',
  'beneficiary.parents.1.countryOfBirth': 'Pt2Line33b_CountryOfCitzOrNationality',
};

// Merge Part 2 mapping into main dict
Object.assign(I129F_MAPPING, PART2_MAP);

//////////////////////////////
// Apply mapping to the PDF
//////////////////////////////

export function applyI129fMapping(data, form) {
  if (!data || !form) return;
  for (const [jsonPath, pdfFieldName] of Object.entries(I129F_MAPPING)) {
    const val = getByPath(data, jsonPath);
    setText(form, pdfFieldName, val);
  }
}

//////////////////////////////
// Debug sections (for /all-fields page)
// Keep this reasonable; you can add/remove groups as you like.
//////////////////////////////

export const I129F_SECTIONS = [
  {
    key: 'p1_ids',
    label: 'Part 1 — IDs',
    fields: [
      'petitioner.aNumber',
      'petitioner.uscisOnlineAccount',
      'petitioner.ssn',
    ],
  },
  {
    key: 'p1_names',
    label: 'Part 1 — Names',
    fields: [
      'petitioner.lastName',
      'petitioner.firstName',
      'petitioner.middleName',
      'petitioner.otherNames.0.lastName',
      'petitioner.otherNames.0.firstName',
      'petitioner.otherNames.0.middleName',
    ],
  },
  {
    key: 'p1_mailing',
    label: 'Part 1 — Mailing Address',
    fields: [
      'mailing.inCareOf',
      'mailing.street',
      'mailing.unitNum',
      'mailing.city',
      'mailing.state',
      'mailing.zip',
      'mailing.province',
      'mailing.postal',
      'mailing.country',
    ],
  },
  {
    key: 'p1_physical',
    label: 'Part 1 — Physical Addresses',
    fields: [
      // #1
      'physicalAddresses.0.street',
      'physicalAddresses.0.unitNum',
      'physicalAddresses.0.city',
      'physicalAddresses.0.state',
      'physicalAddresses.0.zip',
      'physicalAddresses.0.province',
      'physicalAddresses.0.postal',
      'physicalAddresses.0.country',
      'physicalAddresses.0.from',
      'physicalAddresses.0.to',
      // #2
      'physicalAddresses.1.street',
      'physicalAddresses.1.unitNum',
      'physicalAddresses.1.city',
      'physicalAddresses.1.state',
      'physicalAddresses.1.zip',
      'physicalAddresses.1.province',
      'physicalAddresses.1.postal',
      'physicalAddresses.1.country',
      'physicalAddresses.1.from',
      'physicalAddresses.1.to',
    ],
  },
  {
    key: 'p1_jobs',
    label: 'Part 1 — Employment (last 5 years)',
    fields: [
      // #1
      'employment.0.employer',
      'employment.0.street',
      'employment.0.unitNum',
      'employment.0.city',
      'employment.0.state',
      'employment.0.zip',
      'employment.0.province',
      'employment.0.postal',
      'employment.0.country',
      'employment.0.occupation',
      'employment.0.from',
      'employment.0.to',
      // #2
      'employment.1.employer',
      'employment.1.street',
      'employment.1.unitNum',
      'employment.1.city',
      'employment.1.state',
      'employment.1.zip',
      'employment.1.province',
      'employment.1.postal',
      'employment.1.country',
      'employment.1.occupation',
      'employment.1.from',
      'employment.1.to',
    ],
  },
  {
    key: 'p1_birth_parents',
    label: 'Part 1 — Birth & Parents',
    fields: [
      'petitioner.dob',
      'petitioner.cityOfBirth',
      'petitioner.stateOfBirth',
      'petitioner.citizenshipCountry',
      // Parent 1
      'petitioner.parents.0.lastName',
      'petitioner.parents.0.firstName',
      'petitioner.parents.0.middleName',
      'petitioner.parents.0.dob',
      'petitioner.parents.0.citizenship',
      'petitioner.parents.0.cityOfBirth',
      'petitioner.parents.0.countryOfBirth',
      // Parent 2
      'petitioner.parents.1.lastName',
      'petitioner.parents.1.firstName',
      'petitioner.parents.1.middleName',
      'petitioner.parents.1.dob',
      'petitioner.parents.1.citizenship',
      'petitioner.parents.1.cityOfBirth',
      'petitioner.parents.1.countryOfBirth',
    ],
  },
  {
    key: 'p1_prior',
    label: 'Part 1 — Prior Spouse & Naturalization',
    fields: [
      'petitioner.priorSpouses.0.lastName',
      'petitioner.priorSpouses.0.firstName',
      'petitioner.priorSpouses.0.middleName',
      'petitioner.priorSpouses.0.dateMarriageEnded',
      'petitioner.natzNumber',
      'petitioner.natzPlace',
      'petitioner.natzDate',
    ],
  },
  {
    key: 'p2_names',
    label: 'Part 2 — Beneficiary Names & IDs',
    fields: [
      'beneficiary.lastName',
      'beneficiary.firstName',
      'beneficiary.middleName',
      'beneficiary.aNumber',
      'beneficiary.ssn',
      'beneficiary.dob',
      'beneficiary.cityOfBirth',
      'beneficiary.countryOfBirth',
      'beneficiary.citizenshipCountry',
      'beneficiary.otherNames.0.lastName',
      'beneficiary.otherNames.0.firstName',
      'beneficiary.otherNames.0.middleName',
    ],
  },
  {
    key: 'p2_addresses',
    label: 'Part 2 — Addresses',
    fields: [
      // Abroad
      'beneficiary.addressAbroad.inCareOf',
      'beneficiary.addressAbroad.street',
      'beneficiary.addressAbroad.unitNum',
      'beneficiary.addressAbroad.city',
      'beneficiary.addressAbroad.state',
      'beneficiary.addressAbroad.zip',
      'beneficiary.addressAbroad.province',
      'beneficiary.addressAbroad.postal',
      'beneficiary.addressAbroad.country',
      'beneficiary.addressAbroad.from',
      'beneficiary.addressAbroad.to',
      // US
      'beneficiary.usAddress.street',
      'beneficiary.usAddress.unitNum',
      'beneficiary.usAddress.city',
      'beneficiary.usAddress.state',
      'beneficiary.usAddress.zip',
      'beneficiary.usAddress.province',
      'beneficiary.usAddress.postal',
      'beneficiary.usAddress.country',
    ],
  },
  {
    key: 'p2_jobs',
    label: 'Part 2 — Employment (last 5 years)',
    fields: [
      // #1
      'beneficiary.employment.0.employer',
      'beneficiary.employment.0.street',
      'beneficiary.employment.0.unitNum',
      'beneficiary.employment.0.city',
      'beneficiary.employment.0.state',
      'beneficiary.employment.0.zip',
      'beneficiary.employment.0.province',
      'beneficiary.employment.0.postal',
      'beneficiary.employment.0.country',
      'beneficiary.employment.0.occupation',
      'beneficiary.employment.0.from',
      'beneficiary.employment.0.to',
      // #2
      'beneficiary.employment.1.employer',
      'beneficiary.employment.1.street',
      'beneficiary.employment.1.unitNum',
      'beneficiary.employment.1.city',
      'beneficiary.employment.1.state',
      'beneficiary.employment.1.zip',
      'beneficiary.employment.1.province',
      'beneficiary.employment.1.postal',
      'beneficiary.employment.1.country',
      'beneficiary.employment.1.occupation',
      'beneficiary.employment.1.from',
      'beneficiary.employment.1.to',
    ],
  },
  {
    key: 'p2_parents',
    label: 'Part 2 — Parents (best-effort; confirm)',
    fields: [
      // Parent 1
      'beneficiary.parents.0.lastName',
      'beneficiary.parents.0.firstName',
      'beneficiary.parents.0.middleName',
      'beneficiary.parents.0.dob',
      'beneficiary.parents.0.citizenship',
      'beneficiary.parents.0.cityOfBirth',
      'beneficiary.parents.0.countryOfBirth',
      // Parent 2
      'beneficiary.parents.1.lastName',
      'beneficiary.parents.1.firstName',
      'beneficiary.parents.1.middleName',
      'beneficiary.parents.1.dob',
      'beneficiary.parents.1.citizenship',
      'beneficiary.parents.1.cityOfBirth',
      'beneficiary.parents.1.countryOfBirth',
    ],
  },
];

//////////////////////////////
// Back-compat alias
//////////////////////////////
export const I129F_FIELDS = I129F_MAPPING;
