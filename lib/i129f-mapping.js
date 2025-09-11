// lib/i129f-mapping.js
// Reusable mapping + filler for i-129f.pdf

function formatDate(v) {
  if (!v) return '';
  try {
    if (typeof v === 'string') {
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) return v; // already mm/dd/yyyy
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
  if (value == null || value === '') return false;
  try {
    form.getTextField(name).setText(String(value));
    return true;
  } catch {}
  return false;
}

function setCheckbox(form, name, value) {
  const truthy =
    value === true || value === 'true' || value === 'Yes' || value === 'YES' || value === 'Y' || value === 1;
  try {
    const cb = form.getCheckBox(name);
    truthy ? cb.check() : cb.uncheck();
    return true;
  } catch {}
  return false;
}

/** ************************************************************
 * Mapping table (JSON path -> PDF field name), ordered by pages
 * *************************************************************/

// ===== Page 1: Pt1Line1 … Pt1Line8j
const PAGE1 = {
  'petitioner.aNumber': 'Pt1Line1_AlienNumber',
  'petitioner.uscisOnlineAccountNumber': 'Pt1Line2_AcctIdentifier',
  'petitioner.ssn': 'Pt1Line3_SSN',
  'petition.k1': 'Pt1Line4a_Checkboxes_p0_ch2',
  'petition.k3': 'Pt1Line5_Checkboxes_p0_ch2',
  'petitioner.lastName': 'Pt1Line6a_FamilyName',
  'petitioner.firstName': 'Pt1Line6b_GivenName',
  'petitioner.middleName': 'Pt1Line6c_MiddleName',
  'petitioner.otherNames.0.lastName': 'Pt1Line7a_FamilyName',
  'petitioner.otherNames.0.firstName': 'Pt1Line7b_GivenName',
  'petitioner.otherNames.0.middleName': 'Pt1Line7c_MiddleName',
  'mailing.inCareOf': 'Pt1Line8_InCareofName',
  'mailing.street': 'Pt1Line8_StreetNumberName',
  'mailing.unitType': 'Pt1Line8_Unit_p0_ch3',
  'mailing.unitNum': 'Pt1Line8_AptSteFlrNumber',
  'mailing.city': 'Pt1Line8_CityOrTown',
  'mailing.state': 'Pt1Line8_State',
  'mailing.zip': 'Pt1Line8_ZipCode',
  'mailing.province': 'Pt1Line8_Province',
  'mailing.postal': 'Pt1Line8_PostalCode',
  'mailing.country': 'Pt1Line8_Country',
  'mailing.sameAsPhysical': 'Pt1Line8j_Checkboxes_p0_ch2',
};

// ===== Page 2: Pt1Line9a … Pt1Line19
const PAGE2 = {
  'physicalAddresses.0.street': 'Pt1Line9_StreetNumberName',
  'physicalAddresses.0.unitType': 'Pt1Line9_Unit_p1_ch3',
  'physicalAddresses.0.unitNum': 'Pt1Line9_AptSteFlrNumber',
  'physicalAddresses.0.city': 'Pt1Line9_CityOrTown',
  'physicalAddresses.0.state': 'Pt1Line9_State',
  'physicalAddresses.0.zip': 'Pt1Line9_ZipCode',
  'physicalAddresses.0.province': 'Pt1Line9_Province',
  'physicalAddresses.0.postal': 'Pt1Line9_PostalCode',
  'physicalAddresses.0.country': 'Pt1Line9_Country',
  'physicalAddresses.0.from': 'Pt1Line10a_DateFrom',
  'physicalAddresses.0.to': 'Pt1Line10b_DateFrom',

  'physicalAddresses.1.street': 'Pt1Line11_StreetNumberName',
  'physicalAddresses.1.unitType': 'Pt1Line11_Unit_p1_ch3',
  'physicalAddresses.1.unitNum': 'Pt1Line11_AptSteFlrNumber',
  'physicalAddresses.1.city': 'Pt1Line11_CityOrTown',
  'physicalAddresses.1.state': 'Pt1Line11_State',
  'physicalAddresses.1.zip': 'Pt1Line11_ZipCode',
  'physicalAddresses.1.province': 'Pt1Line11_Province',
  'physicalAddresses.1.postal': 'Pt1Line11_PostalCode',
  'physicalAddresses.1.country': 'Pt1Line11_Country',
  'physicalAddresses.1.from': 'Pt1Line12a_DateFrom',
  'physicalAddresses.1.to': 'Pt1Line12b_ToFrom',

  'employment.0.employer': 'Pt1Line13_NameofEmployer',
  'employment.0.street': 'Pt1Line14_StreetNumberName',
  'employment.0.unitType': 'Pt1Line14_Unit_p1_ch3',
  'employment.0.unitNum': 'Pt1Line14_AptSteFlrNumber',
  'employment.0.city': 'Pt1Line14_CityOrTown',
  'employment.0.state': 'Pt1Line14_State',
  'employment.0.zip': 'Pt1Line14_ZipCode',
  'employment.0.province': 'Pt1Line14_Province',
  'employment.0.postal': 'Pt1Line14_PostalCode',
  'employment.0.country': 'Pt1Line14_Country',
  'employment.0.occupation': 'Pt1Line15_Occupation',
  'employment.0.from': 'Pt1Line16a_DateFrom',
  'employment.0.to': 'Pt1Line16b_ToFrom',

  'employment.1.employer': 'Pt1Line17_NameofEmployer',
  'employment.1.street': 'Pt1Line18_StreetNumberName',
  'employment.1.unitType': 'Pt1Line18_Unit_p1_ch3',
  'employment.1.unitNum': 'Pt1Line18_AptSteFlrNumber',
  'employment.1.city': 'Pt1Line18_CityOrTown',
  'employment.1.state': 'Pt1Line18_State',
  'employment.1.zip': 'Pt1Line18_ZipCode',
  'employment.1.province': 'Pt1Line18_Province',
  'employment.1.postal': 'Pt1Line18_PostalCode',
  'employment.1.country': 'Pt1Line18_Country',
  'employment.1.occupation': 'Pt1Line19_Occupation',
};

// ===== Page 3: Pt1Line20a … Pt1Line41
const PAGE3 = {
  'employment.2.from': 'Pt1Line20a_DateFrom',
  'employment.2.to': 'Pt1Line20b_ToFrom',
  'petitioner.sex.male': 'Pt1Line21_Checkbox_p2_ch2',
  'petitioner.birth.date': 'Pt1Line22_DateofBirth',
  'petitioner.maritalStatus.single': 'Pt1Line23_Checkbox_p2_ch4',
  'petitioner.birth.city': 'Pt1Line24_CityTownOfBirth',
  'petitioner.birth.province': 'Pt1Line25_ProvinceOrStateOfBirth',
  'petitioner.birth.country': 'Pt1Line26_CountryOfCitzOrNationality',

  'petitioner.parents.0.lastName': 'Pt1Line27a_FamilyName',
  'petitioner.parents.0.firstName': 'Pt1Line27b_GivenName',
  'petitioner.parents.0.middleName': 'Pt1Line27c_MiddleName',
  'petitioner.parents.0.dob': 'Pt1Line28_DateofBirth',
  'petitioner.parents.0.sex.male': 'Pt1Line29_Checkbox_p2_ch2',
  'petitioner.parents.0.country': 'Pt1Line30_CountryOfCitzOrNationality',
  'petitioner.parents.0.cityRes': 'Pt1Line31_CityTownOfBirth',
  'petitioner.parents.0.countryRes': 'Pt1Line31_CountryOfCitzOrNationality',

  'petitioner.parents.1.lastName': 'Pt1Line32a_FamilyName',
  'petitioner.parents.1.firstName': 'Pt1Line32b_GivenName',
  'petitioner.parents.1.middleName': 'Pt1Line32c_MiddleName',
  'petitioner.parents.1.dob': 'Pt1Line33_DateofBirth',
  'petitioner.parents.1.sex.male': 'Pt1Line34_Checkbox_p2_ch2',
  'petitioner.parents.1.country': 'Pt1Line35_CountryOfCitzOrNationality',
  'petitioner.parents.1.cityRes': 'Pt1Line36a_CityTownOfBirth',
  'petitioner.parents.1.countryRes': 'Pt1Line36b_CountryOfCitzOrNationality',

  'petitioner.previouslyMarried': 'Pt1Line37_Checkboxes_p2_ch2',
  'petitioner.priorSpouses.0.lastName': 'Pt1Line38a_FamilyName',
  'petitioner.priorSpouses.0.firstName': 'Pt1Line38b_GivenName',
  'petitioner.priorSpouses.0.middleName': 'Pt1Line38c_MiddleName',
  'petitioner.priorSpouses.0.marriageEndedDate': 'Pt1Line39_DateMarriageEnded',
  'petitioner.citizenship.birthUS': 'Pt1Line40_Checkbox_p2_ch3',
};

// ===== Page 4: Pt1Line42a … Pt2Line10c
const PAGE4 = {
  'petitioner.certificate.number': 'Pt1Line42a_NaturalizationNumber',
  'petitioner.certificate.place': 'Pt1Line42b_NaturalizationPlaceOfIssuance',
  'petitioner.certificate.date': 'Pt1Line42c_DateOfIssuance',
  'petitioner.filedForOtherBeneficiary': 'Pt1Line43_Checkboxes_p3_ch2',
  'petitioner.priorI129f.0.aNumber': 'Pt1Line44_A_Number',
  'petitioner.priorI129f.0.lastName': 'Pt1Line45a_FamilyNameLastName',
  'petitioner.priorI129f.0.firstName': 'Pt1Line45b_GivenNameFirstName',
  'petitioner.priorI129f.0.middleName': 'Pt1Line45c_MiddleName',
  'petitioner.priorI129f.0.filedDate': 'Pt1Line46_DateOfFilling',
  'petitioner.priorI129f.0.uscisAction': 'Pt1Line47_Result',
  'beneficiary.hasChildrenUnder18': 'Pt1Line48_Checkboxes_p3_ch2',
  'residenceSince18.0.state': 'Pt1Line50a_State',
  'residenceSince18.0.country': 'Pt1Line50b_CountryOfCitzOrNationality',
  'residenceSince18.1.state': 'Pt1Line51a_State',
  'residenceSince18.1.country': 'Pt1Line51b_CountryOfCitzOrNationality',

  // Part 2 begins
  'beneficiary.lastName': 'Pt2Line1a_FamilyName',
  'beneficiary.firstName': 'Pt2Line1b_GivenName',
  'beneficiary.middleName': 'Pt2Line1c_MiddleName',
  'beneficiary.aNumber': 'Pt2Line2_AlienNumber',
  'beneficiary.ssn': 'Pt2Line3_SSN',
  'beneficiary.birth.date': 'Pt2Line4_DateOfBirth',
  'beneficiary.sex.male': 'Pt2Line5_Checkboxes_p3_ch2',
  'beneficiary.maritalStatus.single': 'Pt2Line6_Checkboxes_p3_ch4',
  'beneficiary.birth.city': 'Pt2Line7_CityTownOfBirth',
  'beneficiary.birth.country': 'Pt2Line8_CountryOfBirth',
  'beneficiary.citizenship.country': 'Pt2Line9_CountryofCitzOrNationality',
  'beneficiary.otherNames.0.lastName': 'Pt2Line10a_FamilyName',
  'beneficiary.otherNames.0.firstName': 'Pt2Line10b_GivenName',
  'beneficiary.otherNames.0.middleName': 'Pt2Line10c_MiddleName',
};

// ===== Page 5: Pt2Line11a … Pt2Line19b
const PAGE5 = {
  'beneficiary.mailing.inCareOf': 'Pt2Line11_InCareOfName',
  'beneficiary.mailing.street': 'Pt2Line11_StreetNumberName',
  'beneficiary.mailing.unitType': 'Pt2Line11_Unit_p4_ch3',
  'beneficiary.mailing.unitNum': 'Pt2Line11_AptSteFlrNumber',
  'beneficiary.mailing.city': 'Pt2Line11_CityOrTown',
  'beneficiary.mailing.state': 'Pt2Line11_State',
  'beneficiary.mailing.zip': 'Pt2Line11_ZipCode',
  'beneficiary.mailing.province': 'Pt2Line11_Province',
  'beneficiary.mailing.postal': 'Pt2Line11_PostalCode',
  'beneficiary.mailing.country': 'Pt2Line11_Country',

  'beneficiary.otherAddress.street': 'Pt2Line14_StreetNumberName',
  'beneficiary.otherAddress.unitType': 'Pt2Line14_Unit_p4_ch3',
  'beneficiary.otherAddress.unitNum': 'Pt2Line14_AptSteFlrNumber',
  'beneficiary.otherAddress.city': 'Pt2Line14_CityOrTown',
  'beneficiary.otherAddress.state': 'Pt2Line14_State',
  'beneficiary.otherAddress.zip': 'Pt2Line14_ZipCode',
  'beneficiary.otherAddress.province': 'Pt2Line14_Province',
  'beneficiary.otherAddress.postal': 'Pt2Line14_PostalCode',
  'beneficiary.otherAddress.country': 'Pt2Line14_Country',
  'beneficiary.otherAddress.from': 'Pt2Line15a_DateFrom',
  'beneficiary.otherAddress.to': 'Pt2Line15b_ToFrom',

  'beneficiary.employment.0.employer': 'Pt2Line16_NameofEmployer',
  'beneficiary.employment.0.street': 'Pt2Line17_StreetNumberName',
  'beneficiary.employment.0.unitType': 'Pt2Line17_Unit_p4_ch3',
  'beneficiary.employment.0.unitNum': 'Pt2Line17_AptSteFlrNumber',
  'beneficiary.employment.0.city': 'Pt2Line17_CityOrTown',
  'beneficiary.employment.0.state': 'Pt2Line17_State',
  'beneficiary.employment.0.zip': 'Pt2Line17_ZipCode',
  'beneficiary.employment.0.province': 'Pt2Line17_Province',
  'beneficiary.employment.0.postal': 'Pt2Line17_PostalCode',
  'beneficiary.employment.0.country': 'Pt2Line17_Country',
  'beneficiary.employment.0.occupation': 'Pt2Line18_Occupation',
  'beneficiary.employment.0.from': 'Pt2Line19a_DateFrom',
  'beneficiary.employment.0.to': 'Pt2Line19b_ToFrom',
};

// ===== Page 6: Pt2Line20 … Pt2Line38c
const PAGE6 = {
  'beneficiary.employment.1.employer': 'Pt2Line20_NameofEmployer',
  'beneficiary.employment.1.street': 'Pt2Line21_StreetNumberName',
  'beneficiary.employment.1.unitType': 'Pt2Line21_Unit_p5_ch3',
  'beneficiary.employment.1.unitNum': 'Pt2Line21_AptSteFlrNumber',
  'beneficiary.employment.1.city': 'Pt2Line21_CityOrTown',
  'beneficiary.employment.1.state': 'Pt2Line21_State',
  'beneficiary.employment.1.zip': 'Pt2Line21_ZipCode',
  'beneficiary.employment.1.province': 'Pt2Line21_Province',
  'beneficiary.employment.1.postal': 'Pt2Line21_PostalCode',
  'beneficiary.employment.1.country': 'Pt2Line21_Country',
  'beneficiary.employment.1.occupation': 'Pt2Line22_Occupation',
  'beneficiary.employment.1.from': 'Pt2Line23a_DateFrom',
  'beneficiary.employment.1.to': 'Pt2Line23b_ToFrom',

  'beneficiary.parents.0.lastName': 'Pt2Line24a_FamilyName',
  'beneficiary.parents.0.firstName': 'Pt2Line24b_GivenName',
  'beneficiary.parents.0.middleName': 'Pt2Line24c_MiddleName',
  'beneficiary.parents.0.alive': 'Pt2Line26_Checkbox_p5_ch2',

  'beneficiary.parents.1.lastName': 'Pt2Line29a_FamilyName',
  'beneficiary.parents.1.firstName': 'Pt2Line29b_GivenName',
  'beneficiary.parents.1.middleName': 'Pt2Line29c_MiddleName',
  'beneficiary.parents.1.dob': 'Pt2Line30_DateofBirth',
  'beneficiary.parents.1.alive': 'Pt2Line31_Checkbox_p5_ch2',
  'beneficiary.parents.1.citizenshipCountry': 'Pt2Line32_CountryOfCitzOrNationality',
  'beneficiary.parents.1.cityBirth': 'Pt2Line33a_CityTownOfBirth',
  'beneficiary.parents.1.countryBirth': 'Pt2Line33b_CountryOfCitzOrNationality',
  'beneficiary.parents.1.maritalStatus': 'Pt2Line34_Checkboxes_p5_ch2',

  'beneficiary.immi.priorSpouse.lastName': 'Pt2Line35a_FamilyNameLastName',
  'beneficiary.immi.priorSpouse.firstName': 'Pt2Line35b_GivenNameFirstName',
  'beneficiary.immi.priorSpouse.middleName': 'Pt2Line35c_MiddleName',
  'beneficiary.immi.priorSpouse.marriageEndedDate': 'Pt2Line35a_DateMarriageEnded',

  'beneficiary.entry.lastArrivedAs': 'Pt2Line38a_LastArrivedAs',
  'beneficiary.entry.I94': 'Pt2Line38b_ArrivalDeparture',
  'beneficiary.entry.arrivalDate': 'Pt2Line38c_DateofArrival',
};

// ===== Page 7: Pt2Line38d … Pt2Line50f
const PAGE7 = {
  'beneficiary.entry.I94Expiry': 'Pt2Line38d_DateExpired',
  'beneficiary.passport.number': 'Pt2Line38e_Passport',
  'beneficiary.travelDoc.number': 'Pt2Line38f_TravelDoc',
  'beneficiary.passport.issuanceCountry': 'Pt2Line38g_CountryOfIssuance',
  'beneficiary.passport.expiry': 'Pt2Line38h_ExpDate',
  'beneficiary.us.present': 'Pt2Line39_Checkboxes_p6_ch2',

  'usReceiver.lastName': 'Pt2Line40a_FamilyName',
  'usReceiver.firstName': 'Pt2Line40b_GivenName',
  'usReceiver.middleName': 'Pt2Line40c_MiddleName',
  'usReceiver.country': 'Pt2Line41_CountryOfBirth',
  'usReceiver.dob': 'Pt2Line42_DateofBirth',

  'intent.metWithin2Years': 'Pt2Line43_Checkboxes_p6_ch2',
  'intent.dayPhone': 'Pt2Line46_DayTimeTelephoneNumber',

  'addr45.unitType': 'Pt2Line45b_Unit_p6_ch3',
  'addr47.unitType': 'Pt2Line47_Unit_p6_ch3',
  'addr50.unitType': 'Pt2Line50_Unit_p6_ch3',

  'relationship.typeK1': 'Pt2Line51_Checkboxes_p7_ch3',
  'relationship.typeK3': 'Pt2Line53_Checkboxes_p7_ch3',
  'relationship.describe': 'Pt2Line54_Describe',
  'relationship.metOnline': 'Pt2Line55_Checkboxes_p7_ch2',

  'relationship.met.city': 'Pt2Line62a_CityTown',
  'relationship.met.country': 'Pt2Line62b_Country',
};

// ===== Page 8: Pt2Line51 … Pt3Line2a (+ Part 4/5/6/7/8 essentials)
const PAGE8 = {
  'part3.q1': 'Pt3Line1_Checkboxes_p7_ch2',
  'part3.q2a': 'P3Line2a_Checkboxes_p7_ch2',
  'part3.q2b': 'P3Line2b_Checkboxes_p8_ch2',
  'part3.q2c': 'P3Line2c_Checkboxes_p8_ch2',

  'phys.height.ft': 'Pt4Line3_HeightFeet',
  'phys.height.in': 'Pt4Line3_HeightInches',
  'phys.race.white': 'Pt4Line2_Checkbox_p8_White',
  'phys.race.asian': 'Pt4Line2_Checkbox_p8_Asian',
  'phys.race.black': 'Pt4Line2_Checkbox_p8_BlackOrAfricanAmerrican',
  'phys.race.native': 'Pt4Line2_Checkbox_p8_AmericanIndianOrAlaskaNative',
  'phys.race.pacific': 'Pt4Line2_Checkbox_p8_NativeHawaiianOrPacificIslander',
  'phys.hair.box': 'Part3Line4a_HairColorCheckboxes_p8_ch2',
  'phys.hair.otherText': 'Pt3Line4b_AdditionalInformation',

  'petitioner.contact.dayPhone': 'Pt5Line1_DaytimePhoneNumber1',
  'petitioner.contact.mobile': 'Pt5Line2_MobileNumber1',
  'petitioner.contact.email': 'Pt5Line3_Email',
  'petitioner.signDate': 'Pt5Line4_DateOfSignature',

  'interp.lastName': 'Pt6Line1_InterpreterFamilyName',
  'interp.firstName': 'Pt6Line1_InterpreterGivenName',
  'interp.business': 'Pt6Line2_NameofBusinessorOrgName',
  'interp.phone1': 'Pt6Line4_InterpreterDaytimeTelephone_p9_n1',
  'interp.phone2': 'Pt6Line4_InterpreterDaytimeTelephone_p9_n2',
  'interp.email': 'Pt6Line5_Email',
  'interp.language': 'Pt6_NameOfLanguage',
  'interp.signDate': 'Pt6Line6_DateofSignature',

  'prep.lastName': 'Pt7Line1_PreparerFamilyName',
  'prep.firstName': 'Pt7Line1b_PreparerGivenName',
  'prep.business': 'Pt7Line2_NameofBusinessorOrgName',
  'prep.phone': 'Pt7Line3_DaytimePhoneNumber1',
  'prep.mobile': 'Pt7Line4_PreparerMobileNumber',
  'prep.email': 'Pt7Line5_Email',
  'prep.signDate': 'Pt7Line6_DateofSignature',

  'addl.page3.Page': 'Line3a_PageNumber',
  'addl.page3.Part': 'Line3b_PartNumber',
  'addl.page3.Item': 'Line3c_ItemNumber',
  'addl.page3.Text': 'Line3d_AdditionalInfo',

  'addl.page4.Page': 'Line4a_PageNumber',
  'addl.page4.Part': 'Line4b_PartNumber',
  'addl.page4.Item': 'Line4c_ItemNumber',
  'addl.page4.Text': 'Line4d_AdditionalInfo',

  'addl.page5.Page': 'Line5a_PageNumber',
  'addl.page5.Part': 'Line5b_PartNumber',
  'addl.page5.Item': 'Line5c_ItemNumber',
  'addl.page5.Text': 'Line5d_AdditionalInfo',

  'addl.page6.Page': 'Line6a_PageNumber',
  'addl.page6.Part': 'Line6b_PartNumber',
  'addl.page6.Item': 'Line6c_ItemNumber',
  'addl.page6.Text': 'Line6d_AdditionalInfo',

  'addl.page7.Page': 'Line7a_PageNumber',
  'addl.page7.Part': 'Line7b_PartNumber',
  'addl.page7.Item': 'Line7c_ItemNumber',
  'addl.page7.Text': 'Line7d_AdditionalInfo',
};

export const I129F_MAPPING = {
  ...PAGE1, ...PAGE2, ...PAGE3, ...PAGE4, ...PAGE5, ...PAGE6, ...PAGE7, ...PAGE8,
};

export const I129F_SECTIONS = [
  { title: 'Page 1 — Part 1 (Lines 1–8j)', paths: Object.keys(PAGE1) },
  { title: 'Page 2 — Part 1 (Lines 9–19)', paths: Object.keys(PAGE2) },
  { title: 'Page 3 — Part 1 (Lines 20–41)', paths: Object.keys(PAGE3) },
  { title: 'Page 4 — Pt1 L42–Pt2 L10', paths: Object.keys(PAGE4) },
  { title: 'Page 5 — Pt2 L11–L19', paths: Object.keys(PAGE5) },
  { title: 'Page 6 — Pt2 L20–L38c', paths: Object.keys(PAGE6) },
  { title: 'Page 7 — Pt2 L38d–L62b', paths: Object.keys(PAGE7) },
  { title: 'Page 8 — Parts 3–8 (essentials)', paths: Object.keys(PAGE8) },
];

export function applyI129fMapping(data, form) {
  for (const [path, field] of Object.entries(I129F_MAPPING)) {
    const val = getByPath(data, path);
    if (val == null || val === '') continue;

    if (/date|from|to|dob|exp/i.test(path) && typeof val !== 'boolean') {
      if (setText(form, field, formatDate(val))) continue;
    }
    if (setText(form, field, val)) continue;
    setCheckbox(form, field, val);
  }
}
