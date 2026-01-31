// lib/i129f-mapping.js
// Map I-129F Wizard saved JSON -> pdf-lib AcroForm field names (your renamed template)

// -----------------------------
// Section metadata (used by /flow/us/i-129f/all-field')
// -----------------------------
export const I129F_SECTION_GROUPS = [
  { key: 'p1', label: 'Part 1 — Petitioner (You)' },
  { key: 'p2', label: 'Part 2 — Beneficiary (Partner)' },
  { key: 'p3', label: 'Part 3 — Other Info' },
  { key: 'p4', label: 'Part 4 — Petitioner’s Statement' },
  { key: 'p5', label: 'Part 5 — Contact Info' },
  { key: 'p6', label: 'Part 6 — Interpreter' },
  { key: 'p7', label: 'Part 7 — Preparer' },
  { key: 'p8', label: 'Part 8 — Additional Info' },
];

// -----------------------------
// Basic deep access helpers
// -----------------------------
export function deepGet(obj, path, fallback = '') {
  try {
    const parts = path.split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur == null) return fallback;
      cur = cur[p];
    }
    return cur ?? fallback;
  } catch {
    return fallback;
  }
}

function yesNoToBool(value) {
  const v = (value ?? '').toString().trim().toLowerCase();
  if (v === 'yes' || v === 'y' || v === 'true' || v === '1') return true;
  if (v === 'no' || v === 'n' || v === 'false' || v === '0') return false;
  return null; // unknown
}

// -----------------------------
// Checkbox helpers for pdf-lib
// -----------------------------
export function setCheckbox(form, fieldName, checked) {
  const f = form.getCheckBox(fieldName);
  if (!f) return;
  try {
    if (checked) f.check();
    else f.uncheck();
  } catch {
    // ignore
  }
}

// Safely set a text field (pdf-lib)
export function setText(form, fieldName, value) {
  const f = form.getTextField(fieldName);
  if (!f) return;
  try {
    f.setText((value ?? '').toString());
  } catch {
    // ignore
  }
}

// Safely set a dropdown (pdf-lib)
export function setDropdown(form, fieldName, value) {
  const f = form.getDropdown(fieldName);
  if (!f) return;
  try {
    f.select((value ?? '').toString());
  } catch {
    // ignore
  }
}

// -----------------------------
// Single-select Race (Page 9)
// -----------------------------
const RACE_CHECKBOX_FIELDS = {
  white: 'Beneficiary_Information_Biographic_Information_Race_White_Checkbox_page9_2',
  asian: 'Beneficiary_Information_Biographic_Information_Race_Asian_Checkbox_page9_2',
  black: 'Beneficiary_Information_Biographic_Information_Race_Black_AfricanAmerican_Checkbox_page9_2',
  nhopi: 'Beneficiary_Information_Biographic_Information_Race_NativeHawaiian_OtherPacificIslander_Checkbox_page9_2',
};

export function applyRaceToPdf(form, raceValue) {
  // Clear all first
  Object.values(RACE_CHECKBOX_FIELDS).forEach((fieldName) => setCheckbox(form, fieldName, false));

  const key = (raceValue ?? '').toString().trim().toLowerCase();
  const fieldName = RACE_CHECKBOX_FIELDS[key];
  if (fieldName) setCheckbox(form, fieldName, true);
}

// -----------------------------
// Single-select Ethnicity (Page 9)
// -----------------------------
const ETHNICITY_FIELDS = {
  hispanic: 'Beneficiary_Information_Biographic_Information_Ethnicity_Hispanic_Checkbox_page9_1',
  not_hispanic: 'Beneficiary_Information_Biographic_Information_Ethnicity_Not_Hispanic_Checkbox_page9_1',
};

export function applyEthnicityToPdf(form, ethnicityYesNo) {
  // Clear both first
  setCheckbox(form, ETHNICITY_FIELDS.hispanic, false);
  setCheckbox(form, ETHNICITY_FIELDS.not_hispanic, false);

  const yn = (ethnicityYesNo ?? '').toString().trim().toLowerCase();
  if (yn === 'yes') setCheckbox(form, ETHNICITY_FIELDS.hispanic, true);
  if (yn === 'no') setCheckbox(form, ETHNICITY_FIELDS.not_hispanic, true);
}

// -----------------------------
// Main mapping table
// (Path in saved JSON -> PDF field name + setter)
// -----------------------------
export const I129F_FIELD_MAP = [
  // -------------------------
  // Part 1 — Petitioner
  // -------------------------
  {
    section: 'p1',
    label: 'Petitioner Family Name',
    path: 'petitioner.name.family',
    pdf: 'Pt1Line7a_FamilyName',
    type: 'text',
  },
  {
    section: 'p1',
    label: 'Petitioner Given Name',
    path: 'petitioner.name.given',
    pdf: 'Pt1Line7b_GivenName',
    type: 'text',
  },
  {
    section: 'p1',
    label: 'Petitioner Middle Name',
    path: 'petitioner.name.middle',
    pdf: 'Pt1Line7c_MiddleName',
    type: 'text',
  },

  {
    section: 'p1',
    label: 'Petitioner Date of Birth',
    path: 'petitioner.citizenship.dateOfBirth',
    pdf: 'Pt1Line8_DateOfBirth',
    type: 'text',
  },

  {
    section: 'p1',
    label: 'Petitioner Gender',
    path: 'petitioner.citizenship.gender',
    pdf: 'Pt1Line9_Sex',
    type: 'text',
  },

  {
    section: 'p1',
    label: 'Petitioner Country of Birth',
    path: 'petitioner.citizenship.placeOfBirthCountry',
    pdf: 'Pt1Line10_CountryOfBirth',
    type: 'text',
  },
  {
    section: 'p1',
    label: 'Petitioner City of Birth',
    path: 'petitioner.citizenship.placeOfBirthCity',
    pdf: 'Pt1Line10_CityTownOfBirth',
    type: 'text',
  },
  {
    section: 'p1',
    label: 'Petitioner State of Birth',
    path: 'petitioner.citizenship.placeOfBirthState',
    pdf: 'Pt1Line10_StateOfBirth',
    type: 'text',
  },

  // Mailing address
  {
    section: 'p1',
    label: 'Mailing Address In Care Of',
    path: 'petitioner.mailingAddress.inCareOf',
    pdf: 'Pt1Line12a_InCareOfName',
    type: 'text',
  },
  {
    section: 'p1',
    label: 'Mailing Street',
    path: 'petitioner.mailingAddress.streetNumberName',
    pdf: 'Pt1Line12b_StreetNumberName',
    type: 'text',
  },
  {
    section: 'p1',
    label: 'Mailing Apt/Ste/Flr',
    path: 'petitioner.mailingAddress.aptSteFlr',
    pdf: 'Pt1Line12c_AptSteFlr',
    type: 'text',
  },
  {
    section: 'p1',
    label: 'Mailing City/Town',
    path: 'petitioner.mailingAddress.cityOrTown',
    pdf: 'Pt1Line12d_CityOrTown',
    type: 'text',
  },
  {
    section: 'p1',
    label: 'Mailing State',
    path: 'petitioner.mailingAddress.state',
    pdf: 'Pt1Line12e_State',
    type: 'text',
  },
  {
    section: 'p1',
    label: 'Mailing ZIP',
    path: 'petitioner.mailingAddress.zip',
    pdf: 'Pt1Line12f_ZipCode',
    type: 'text',
  },
  {
    section: 'p1',
    label: 'Mailing Province',
    path: 'petitioner.mailingAddress.province',
    pdf: 'Pt1Line12g_Province',
    type: 'text',
  },
  {
    section: 'p1',
    label: 'Mailing Postal Code',
    path: 'petitioner.mailingAddress.postalCode',
    pdf: 'Pt1Line12h_PostalCode',
    type: 'text',
  },
  {
    section: 'p1',
    label: 'Mailing Country',
    path: 'petitioner.mailingAddress.country',
    pdf: 'Pt1Line12i_Country',
    type: 'text',
  },

  // Contact
  {
    section: 'p1',
    label: 'Petitioner Daytime Phone',
    path: 'petitioner.contact.daytimePhone',
    pdf: 'Pt1Line13a_DaytimePhoneNumber',
    type: 'text',
  },
  {
    section: 'p1',
    label: 'Petitioner Mobile Phone',
    path: 'petitioner.contact.mobilePhone',
    pdf: 'Pt1Line13b_MobilePhoneNumber',
    type: 'text',
  },
  {
    section: 'p1',
    label: 'Petitioner Email',
    path: 'petitioner.contact.email',
    pdf: 'Pt1Line14_EmailAddress',
    type: 'text',
  },

  {
    section: 'p1',
    label: 'Petitioner SSN',
    path: 'petitioner.citizenship.ssn',
    pdf: 'Pt1Line11_SSN',
    type: 'text',
  },
  {
    section: 'p1',
    label: 'Petitioner Alien Number',
    path: 'petitioner.citizenship.alienNumber',
    pdf: 'Pt1Line1_AlienNumber',
    type: 'text',
  },
  {
    section: 'p1',
    label: 'Naturalization Certificate Number',
    path: 'petitioner.citizenship.naturalizationCertificateNumber',
    pdf: 'Pt1Line4_NaturalizationCertificateNumber',
    type: 'text',
  },

  // -------------------------
  // Part 2 — Beneficiary
  // -------------------------
  {
    section: 'p2',
    label: 'Beneficiary Family Name',
    path: 'beneficiary.name.family',
    pdf: 'Pt2Line1a_FamilyName',
    type: 'text',
  },
  {
    section: 'p2',
    label: 'Beneficiary Given Name',
    path: 'beneficiary.name.given',
    pdf: 'Pt2Line1b_GivenName',
    type: 'text',
  },
  {
    section: 'p2',
    label: 'Beneficiary Middle Name',
    path: 'beneficiary.name.middle',
    pdf: 'Pt2Line1c_MiddleName',
    type: 'text',
  },
  {
    section: 'p2',
    label: 'Beneficiary Alien Number',
    path: 'beneficiary.info.alienNumber',
    pdf: 'Pt2Line2_AlienNumber',
    type: 'text',
  },
  {
    section: 'p2',
    label: 'Beneficiary SSN',
    path: 'beneficiary.info.ssn',
    pdf: 'Pt2Line3_SSN',
    type: 'text',
  },
  {
    section: 'p2',
    label: 'Beneficiary Date of Birth',
    path: 'beneficiary.info.dateOfBirth',
    pdf: 'Pt2Line4_DateOfBirth',
    type: 'text',
  },
  {
    section: 'p2',
    label: 'Beneficiary Gender',
    path: 'beneficiary.info.gender',
    pdf: 'Pt2Line5_Sex',
    type: 'text',
  },
  {
    section: 'p2',
    label: 'Beneficiary Marital Status',
    path: 'beneficiary.info.maritalStatus',
    pdf: 'Pt2Line6_MaritalStatus',
    type: 'text',
  },
  {
    section: 'p2',
    label: 'Beneficiary Country of Citizenship',
    path: 'beneficiary.info.citizenshipCountry',
    pdf: 'Pt2Line7_CountryOfCitizenship',
    type: 'text',
  },
  {
    section: 'p2',
    label: 'Beneficiary City of Birth',
    path: 'beneficiary.info.placeOfBirthCity',
    pdf: 'Pt2Line8a_CityTownOfBirth',
    type: 'text',
  },
  {
    section: 'p2',
    label: 'Beneficiary State/Province of Birth',
    path: 'beneficiary.info.placeOfBirthStateProvince',
    pdf: 'Pt2Line8b_StateOrProvinceOfBirth',
    type: 'text',
  },
  {
    section: 'p2',
    label: 'Beneficiary Country of Birth',
    path: 'beneficiary.info.placeOfBirthCountry',
    pdf: 'Pt2Line8c_CountryOfBirth',
    type: 'text',
  },

  // Mailing address
  {
    section: 'p2',
    label: 'Beneficiary Mailing Street',
    path: 'beneficiary.mailingAddress.streetNumberName',
    pdf: 'Pt2Line9a_StreetNumberName',
    type: 'text',
  },
  {
    section: 'p2',
    label: 'Beneficiary Mailing Apt/Ste/Flr',
    path: 'beneficiary.mailingAddress.aptSteFlr',
    pdf: 'Pt2Line9b_AptSteFlr',
    type: 'text',
  },
  {
    section: 'p2',
    label: 'Beneficiary Mailing City/Town',
    path: 'beneficiary.mailingAddress.cityOrTown',
    pdf: 'Pt2Line9c_CityOrTown',
    type: 'text',
  },
  {
    section: 'p2',
    label: 'Beneficiary Mailing State/Province',
    path: 'beneficiary.mailingAddress.stateProvince',
    pdf: 'Pt2Line9d_StateProvince',
    type: 'text',
  },
  {
    section: 'p2',
    label: 'Beneficiary Mailing Postal Code',
    path: 'beneficiary.mailingAddress.postalCode',
    pdf: 'Pt2Line9e_PostalCode',
    type: 'text',
  },
  {
    section: 'p2',
    label: 'Beneficiary Mailing Country',
    path: 'beneficiary.mailingAddress.country',
    pdf: 'Pt2Line9f_Country',
    type: 'text',
  },

  // Parents
  {
    section: 'p2',
    label: 'Father Family Name',
    path: 'beneficiary.parents.father.family',
    pdf: 'Pt2Line12a_FathersFamilyName',
    type: 'text',
  },
  {
    section: 'p2',
    label: 'Father Given Name',
    path: 'beneficiary.parents.father.given',
    pdf: 'Pt2Line12b_FathersGivenName',
    type: 'text',
  },
  {
    section: 'p2',
    label: 'Father Middle Name',
    path: 'beneficiary.parents.father.middle',
    pdf: 'Pt2Line12c_FathersMiddleName',
    type: 'text',
  },
  {
    section: 'p2',
    label: 'Mother Family Name',
    path: 'beneficiary.parents.mother.family',
    pdf: 'Pt2Line13a_MothersFamilyName',
    type: 'text',
  },
  {
    section: 'p2',
    label: 'Mother Given Name',
    path: 'beneficiary.parents.mother.given',
    pdf: 'Pt2Line13b_MothersGivenName',
    type: 'text',
  },
  {
    section: 'p2',
    label: 'Mother Middle Name',
    path: 'beneficiary.parents.mother.middle',
    pdf: 'Pt2Line13c_MothersMiddleName',
    type: 'text',
  },

  // -------------------------
  // Page 9 Biographic: Ethnicity/Race (handled specially)
  // -------------------------
  {
    section: 'p2',
    label: 'Beneficiary Ethnicity (Yes/No)',
    path: 'beneficiary.info.ethnicityHispanic',
    pdf: '(special) ethnicity checkboxes',
    type: 'special_ethnicity',
  },
  {
    section: 'p2',
    label: 'Beneficiary Race (single select)',
    path: 'beneficiary.info.race',
    pdf: '(special) race checkboxes',
    type: 'special_race',
  },

  // -------------------------
  // Height / Weight / Hair / Eyes
  // -------------------------
  {
    section: 'p2',
    label: 'Height (Feet)',
    path: 'beneficiary.info.heightFeet',
    pdf: 'Beneficiary_Information_Biographic_Information_Height_Feet_page9_3',
    type: 'text',
  },
  {
    section: 'p2',
    label: 'Height (Inches)',
    path: 'beneficiary.info.heightInches',
    pdf: 'Beneficiary_Information_Biographic_Information_Height_Inches_page9_3',
    type: 'text',
  },
  {
    section: 'p2',
    label: 'Weight (lbs)',
    path: 'beneficiary.info.weightLbs',
    pdf: 'Beneficiary_Information_Biographic_Information_Weight_page9_4',
    type: 'text',
  },
  {
    section: 'p2',
    label: 'Eye Color',
    path: 'beneficiary.info.eyeColor',
    pdf: 'Beneficiary_Information_Biographic_Information_Eye_Color_page9_5',
    type: 'text',
  },
  {
    section: 'p2',
    label: 'Hair Color',
    path: 'beneficiary.info.hairColor',
    pdf: 'Beneficiary_Information_Biographic_Information_Hair_Color_page9_6',
    type: 'text',
  },
];

// -----------------------------
// Apply mapping to a pdf-lib form
// -----------------------------
export function applyI129fMappingToPdf({ form, savedData }) {
  for (const m of I129F_FIELD_MAP) {
    const value = deepGet(savedData, m.path, '');

    // Special handlers
    if (m.type === 'special_race') {
      applyRaceToPdf(form, value);
      continue;
    }
    if (m.type === 'special_ethnicity') {
      applyEthnicityToPdf(form, value);
      continue;
    }

    // Default: text
    setText(form, m.pdf, value);
  }
}
