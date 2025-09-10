// lib/i129f-mapping.js
//
// Maps your saved JSON -> AcroForm field names in i-129f.pdf.
// Safe: unknown/missing paths are ignored.

export function applyI129fMapping(data, form) {
  const map = {
    // =============== PART 1. Petitioner =================
    // A-Numbers / IDs
    'petitioner.aNumber': 'Pt1Line1_AlienNumber',
    'petitioner.uscisOnlineAccountNumber': 'Pt1Line2_AcctIdentifier',
    'petitioner.ssn': 'Pt1Line3_SSN',

    // (K-1 / K-3 etc. are checkboxes; we’ll wire them later after we confirm the exact on-values)
    // Example (leave commented until we confirm):
    // 'petition.type.K1': 'Pt1Line4a_Checkboxes_p0_ch2',      // boolean -> checkbox
    // 'petition.type.K3': 'Pt1Line4b_Checkboxes_p0_ch2',
    // 'petition.k3FiledI130': 'Pt1Line5_Checkboxes_p0_ch2',

    // Petitioner legal name (your doc = Pt1Line6*)
    'petitioner.lastName':  'Pt1Line6a_FamilyName',
    'petitioner.firstName': 'Pt1Line6b_GivenName',
    'petitioner.middleName':'Pt1Line6c_MiddleName',

    // Other names used (first slot on the form = Pt1Line7*)
    'petitioner.otherNames.0.lastName':  'Pt1Line7a_FamilyName',
    'petitioner.otherNames.0.firstName': 'Pt1Line7b_GivenName',
    'petitioner.otherNames.0.middleName':'Pt1Line7c_MiddleName',

    // Mailing address (Pt1Line8*)
    'mailing.inCareOf': 'Pt1Line8_InCareofName',
    'mailing.street':   'Pt1Line8_StreetNumberName',
    'mailing.unitType': 'Pt1Line8_Unit_p0_ch3',        // Apt/Ste/Flr (PDF exposes one field for type)
    'mailing.unitNum':  'Pt1Line8_AptSteFlrNumber',
    'mailing.city':     'Pt1Line8_CityOrTown',
    'mailing.state':    'Pt1Line8_State',
    'mailing.zip':      'Pt1Line8_ZipCode',
    'mailing.province': 'Pt1Line8_Province',
    'mailing.postal':   'Pt1Line8_PostalCode',
    'mailing.country':  'Pt1Line8_Country',
    // same as physical? (checkbox; wire after we confirm)
    // 'mailing.sameAsPhysical': 'Pt1Line8j_Checkboxes_p0_ch2',

    // Physical Address #1 (Pt1Line9*) + dates (Pt1Line10a/b)
    'physicalAddresses.0.street':   'Pt1Line9_StreetNumberName',
    'physicalAddresses.0.unitType': 'Pt1Line9_Unit_p1_ch3',
    'physicalAddresses.0.unitNum':  'Pt1Line9_AptSteFlrNumber',
    'physicalAddresses.0.city':     'Pt1Line9_CityOrTown',
    'physicalAddresses.0.state':    'Pt1Line9_State',
    'physicalAddresses.0.zip':      'Pt1Line9_ZipCode',
    'physicalAddresses.0.province': 'Pt1Line9_Province',
    'physicalAddresses.0.postal':   'Pt1Line9_PostalCode',
    'physicalAddresses.0.country':  'Pt1Line9_Country',
    'physicalAddresses.0.from':     'Pt1Line10a_DateFrom',
    'physicalAddresses.0.to':       'Pt1Line10b_DateFrom', // PDF label is odd; it is the "to" date cell

    // Physical Address #2 (Pt1Line11*) + dates (Pt1Line12a/b)
    'physicalAddresses.1.street':   'Pt1Line11_StreetNumberName',
    'physicalAddresses.1.unitType': 'Pt1Line11_Unit_p1_ch3',
    'physicalAddresses.1.unitNum':  'Pt1Line11_AptSteFlrNumber',
    'physicalAddresses.1.city':     'Pt1Line11_CityOrTown',
    'physicalAddresses.1.state':    'Pt1Line11_State',
    'physicalAddresses.1.zip':      'Pt1Line11_ZipCode',
    'physicalAddresses.1.province': 'Pt1Line11_Province',
    'physicalAddresses.1.postal':   'Pt1Line11_PostalCode',
    'physicalAddresses.1.country':  'Pt1Line11_Country',
    'physicalAddresses.1.from':     'Pt1Line12a_DateFrom',
    'physicalAddresses.1.to':       'Pt1Line12b_ToFrom',

    // Employment #1 (Pt1Line13–16)
    'employment.0.employer':   'Pt1Line13_NameofEmployer',
    'employment.0.street':     'Pt1Line14_StreetNumberName',
    'employment.0.unitType':   'Pt1Line14_Unit_p1_ch3',
    'employment.0.unitNum':    'Pt1Line14_AptSteFlrNumber',
    'employment.0.city':       'Pt1Line14_CityOrTown',
    'employment.0.state':      'Pt1Line14_State',
    'employment.0.zip':        'Pt1Line14_ZipCode',
    'employment.0.province':   'Pt1Line14_Province',
    'employment.0.postal':     'Pt1Line14_PostalCode',
    'employment.0.country':    'Pt1Line14_Country',
    'employment.0.occupation': 'Pt1Line15_Occupation',
    'employment.0.from':       'Pt1Line16a_DateFrom',
    'employment.0.to':         'Pt1Line16b_ToFrom',

    // Employment #2 (Pt1Line17–20)
    'employment.1.employer':   'Pt1Line17_NameofEmployer',
    'employment.1.street':     'Pt1Line18_StreetNumberName',
    'employment.1.unitType':   'Pt1Line18_Unit_p1_ch3',
    'employment.1.unitNum':    'Pt1Line18_AptSteFlrNumber',
    'employment.1.city':       'Pt1Line18_CityOrTown',
    'employment.1.state':      'Pt1Line18_State',
    'employment.1.zip':        'Pt1Line18_ZipCode',
    'employment.1.province':   'Pt1Line18_Province',
    'employment.1.postal':     'Pt1Line18_PostalCode',
    'employment.1.country':    'Pt1Line18_Country',
    'employment.1.occupation': 'Pt1Line19_Occupation',
    'employment.1.from':       'Pt1Line20a_DateFrom',
    'employment.1.to':         'Pt1Line20b_ToFrom',

    // Demographics (start Part 1 page 2)
    // Sex (Pt1Line21_* is checkbox in the PDF) – wire later when we confirm field names/on-values
    // 'petitioner.sex.male': 'Pt1Line21_Checkbox_p2_ch2',
    // 'petitioner.sex.female': 'Pt1Line21_Checkbox_p2_ch2',

    'petitioner.birth.date':       'Pt1Line22_DateofBirth',
    // Marital status is a checkbox group (Pt1Line23_Checkbox_p2_ch4) – wire after confirm

    'petitioner.birth.city':       'Pt1Line24_CityTownOfBirth',
    'petitioner.birth.province':   'Pt1Line25_ProvinceOrStateOfBirth',
    'petitioner.birth.country':    'Pt1Line26_CountryOfCitzOrNationality',

    // Parent 1 (Lines 27–31)
    'petitioner.parents.0.lastName':   'Pt1Line27a_FamilyName',
    'petitioner.parents.0.firstName':  'Pt1Line27b_GivenName',
    'petitioner.parents.0.middleName': 'Pt1Line27c_MiddleName',
    'petitioner.parents.0.dob':        'Pt1Line28_DateofBirth',
    // 'petitioner.parents.0.sex.male': 'Pt1Line29_Checkbox_p2_ch2', // checkbox
    'petitioner.parents.0.countryBirth': 'Pt1Line30_CountryOfCitzOrNationality',
    'petitioner.parents.0.cityResidence': 'Pt1Line31_CityTownOfBirth',
    'petitioner.parents.0.countryResidence': 'Pt1Line31_CountryOfCitzOrNationality',

    // Parent 2 (Lines 32–36/37)
    'petitioner.parents.1.lastName':   'Pt1Line32a_FamilyName',
    'petitioner.parents.1.firstName':  'Pt1Line32b_GivenName',
    'petitioner.parents.1.middleName': 'Pt1Line32c_MiddleName',
    'petitioner.parents.1.dob':        'Pt1Line33_DateofBirth',
    // 'petitioner.parents.1.sex.male': 'Pt1Line34_Checkbox_p2_ch2',
    'petitioner.parents.1.countryBirth': 'Pt1Line35_CountryOfCitzOrNationality',
    'petitioner.parents.1.cityResidence': 'Pt1Line36a_CityTownOfBirth',
    'petitioner.parents.1.countryResidence': 'Pt1Line36b_CountryOfCitzOrNationality',
    // 'petitioner.previouslyMarried': 'Pt1Line37_Checkboxes_p2_ch2', // checkbox yes/no

    // Prior spouse (Lines 38–39) – first row on the form
    'petitioner.priorSpouses.0.lastName':   'Pt1Line38a_FamilyName',
    'petitioner.priorSpouses.0.firstName':  'Pt1Line38b_GivenName',
    'petitioner.priorSpouses.0.middleName': 'Pt1Line38c_MiddleName',
    'petitioner.priorSpouses.0.marriageEndedDate': 'Pt1Line39_DateMarriageEnded',

    // Citizenship proof (Lines 40–42) – checkboxes + text; text wired now
    // 'petitioner.citizenship.birthUS': 'Pt1Line40_Checkbox...', etc.
    'petitioner.certificate.number':  'Pt1Line42a_NaturalizationNumber',
    'petitioner.certificate.place':   'Pt1Line42b_NaturalizationPlaceOfIssuance',
    'petitioner.certificate.date':    'Pt1Line42c_DateOfIssuance',

    // Prior I-129F for others (Lines 43–47)
    // 'petitioner.filedForOtherBeneficiary': 'Pt1Line43_Checkboxes_p3_ch2',
    'petitioner.priorI129f.0.aNumber':  'Pt1Line44_A_Number',
    'petitioner.priorI129f.0.lastName': 'Pt1Line45a_FamilyNameLastName',
    'petitioner.priorI129f.0.firstName':'Pt1Line45b_GivenNameFirstName',
    'petitioner.priorI129f.0.middleName':'Pt1Line45c_MiddleName',
    'petitioner.priorI129f.0.filedDate':'Pt1Line46_DateOfFilling',
    'petitioner.priorI129f.0.uscisAction':'Pt1Line47_Result',

    // Children under 18 (Lines 48–49)
    // 'beneficiary.hasChildrenUnder18': 'Pt1Line48_Checkboxes_p3_ch2',
    'beneficiary.children.0.age': 'Pt1Line49a_FamilyName',
    'beneficiary.children.1.age': 'Pt1Line49b_GivenName',

    // Residence since 18 (Lines 50–51)
    'residenceSince18.0.state':   'Pt1Line50a_State',
    'residenceSince18.0.country': 'Pt1Line50b_CountryOfCitzOrNationality',
    'residenceSince18.1.state':   'Pt1Line51a_State',
    'residenceSince18.1.country': 'Pt1Line51b_CountryOfCitzOrNationality',

    // =============== PART 2… (start wiring as we add UI fields) ===============
    // (We’ll expand this section as you add Part 2+ inputs to the wizard)
  };

  // --- helpers ---
  const getByPath = (obj, path) => {
    return path.split('.').reduce((acc, key) => {
      if (acc == null) return undefined;
      if (/^\d+$/.test(key)) return acc[Number(key)];
      return acc[key];
    }, obj);
  };

  const fillText = (fieldName, value) => {
    if (value == null || value === '') return;
    try {
      const f = form.getTextField(fieldName);
      f.setText(String(value));
    } catch {
      // not a text field or not found; ignore
    }
  };

  // If you later wire checkboxes/radios, add a helper like fillCheckbox(...)
  // and call it for fields ending with `_Checkbox...`.

  // --- apply all text mappings ---
  for (const [jsonPath, pdfField] of Object.entries(map)) {
    const value = getByPath(data, jsonPath);
    // Basic rule: only push strings/numbers into text fields
    if (typeof value === 'string' || typeof value === 'number') {
      fillText(pdfField, value);
    }
  }
}
