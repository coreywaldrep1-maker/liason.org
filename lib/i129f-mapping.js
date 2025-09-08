// lib/i129f-mapping.js

/** Utilities */
function get(obj, path) {
  if (!obj) return undefined;
  return path.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : undefined), obj);
}

function mmddyyyy(input) {
  if (!input) return '';
  // Accept "YYYY-MM-DD", "MM/DD/YYYY", Date, or free text and try to coerce
  if (input instanceof Date) {
    const mm = String(input.getMonth() + 1).padStart(2, '0');
    const dd = String(input.getDate()).padStart(2, '0');
    const yyyy = input.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }
  const s = String(input).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-');
    return `${m}/${d}/${y}`;
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) return s; // already mm/dd/yyyy
  return s; // fallback (don’t throw)
}

/** Set into AcroForm field by type */
function setFieldValue(field, value, hintType) {
  if (!field) return;
  const t = field.constructor?.name || '';
  try {
    if (t.includes('Text')) {
      field.setText(value == null ? '' : String(value));
    } else if (t.includes('CheckBox')) {
      const truthy = typeof value === 'boolean' ? value : !!value;
      truthy ? field.check() : field.uncheck();
    } else if (t.includes('Radio')) {
      if (value != null) field.select(String(value));
    } else {
      // unknown type → try text
      if (typeof field.setText === 'function') field.setText(value == null ? '' : String(value));
    }
  } catch {
    // swallow - we don't want a single bad field to fail the whole PDF
  }
}

/**
 * FIELD_MAP: left side = your saved JSON path (wizard data)
 * right side = either a string (PDF field name) OR an object { field, type }
 *  - type: 'text' | 'date' | 'checkbox' | 'radio'
 *
 * NOTE: This is a big starter set. You can expand it page-by-page using
 * /api/i129f/pdf-debug to see the remaining field names.
 */
export const FIELD_MAP = {
  // =========================
  // PART 1 — PETITIONER
  // =========================

  // Identifiers
  'petitioner.aNumber': 'Pt1Line1_AlienNumber',
  'petitioner.uscisOnlineAccount': 'Pt1Line2_AcctIdentifier',
  'petitioner.ssn': 'Pt1Line3_SSN',

  // Status (these CheckBoxes may be yes/no or grouped; adjust if needed)
  // If you store true/false:
  'petitioner.isUSCitizen': { field: 'Pt1Line4a_Checkboxes_p0_ch2', type: 'checkbox' },
  'petitioner.isLPR': { field: 'Pt1Line5_Checkboxes_p0_ch2', type: 'checkbox' },

  // Names (current legal)
  'petitioner.lastName': 'Pt1Line7a_FamilyName',
  'petitioner.firstName': 'Pt1Line7b_GivenName',
  'petitioner.middleName': 'Pt1Line7c_MiddleName',

  // Other names used (first alias slot)
  'petitioner.otherNames.0.last': 'Pt1Line6a_FamilyName',
  'petitioner.otherNames.0.first': 'Pt1Line6b_GivenName',
  'petitioner.otherNames.0.middle': 'Pt1Line6c_MiddleName',

  // Mailing address (Line 8)
  'mailing.careOf': 'Pt1Line8_InCareofName',
  'mailing.street': 'Pt1Line8_StreetNumberName',
  // Some templates model unit "type" as a free text (ok), others as radios. Start as text:
  'mailing.unitType': { field: 'Pt1Line8_Unit_p0_ch3', type: 'text' },
  'mailing.unitNum': 'Pt1Line8_AptSteFlrNumber',
  'mailing.city': 'Pt1Line8_CityOrTown',
  'mailing.state': 'Pt1Line8_State',
  'mailing.zip': 'Pt1Line8_ZipCode',
  'mailing.province': 'Pt1Line8_Province',
  'mailing.postalCode': 'Pt1Line8_PostalCode',
  'mailing.country': 'Pt1Line8_Country',

  // Physical address (Line 9)
  'petitioner.physical.street': 'Pt1Line9_StreetNumberName',
  'petitioner.physical.unitType': { field: 'Pt1Line9_Unit_p1_ch3', type: 'text' },
  'petitioner.physical.unitNum': 'Pt1Line9_AptSteFlrNumber',
  'petitioner.physical.city': 'Pt1Line9_CityOrTown',
  'petitioner.physical.state': 'Pt1Line9_State',
  'petitioner.physical.zip': 'Pt1Line9_ZipCode',
  'petitioner.physical.province': 'Pt1Line9_Province',
  'petitioner.physical.postalCode': 'Pt1Line9_PostalCode',
  'petitioner.physical.country': 'Pt1Line9_Country',

  // Previous address (Line 11)
  'petitioner.prevAddresses.0.street': 'Pt1Line11_StreetNumberName',
  'petitioner.prevAddresses.0.unitType': { field: 'Pt1Line11_Unit_p1_ch3', type: 'text' },
  'petitioner.prevAddresses.0.unitNum': 'Pt1Line11_AptSteFlrNumber',
  'petitioner.prevAddresses.0.city': 'Pt1Line11_CityOrTown',
  'petitioner.prevAddresses.0.state': 'Pt1Line11_State',
  'petitioner.prevAddresses.0.zip': 'Pt1Line11_ZipCode',
  'petitioner.prevAddresses.0.province': 'Pt1Line11_Province',
  'petitioner.prevAddresses.0.postalCode': 'Pt1Line11_PostalCode',
  'petitioner.prevAddresses.0.country': 'Pt1Line11_Country',
  'petitioner.prevAddresses.0.from': { field: 'Pt1Line12a_DateFrom', type: 'date' },
  'petitioner.prevAddresses.0.to': { field: 'Pt1Line12b_ToFrom', type: 'date' },

  // Employment (current) — Lines 13–16
  'petitioner.employment.current.name': 'Pt1Line13_NameofEmployer',
  'petitioner.employment.current.street': 'Pt1Line14_StreetNumberName',
  'petitioner.employment.current.unitType': { field: 'Pt1Line14_Unit_p1_ch3', type: 'text' },
  'petitioner.employment.current.unitNum': 'Pt1Line14_AptSteFlrNumber',
  'petitioner.employment.current.city': 'Pt1Line14_CityOrTown',
  'petitioner.employment.current.state': 'Pt1Line14_State',
  'petitioner.employment.current.zip': 'Pt1Line14_ZipCode',
  'petitioner.employment.current.province': 'Pt1Line14_Province',
  'petitioner.employment.current.postalCode': 'Pt1Line14_PostalCode',
  'petitioner.employment.current.country': 'Pt1Line14_Country',
  'petitioner.employment.current.occupation': 'Pt1Line15_Occupation',
  'petitioner.employment.current.from': { field: 'Pt1Line16a_DateFrom', type: 'date' },
  'petitioner.employment.current.to': { field: 'Pt1Line16b_ToFrom', type: 'date' },

  // Employment (previous) — Lines 17–20
  'petitioner.employment.previous.0.name': 'Pt1Line17_NameofEmployer',
  'petitioner.employment.previous.0.street': 'Pt1Line18_StreetNumberName',
  'petitioner.employment.previous.0.unitType': { field: 'Pt1Line18_Unit_p1_ch3', type: 'text' },
  'petitioner.employment.previous.0.unitNum': 'Pt1Line18_AptSteFlrNumber',
  'petitioner.employment.previous.0.city': 'Pt1Line18_CityOrTown',
  'petitioner.employment.previous.0.state': 'Pt1Line18_State',
  'petitioner.employment.previous.0.zip': 'Pt1Line18_ZipCode',
  'petitioner.employment.previous.0.province': 'Pt1Line18_Province',
  'petitioner.employment.previous.0.postalCode': 'Pt1Line18_PostalCode',
  'petitioner.employment.previous.0.country': 'Pt1Line18_Country',
  'petitioner.employment.previous.0.occupation': 'Pt1Line19_Occupation',
  'petitioner.employment.previous.0.from': { field: 'Pt1Line20a_DateFrom', type: 'date' },
  'petitioner.employment.previous.0.to': { field: 'Pt1Line20b_ToFrom', type: 'date' },

  // Birth & citizenship (Lines 22–26)
  'petitioner.birth.date': { field: 'Pt1Line22_DateofBirth', type: 'date' },
  'petitioner.birth.city': 'Pt1Line24_CityTownOfBirth',
  'petitioner.birth.stateProvince': 'Pt1Line25_ProvinceOrStateOfBirth',
  'petitioner.birth.country': 'Pt1Line26_CountryOfCitzOrNationality',

  // Parents (Lines 27–31)
  'petitioner.parent1.last': 'Pt1Line27a_FamilyName',
  'petitioner.parent1.first': 'Pt1Line27b_GivenName',
  'petitioner.parent1.middle': 'Pt1Line27c_MiddleName',
  'petitioner.parent1.dob': { field: 'Pt1Line28_DateofBirth', type: 'date' },
  'petitioner.parent1.alive': { field: 'Pt1Line29_Checkbox_p2_ch2', type: 'checkbox' },
  'petitioner.parent1.citizenship': 'Pt1Line30_CountryOfCitzOrNationality',
  'petitioner.parent1.birthCity': 'Pt1Line31_CityTownOfBirth',
  'petitioner.parent1.birthCountry': 'Pt1Line31_CountryOfCitzOrNationality',

  // Naturalization (Lines 42…)
  'petitioner.natz.number': 'Pt1Line42a_NaturalizationNumber',
  'petitioner.natz.place': 'Pt1Line42b_NaturalizationPlaceOfIssuance',
  'petitioner.natz.date': { field: 'Pt1Line42c_DateOfIssuance', type: 'date' },

  // =========================
  // PART 2 — BENEFICIARY
  // =========================

  // Names
  'beneficiary.lastName': 'Pt2Line1a_FamilyName',
  'beneficiary.firstName': 'Pt2Line1b_GivenName',
  'beneficiary.middleName': 'Pt2Line1c_MiddleName',

  // IDs
  'beneficiary.aNumber': 'Pt2Line2_AlienNumber',
  'beneficiary.ssn': 'Pt2Line3_SSN',
  'beneficiary.birth.date': { field: 'Pt2Line4_DateOfBirth', type: 'date' },

  // Gender / Marital status (if you track)
  // 'beneficiary.gender': { field: 'Pt2Line5_Checkboxes_p3_ch2', type: 'radio' },
  // 'beneficiary.maritalStatus': { field: 'Pt2Line6_Checkboxes_p3_ch4', type: 'radio' },

  // Place of birth & citizenship
  'beneficiary.birth.city': 'Pt2Line7_CityTownOfBirth',
  'beneficiary.birth.country': 'Pt2Line8_CountryOfBirth',
  'beneficiary.citizenship': 'Pt2Line9_CountryofCitzOrNationality',

  // Mail & physical addresses (Lines 11, 14)
  'beneficiary.mailing.careOf': 'Pt2Line11_InCareOfName',
  'beneficiary.mailing.street': 'Pt2Line11_StreetNumberName',
  'beneficiary.mailing.unitType': { field: 'Pt2Line11_Unit_p4_ch3', type: 'text' },
  'beneficiary.mailing.unitNum': 'Pt2Line11_AptSteFlrNumber',
  'beneficiary.mailing.city': 'Pt2Line11_CityOrTown',
  'beneficiary.mailing.state': 'Pt2Line11_State',
  'beneficiary.mailing.zip': 'Pt2Line11_ZipCode',
  'beneficiary.mailing.province': 'Pt2Line11_Province',
  'beneficiary.mailing.postalCode': 'Pt2Line11_PostalCode',
  'beneficiary.mailing.country': 'Pt2Line11_Country',

  'beneficiary.physical.street': 'Pt2Line14_StreetNumberName',
  'beneficiary.physical.unitType': { field: 'Pt2Line14_Unit_p4_ch3', type: 'text' },
  'beneficiary.physical.unitNum': 'Pt2Line14_AptSteFlrNumber',
  'beneficiary.physical.city': 'Pt2Line14_CityOrTown',
  'beneficiary.physical.state': 'Pt2Line14_State',
  'beneficiary.physical.zip': 'Pt2Line14_ZipCode',
  'beneficiary.physical.province': 'Pt2Line14_Province',
  'beneficiary.physical.postalCode': 'Pt2Line14_PostalCode',
  'beneficiary.physical.country': 'Pt2Line14_Country',

  // Employment (Lines 16–23)
  'beneficiary.employment.current.name': 'Pt2Line16_NameofEmployer',
  'beneficiary.employment.current.street': 'Pt2Line17_StreetNumberName',
  'beneficiary.employment.current.unitType': { field: 'Pt2Line17_Unit_p4_ch3', type: 'text' },
  'beneficiary.employment.current.unitNum': 'Pt2Line17_AptSteFlrNumber',
  'beneficiary.employment.current.city': 'Pt2Line17_CityOrTown',
  'beneficiary.employment.current.state': 'Pt2Line17_State',
  'beneficiary.employment.current.zip': 'Pt2Line17_ZipCode',
  'beneficiary.employment.current.province': 'Pt2Line17_Province',
  'beneficiary.employment.current.postalCode': 'Pt2Line17_PostalCode',
  'beneficiary.employment.current.country': 'Pt2Line17_Country',
  'beneficiary.employment.current.occupation': 'Pt2Line18_Occupation',
  'beneficiary.employment.current.from': { field: 'Pt2Line19a_DateFrom', type: 'date' },
  'beneficiary.employment.current.to': { field: 'Pt2Line19b_ToFrom', type: 'date' },

  // Parents (29–33)
  'beneficiary.parent1.last': 'Pt2Line29a_FamilyName',
  'beneficiary.parent1.first': 'Pt2Line29b_GivenName',
  'beneficiary.parent1.middle': 'Pt2Line29c_MiddleName',
  'beneficiary.parent1.dob': { field: 'Pt2Line30_DateofBirth', type: 'date' },
  'beneficiary.parent1.alive': { field: 'Pt2Line31_Checkbox_p5_ch2', type: 'checkbox' },
  'beneficiary.parent1.citizenship': 'Pt2Line32_CountryOfCitzOrNationality',
  'beneficiary.parent1.birthCity': 'Pt2Line33a_CityTownOfBirth',
  'beneficiary.parent1.birthCountry': 'Pt2Line33b_CountryOfCitzOrNationality',

  // Contact
  'beneficiary.phone': 'Pt2Line46_DayTimeTelephoneNumber',

  // Travel / Passport (38…)
  'beneficiary.arrival.class': 'Pt2Line38a_LastArrivedAs',
  'beneficiary.arrival.i94': 'Pt2Line38b_ArrivalDeparture',
  'beneficiary.arrival.date': { field: 'Pt2Line38c_DateofArrival', type: 'date' },
  'beneficiary.arrival.i94exp': { field: 'Pt2Line38d_DateExpired', type: 'date' },
  'beneficiary.passport.number': 'Pt2Line38e_Passport',
  'beneficiary.travelDoc.number': 'Pt2Line38f_TravelDoc',
  'beneficiary.passport.country': 'Pt2Line38g_CountryOfIssuance',
  'beneficiary.passport.expiration': { field: 'Pt2Line38h_ExpDate', type: 'date' },

  // Relationship (51–55 etc.) — example booleans/texts if you store them
  // 'relationship.isFiance': { field: 'Pt2Line51_Checkboxes_p7_ch3', type: 'checkbox' },
  // 'relationship.describe': 'Pt2Line54_Describe',

  // PETITIONER CONTACT / SIGNATURE (Part 5)
  'petitioner.phone': 'Pt5Line1_DaytimePhoneNumber1',
  'petitioner.mobile': 'Pt5Line2_MobileNumber1',
  'petitioner.email': 'Pt5Line3_Email',
  'petitioner.signatureDate': { field: 'Pt5Line4_DateOfSignature', type: 'date' },

  // INTERPRETER / PREPARER (Part 6/7) — if you collect them
  'interpreter.phone.country': 'Pt6Line4_InterpreterDaytimeTelephone_p9_n1',
  'interpreter.phone.number': 'Pt6Line4_InterpreterDaytimeTelephone_p9_n2',
  'interpreter.email': 'Pt6Line5_Email',
  'interpreter.language': 'Pt6_NameOfLanguage',
  'interpreter.signatureDate': { field: 'Pt6Line6_DateofSignature', type: 'date' },

  'preparer.last': 'Pt7Line1_PreparerFamilyName',
  'preparer.first': 'Pt7Line1b_PreparerGivenName',
  'preparer.org': 'Pt7Line2_NameofBusinessorOrgName',
  'preparer.phone': 'Pt7Line3_DaytimePhoneNumber1',
  'preparer.mobile': 'Pt7Line4_PreparerMobileNumber',
  'preparer.email': 'Pt7Line5_Email',
  'preparer.signatureDate': { field: 'Pt7Line6_DateofSignature', type: 'date' },
};

/** Apply the mapping */
export function applyI129fMapping(savedJson, pdfForm) {
  const fields = Object.fromEntries(pdfForm.getFields().map(f => [f.getName(), f]));

  for (const [srcPath, target] of Object.entries(FIELD_MAP)) {
    const valRaw = get(savedJson, srcPath);
    if (valRaw == null || valRaw === '') continue;

    if (typeof target === 'string') {
      const field = fields[target];
      if (!field) continue;
      setFieldValue(field, valRaw, 'text');
      continue;
    }

    const { field: pdfName, type } = target;
    const f = fields[pdfName];
    if (!f) continue;

    const value =
      type === 'date' ? mmddyyyy(valRaw) : valRaw;

    setFieldValue(f, value, type);
  }
}

/** Optional helper to see what's still unused. Call this in a debug route if helpful. */
export function listUnusedPdfFields(pdfForm) {
  const used = new Set(Object.values(FIELD_MAP).map(v => (typeof v === 'string' ? v : v.field)));
  return pdfForm.getFields().map(f => f.getName()).filter(n => !used.has(n));
}
