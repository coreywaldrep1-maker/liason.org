// lib/i129f-mapping.js
// Fill i-129f.pdf AcroForm fields from your saved JSON.
// - Safe: missing JSON paths are skipped
// - Dates auto formatted to MM/DD/YYYY
// - Tries text field first, then checkbox (boolean -> check)

function formatDate(v) {
  if (!v) return '';
  // accept "YYYY-MM-DD", Date, "MM/DD/YYYY", etc.
  try {
    if (typeof v === 'string') {
      // Already in mm/dd/yyyy?
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) return v;
      // ISO?
      const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (iso) return `${iso[2]}/${iso[3]}/${iso[1]}`;
    }
    const d = new Date(v);
    if (!isNaN(+d)) {
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yy = String(d.getFullYear());
      return `${mm}/${dd}/${yy}`;
    }
  } catch {}
  return String(v);
}

function getByPath(obj, path) {
  return path.split('.').reduce((acc, key) => {
    if (acc == null) return undefined;
    if (/^\d+$/.test(key)) return acc[Number(key)];
    return acc[key];
  }, obj);
}

function setText(form, name, value) {
  if (value == null || value === '') return;
  try {
    const f = form.getTextField(name);
    f.setText(String(value));
    return true;
  } catch { /* not a text field */ }
  return false;
}

function setCheckbox(form, name, value) {
  // value can be boolean or "Yes"/"No"
  const truthy = value === true || value === 'true' || value === 'Yes' || value === 'YES' || value === 'Y';
  try {
    const cb = form.getCheckBox(name);
    if (truthy) cb.check(); else cb.uncheck();
    return true;
  } catch { /* not a checkbox */ }
  return false;
}

// ---------------------
// Mapping table by pages (your ranges)
// ---------------------
//
// NOTE: If you don't yet collect some of these JSON paths, they're just ignored.
// When you add the inputs to the wizard, they'll start filling automatically.
//
// JSON shape examples used below:
// - petitioner.* (name, aNumber, ssn, dob, parents[], priorSpouses[], priorI129f[], residenceSince18[])
// - mailing.*, physicalAddresses[], employment[]
// - beneficiary.* (mirrors petitioner + travel/passport/contact/parents/etc.)

export function applyI129fMapping(data, form) {
  const M = {};

  // ========= Page 1: Pt1Line1  … Pt1Line8j =========
  Object.assign(M, {
    'petitioner.aNumber': 'Pt1Line1_AlienNumber',
    'petitioner.uscisOnlineAccountNumber': 'Pt1Line2_AcctIdentifier',
    'petitioner.ssn': 'Pt1Line3_SSN',

    // Petition class (checkboxes) — wire booleans if you collect them
    'petition.k1': 'Pt1Line4a_Checkboxes_p0_ch2',
    'petition.k3': 'Pt1Line5_Checkboxes_p0_ch2',

    // Petitioner legal name (Part 1, Line 6)
    'petitioner.lastName':  'Pt1Line6a_FamilyName',
    'petitioner.firstName': 'Pt1Line6b_GivenName',
    'petitioner.middleName':'Pt1Line6c_MiddleName',

    // Other names used #1 (Line 7)
    'petitioner.otherNames.0.lastName':   'Pt1Line7a_FamilyName',
    'petitioner.otherNames.0.firstName':  'Pt1Line7b_GivenName',
    'petitioner.otherNames.0.middleName': 'Pt1Line7c_MiddleName',

    // Mailing address (Line 8)
    'mailing.inCareOf': 'Pt1Line8_InCareofName',
    'mailing.street':   'Pt1Line8_StreetNumberName',
    'mailing.unitType': 'Pt1Line8_Unit_p0_ch3',     // Apt/Ste/Flr (PDF has a single field for type)
    'mailing.unitNum':  'Pt1Line8_AptSteFlrNumber',
    'mailing.city':     'Pt1Line8_CityOrTown',
    'mailing.state':    'Pt1Line8_State',
    'mailing.zip':      'Pt1Line8_ZipCode',
    'mailing.province': 'Pt1Line8_Province',
    'mailing.postal':   'Pt1Line8_PostalCode',
    'mailing.country':  'Pt1Line8_Country',
    'mailing.sameAsPhysical': 'Pt1Line8j_Checkboxes_p0_ch2', // checkbox yes/no
  });

  // ========= Page 2: Pt1Line9a … Pt1Line19 =========
  Object.assign(M, {
    // Physical address #1 (Line 9 + Line 10 dates)
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
    'physicalAddresses.0.to':       'Pt1Line10b_DateFrom',

    // Physical address #2 (Line 11 + Line 12 dates)
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

    // Employment #1 (Lines 13–16)
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

    // Employment #2 (Lines 17–19)
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
  });

  // ========= Page 3: Pt1Line20a … Pt1Line41 =========
  Object.assign(M, {
    // Employment #3 dates (Lines 20a/20b)
    'employment.2.from': 'Pt1Line20a_DateFrom',
    'employment.2.to':   'Pt1Line20b_ToFrom',

    // Sex (Line 21) — checkbox group
    'petitioner.sex.male':   'Pt1Line21_Checkbox_p2_ch2',
    'petitioner.sex.female': 'Pt1Line21_Checkbox_p2_ch2', // if the PDF uses separate boxes, we’ll split later

    // Date of Birth (Line 22)
    'petitioner.birth.date': 'Pt1Line22_DateofBirth',

    // Marital status (Line 23) — checkbox group
    'petitioner.maritalStatus.single':  'Pt1Line23_Checkbox_p2_ch4',
    // add others as you confirm the field names (married/divorced/widowed, etc.)

    // Birthplace & Citizenship (Lines 24–26)
    'petitioner.birth.city':     'Pt1Line24_CityTownOfBirth',
    'petitioner.birth.province': 'Pt1Line25_ProvinceOrStateOfBirth',
    'petitioner.birth.country':  'Pt1Line26_CountryOfCitzOrNationality',

    // Parents (Lines 27–36)
    'petitioner.parents.0.lastName':   'Pt1Line27a_FamilyName',
    'petitioner.parents.0.firstName':  'Pt1Line27b_GivenName',
    'petitioner.parents.0.middleName': 'Pt1Line27c_MiddleName',
    'petitioner.parents.0.dob':        'Pt1Line28_DateofBirth',
    'petitioner.parents.0.sex.male':   'Pt1Line29_Checkbox_p2_ch2', // example
    'petitioner.parents.0.country':    'Pt1Line30_CountryOfCitzOrNationality',
    'petitioner.parents.0.cityRes':    'Pt1Line31_CityTownOfBirth',
    'petitioner.parents.0.countryRes': 'Pt1Line31_CountryOfCitzOrNationality',

    'petitioner.parents.1.lastName':   'Pt1Line32a_FamilyName',
    'petitioner.parents.1.firstName':  'Pt1Line32b_GivenName',
    'petitioner.parents.1.middleName': 'Pt1Line32c_MiddleName',
    'petitioner.parents.1.dob':        'Pt1Line33_DateofBirth',
    'petitioner.parents.1.sex.male':   'Pt1Line34_Checkbox_p2_ch2',
    'petitioner.parents.1.country':    'Pt1Line35_CountryOfCitzOrNationality',
    'petitioner.parents.1.cityRes':    'Pt1Line36a_CityTownOfBirth',
    'petitioner.parents.1.countryRes': 'Pt1Line36b_CountryOfCitzOrNationality',

    // Prior marriages (Line 37 yes/no)
    'petitioner.previouslyMarried': 'Pt1Line37_Checkboxes_p2_ch2',

    // Prior spouse #1 (Lines 38–39)
    'petitioner.priorSpouses.0.lastName':   'Pt1Line38a_FamilyName',
    'petitioner.priorSpouses.0.firstName':  'Pt1Line38b_GivenName',
    'petitioner.priorSpouses.0.middleName': 'Pt1Line38c_MiddleName',
    'petitioner.priorSpouses.0.marriageEndedDate': 'Pt1Line39_DateMarriageEnded',

    // Proof of citizenship (Line 40 checkboxes)
    'petitioner.citizenship.birthUS': 'Pt1Line40_Checkbox_p2_ch3',
    // Line 41 (if present in your PDF) is rare for Part 1; you can add when you confirm field name.
  });

  // ========= Page 4: Pt1Line42a … Pt2Line10c =========
  Object.assign(M, {
    // Naturalization/Certificate (Lines 42a–42c)
    'petitioner.certificate.number': 'Pt1Line42a_NaturalizationNumber',
    'petitioner.certificate.place':  'Pt1Line42b_NaturalizationPlaceOfIssuance',
    'petitioner.certificate.date':   'Pt1Line42c_DateOfIssuance',

    // Filed I-129F for others (Line 43 yes/no + details 44–47)
    'petitioner.filedForOtherBeneficiary': 'Pt1Line43_Checkboxes_p3_ch2',
    'petitioner.priorI129f.0.aNumber':     'Pt1Line44_A_Number',
    'petitioner.priorI129f.0.lastName':    'Pt1Line45a_FamilyNameLastName',
    'petitioner.priorI129f.0.firstName':   'Pt1Line45b_GivenNameFirstName',
    'petitioner.priorI129f.0.middleName':  'Pt1Line45c_MiddleName',
    'petitioner.priorI129f.0.filedDate':   'Pt1Line46_DateOfFilling',
    'petitioner.priorI129f.0.uscisAction': 'Pt1Line47_Result',

    // Children under 18 (Line 48 yes/no)
    'beneficiary.hasChildrenUnder18': 'Pt1Line48_Checkboxes_p3_ch2',

    // Residence since 18 (Lines 50–51)
    'residenceSince18.0.state':   'Pt1Line50a_State',
    'residenceSince18.0.country': 'Pt1Line50b_CountryOfCitzOrNationality',
    'residenceSince18.1.state':   'Pt1Line51a_State',
    'residenceSince18.1.country': 'Pt1Line51b_CountryOfCitzOrNationality',

    // -------- Part 2 starts (Lines 1–10) --------
    'beneficiary.lastName':   'Pt2Line1a_FamilyName',
    'beneficiary.firstName':  'Pt2Line1b_GivenName',
    'beneficiary.middleName': 'Pt2Line1c_MiddleName',
    'beneficiary.aNumber':    'Pt2Line2_AlienNumber',
    'beneficiary.ssn':        'Pt2Line3_SSN',
    'beneficiary.birth.date': 'Pt2Line4_DateOfBirth',
    'beneficiary.sex.male':   'Pt2Line5_Checkboxes_p3_ch2',
    'beneficiary.maritalStatus.single': 'Pt2Line6_Checkboxes_p3_ch4',
    'beneficiary.birth.city': 'Pt2Line7_CityTownOfBirth',
    'beneficiary.birth.country': 'Pt2Line8_CountryOfBirth',
    'beneficiary.citizenship.country': 'Pt2Line9_CountryofCitzOrNationality',

    // Other names used #1 for Beneficiary (Line 10a–10c)
    'beneficiary.otherNames.0.lastName':   'Pt2Line10a_FamilyName',
    'beneficiary.otherNames.0.firstName':  'Pt2Line10b_GivenName',
    'beneficiary.otherNames.0.middleName': 'Pt2Line10c_MiddleName',
  });

  // ========= Page 5: Pt2Line11a … Pt2Line19b =========
  Object.assign(M, {
    // Beneficiary mailing (Line 11 + 14 alt)
    'beneficiary.mailing.inCareOf': 'Pt2Line11_InCareOfName',
    'beneficiary.mailing.street':   'Pt2Line11_StreetNumberName',
    'beneficiary.mailing.unitType': 'Pt2Line11_Unit_p4_ch3',
    'beneficiary.mailing.unitNum':  'Pt2Line11_AptSteFlrNumber',
    'beneficiary.mailing.city':     'Pt2Line11_CityOrTown',
    'beneficiary.mailing.state':    'Pt2Line11_State',
    'beneficiary.mailing.zip':      'Pt2Line11_ZipCode',
    'beneficiary.mailing.province': 'Pt2Line11_Province',
    'beneficiary.mailing.postal':   'Pt2Line11_PostalCode',
    'beneficiary.mailing.country':  'Pt2Line11_Country',

    'beneficiary.otherAddress.street':   'Pt2Line14_StreetNumberName',
    'beneficiary.otherAddress.unitType': 'Pt2Line14_Unit_p4_ch3',
    'beneficiary.otherAddress.unitNum':  'Pt2Line14_AptSteFlrNumber',
    'beneficiary.otherAddress.city':     'Pt2Line14_CityOrTown',
    'beneficiary.otherAddress.state':    'Pt2Line14_State',
    'beneficiary.otherAddress.zip':      'Pt2Line14_ZipCode',
    'beneficiary.otherAddress.province': 'Pt2Line14_Province',
    'beneficiary.otherAddress.postal':   'Pt2Line14_PostalCode',
    'beneficiary.otherAddress.country':  'Pt2Line14_Country',

    // Dates at this address (Line 15)
    'beneficiary.otherAddress.from': 'Pt2Line15a_DateFrom',
    'beneficiary.otherAddress.to':   'Pt2Line15b_ToFrom',

    // Employment #1 (Lines 16–19)
    'beneficiary.employment.0.employer':   'Pt2Line16_NameofEmployer',
    'beneficiary.employment.0.street':     'Pt2Line17_StreetNumberName',
    'beneficiary.employment.0.unitType':   'Pt2Line17_Unit_p4_ch3',
    'beneficiary.employment.0.unitNum':    'Pt2Line17_AptSteFlrNumber',
    'beneficiary.employment.0.city':       'Pt2Line17_CityOrTown',
    'beneficiary.employment.0.state':      'Pt2Line17_State',
    'beneficiary.employment.0.zip':        'Pt2Line17_ZipCode',
    'beneficiary.employment.0.province':   'Pt2Line17_Province',
    'beneficiary.employment.0.postal':     'Pt2Line17_PostalCode',
    'beneficiary.employment.0.country':    'Pt2Line17_Country',
    'beneficiary.employment.0.occupation': 'Pt2Line18_Occupation',
    'beneficiary.employment.0.from':       'Pt2Line19a_DateFrom',
    'beneficiary.employment.0.to':         'Pt2Line19b_ToFrom',
  });

  // ========= Page 6: Pt2Line20 … Pt2Line38c =========
  Object.assign(M, {
    // Employment #2 (Lines 20–23)
    'beneficiary.employment.1.employer':   'Pt2Line20_NameofEmployer',
    'beneficiary.employment.1.street':     'Pt2Line21_StreetNumberName',
    'beneficiary.employment.1.unitType':   'Pt2Line21_Unit_p5_ch3',
    'beneficiary.employment.1.unitNum':    'Pt2Line21_AptSteFlrNumber',
    'beneficiary.employment.1.city':       'Pt2Line21_CityOrTown',
    'beneficiary.employment.1.state':      'Pt2Line21_State',
    'beneficiary.employment.1.zip':        'Pt2Line21_ZipCode',
    'beneficiary.employment.1.province':   'Pt2Line21_Province',
    'beneficiary.employment.1.postal':     'Pt2Line21_PostalCode',
    'beneficiary.employment.1.country':    'Pt2Line21_Country',
    'beneficiary.employment.1.occupation': 'Pt2Line22_Occupation',
    'beneficiary.employment.1.from':       'Pt2Line23a_DateFrom',
    'beneficiary.employment.1.to':         'Pt2Line23b_ToFrom',

    // Parents (Lines 24, 26–33, 34…)
    'beneficiary.parents.0.lastName':   'Pt2Line24a_FamilyName',
    'beneficiary.parents.0.firstName':  'Pt2Line24b_GivenName',
    'beneficiary.parents.0.middleName': 'Pt2Line24c_MiddleName',
    'beneficiary.parents.0.alive':      'Pt2Line26_Checkbox_p5_ch2', // yes/no

    'beneficiary.parents.1.lastName':   'Pt2Line29a_FamilyName',
    'beneficiary.parents.1.firstName':  'Pt2Line29b_GivenName',
    'beneficiary.parents.1.middleName': 'Pt2Line29c_MiddleName',
    'beneficiary.parents.1.dob':        'Pt2Line30_DateofBirth',
    'beneficiary.parents.1.alive':      'Pt2Line31_Checkbox_p5_ch2',
    'beneficiary.parents.1.citizenshipCountry': 'Pt2Line32_CountryOfCitzOrNationality',
    'beneficiary.parents.1.cityBirth':  'Pt2Line33a_CityTownOfBirth',
    'beneficiary.parents.1.countryBirth': 'Pt2Line33b_CountryOfCitzOrNationality',
    'beneficiary.parents.1.maritalStatus': 'Pt2Line34_Checkboxes_p5_ch2',

    // Immigration history (Lines 35–38c)
    'beneficiary.immi.priorSpouse.lastName':   'Pt2Line35a_FamilyNameLastName',
    'beneficiary.immi.priorSpouse.firstName':  'Pt2Line35b_GivenNameFirstName',
    'beneficiary.immi.priorSpouse.middleName': 'Pt2Line35c_MiddleName',
    'beneficiary.immi.priorSpouse.marriageEndedDate': 'Pt2Line35a_DateMarriageEnded',

    // Last arrival (Lines 38a–38c)
    'beneficiary.entry.lastArrivedAs': 'Pt2Line38a_LastArrivedAs',
    'beneficiary.entry.I94':           'Pt2Line38b_ArrivalDeparture',
    'beneficiary.entry.arrivalDate':   'Pt2Line38c_DateofArrival',
  });

  // ========= Page 7: Pt2Line38d … Pt2Line50f =========
  Object.assign(M, {
    'beneficiary.entry.I94Expiry':     'Pt2Line38d_DateExpired',
    'beneficiary.passport.number':     'Pt2Line38e_Passport',
    'beneficiary.travelDoc.number':    'Pt2Line38f_TravelDoc',
    'beneficiary.passport.issuanceCountry': 'Pt2Line38g_CountryOfIssuance',
    'beneficiary.passport.expiry':     'Pt2Line38h_ExpDate',

    'beneficiary.us.present': 'Pt2Line39_Checkboxes_p6_ch2', // yes/no

    // Person who will receive the beneficiary (Lines 40–42)
    'usReceiver.lastName':   'Pt2Line40a_FamilyName',
    'usReceiver.firstName':  'Pt2Line40b_GivenName',
    'usReceiver.middleName': 'Pt2Line40c_MiddleName',
    'usReceiver.country':    'Pt2Line41_CountryOfBirth',
    'usReceiver.dob':        'Pt2Line42_DateofBirth',

    // Intent/relationship descriptions (Lines 43–47, 49–50, 51–55, 62a/b etc.)
    'intent.metWithin2Years': 'Pt2Line43_Checkboxes_p6_ch2',
    'intent.dayPhone':        'Pt2Line46_DayTimeTelephoneNumber',

    // Addresses on this page (45, 47, 50)
    'addr45.unitType': 'Pt2Line45b_Unit_p6_ch3',
    'addr47.unitType': 'Pt2Line47_Unit_p6_ch3',
    'addr50.unitType': 'Pt2Line50_Unit_p6_ch3',

    // Follow-on relationships (51–55)
    'relationship.typeK1': 'Pt2Line51_Checkboxes_p7_ch3',
    'relationship.describe': 'Pt2Line54_Describe',
    'relationship.typeK3': 'Pt2Line53_Checkboxes_p7_ch3',
    'relationship.metOnline': 'Pt2Line55_Checkboxes_p7_ch2',

    // Place met (62 a/b)
    'relationship.met.city':    'Pt2Line62a_CityTown',
    'relationship.met.country': 'Pt2Line62b_Country',
  });

  // ========= Page 8: Pt2Line51 … Pt3Line2a =========
  Object.assign(M, {
    // (Already captured a few above, but continue into Part 3 now)
    // Part 3 Yes/No series start (examples — wire as you add UI fields)
    'part3.q1': 'Pt3Line1_Checkboxes_p7_ch2',
    'part3.q2a': 'P3Line2a_Checkboxes_p7_ch2', // note spelling in PDF dump
    'part3.q2b': 'P3Line2b_Checkboxes_p8_ch2',
    'part3.q2c': 'P3Line2c_Checkboxes_p8_ch2',

    // Part 3/4 physical attributes (height/weight/race/hair etc.)
    'phys.height.ft':  'Pt4Line3_HeightFeet',
    'phys.height.in':  'Pt4Line3_HeightInches',
    'phys.weight.lbs': 'Pt4Line4_HeightInches',    // verify final target names in your /fields
    // Race checkboxes (examples)
    'phys.race.white':        'Pt4Line2_Checkbox_p8_White',
    'phys.race.asian':        'Pt4Line2_Checkbox_p8_Asian',
    'phys.race.black':        'Pt4Line2_Checkbox_p8_BlackOrAfricanAmerrican',
    'phys.race.native':       'Pt4Line2_Checkbox_p8_AmericanIndianOrAlaskaNative',
    'phys.race.pacific':      'Pt4Line2_Checkbox_p8_NativeHawaiianOrPacificIslander',
    // Hair / eye — names vary in different PDFs; use your /api/i129f/fields list to refine
    'phys.hair.otherText':    'Pt3Line4b_AdditionalInformation',
    'phys.hair.box':          'Part3Line4a_HairColorCheckboxes_p8_ch2',

    // Petitioner contact/sign (Part 5)
    'petitioner.contact.dayPhone': 'Pt5Line1_DaytimePhoneNumber1',
    'petitioner.contact.mobile':   'Pt5Line2_MobileNumber1',
    'petitioner.contact.email':    'Pt5Line3_Email',
    'petitioner.signDate':         'Pt5Line4_DateOfSignature',

    // Interpreter (Part 6)
    'interp.lastName': 'Pt6Line1_InterpreterFamilyName',
    'interp.firstName':'Pt6Line1_InterpreterGivenName',
    'interp.business': 'Pt6Line2_NameofBusinessorOrgName',
    'interp.phone1':   'Pt6Line4_InterpreterDaytimeTelephone_p9_n1',
    'interp.phone2':   'Pt6Line4_InterpreterDaytimeTelephone_p9_n2',
    'interp.email':    'Pt6Line5_Email',
    'interp.language': 'Pt6_NameOfLanguage',
    'interp.signDate': 'Pt6Line6_DateofSignature',

    // Preparer (Part 7)
    'prep.lastName':   'Pt7Line1_PreparerFamilyName',
    'prep.firstName':  'Pt7Line1b_PreparerGivenName',
    'prep.business':   'Pt7Line2_NameofBusinessorOrgName',
    'prep.phone':      'Pt7Line3_DaytimePhoneNumber1',
    'prep.mobile':     'Pt7Line4_PreparerMobileNumber',
    'prep.email':      'Pt7Line5_Email',
    'prep.signDate':   'Pt7Line6_DateofSignature',

    // Part 8 Additional Info (lines 3/4/5/6/7 groups)
    'addl.page5.Page':    'Line5a_PageNumber',
    'addl.page5.Part':    'Line5b_PartNumber',
    'addl.page5.Item':    'Line5c_ItemNumber',
    'addl.page5.Text':    'Line5d_AdditionalInfo',

    'addl.page3.Page':    'Line3a_PageNumber',
    'addl.page3.Part':    'Line3b_PartNumber',
    'addl.page3.Item':    'Line3c_ItemNumber',
    'addl.page3.Text':    'Line3d_AdditionalInfo',

    'addl.page6.Page':    'Line6a_PageNumber',
    'addl.page6.Part':    'Line6b_PartNumber',
    'addl.page6.Item':    'Line6c_ItemNumber',
    'addl.page6.Text':    'Line6d_AdditionalInfo',

    'addl.page4.Page':    'Line4a_PageNumber',
    'addl.page4.Part':    'Line4b_PartNumber',
    'addl.page4.Item':    'Line4c_ItemNumber',
    'addl.page4.Text':    'Line4d_AdditionalInfo',

    'addl.page7.Page':    'Line7a_PageNumber',
    'addl.page7.Part':    'Line7b_PartNumber',
    'addl.page7.Item':    'Line7c_ItemNumber',
    'addl.page7.Text':    'Line7d_AdditionalInfo',
  });

  // ---------- APPLY ----------
  for (const [path, field] of Object.entries(M)) {
    const val = getByPath(data, path);
    if (val == null || val === '') continue;

    // Dates
    if (/date|from|to|dob|exp/i.test(path) && typeof val !== 'boolean') {
      if (setText(form, field, formatDate(val))) continue;
    }

    // Try text, then checkbox
    if (setText(form, field, val)) continue;
    setCheckbox(form, field, val);
  }
}
