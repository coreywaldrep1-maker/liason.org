// lib/i129f-mapping.js
// Map I-129F Wizard saved JSON -> pdf-lib AcroForm field names (your renamed template)

// -----------------------------
// Section metadata (used by /flow/us/i-129f/all-fields)
// -----------------------------
export const I129F_SECTIONS = [
  {
    key: 'p1_identity',
    label: 'Part 1 — Petitioner Identity',
    fields: [
      { path: 'petitioner.aNumber', label: 'Petitioner A-Number' },
      { path: 'petitioner.uscisOnlineAccount', label: 'Petitioner USCIS Online Account' },
      { path: 'petitioner.ssn', label: 'Petitioner SSN' },
      { path: 'petitioner.classification', label: 'Classification (k1/k3)' },
      { path: 'petitioner.filedI130', label: 'Filed I-130 (yes/no)' },
      { path: 'petitioner.lastName', label: 'Petitioner Last Name' },
      { path: 'petitioner.firstName', label: 'Petitioner First Name' },
      { path: 'petitioner.middleName', label: 'Petitioner Middle Name' },
      { path: 'petitioner.otherNames[0].lastName', label: 'Other Name 1 Last' },
      { path: 'petitioner.otherNames[0].firstName', label: 'Other Name 1 First' },
      { path: 'petitioner.otherNames[0].middleName', label: 'Other Name 1 Middle' },
    ],
  },
  {
    key: 'p1_mailing',
    label: 'Part 1 — Petitioner Mailing Address',
    fields: [
      { path: 'petitioner.mailing.inCareOf', label: 'In Care Of' },
      { path: 'petitioner.mailing.street', label: 'Street' },
      { path: 'petitioner.mailing.unitType', label: 'Unit Type (Apt/Ste/Flr)' },
      { path: 'petitioner.mailing.unitNumber', label: 'Unit Number' },
      { path: 'petitioner.mailing.city', label: 'City' },
      { path: 'petitioner.mailing.state', label: 'State' },
      { path: 'petitioner.mailing.zip', label: 'Zip' },
      { path: 'petitioner.mailing.country', label: 'Country' },
      { path: 'petitioner.mailing.sameAsPhysical', label: 'Same as Physical', type: 'checkbox' },
    ],
  },
  {
    key: 'p1_address_history',
    label: 'Part 1 — Petitioner Address History',
    fields: [
      { path: 'petitioner.physicalAddresses[0].street', label: 'Address 1 Street' },
      { path: 'petitioner.physicalAddresses[0].unitType', label: 'Address 1 Unit Type' },
      { path: 'petitioner.physicalAddresses[0].unitNumber', label: 'Address 1 Unit Number' },
      { path: 'petitioner.physicalAddresses[0].city', label: 'Address 1 City' },
      { path: 'petitioner.physicalAddresses[0].state', label: 'Address 1 State' },
      { path: 'petitioner.physicalAddresses[0].zip', label: 'Address 1 Zip' },
      { path: 'petitioner.physicalAddresses[0].country', label: 'Address 1 Country' },
      { path: 'petitioner.physicalAddresses[0].from', label: 'Address 1 From' },
      { path: 'petitioner.physicalAddresses[0].to', label: 'Address 1 To' },

      { path: 'petitioner.physicalAddresses[1].street', label: 'Address 2 Street' },
      { path: 'petitioner.physicalAddresses[1].unitType', label: 'Address 2 Unit Type' },
      { path: 'petitioner.physicalAddresses[1].unitNumber', label: 'Address 2 Unit Number' },
      { path: 'petitioner.physicalAddresses[1].city', label: 'Address 2 City' },
      { path: 'petitioner.physicalAddresses[1].state', label: 'Address 2 State' },
      { path: 'petitioner.physicalAddresses[1].zip', label: 'Address 2 Zip' },
      { path: 'petitioner.physicalAddresses[1].country', label: 'Address 2 Country' },
      { path: 'petitioner.physicalAddresses[1].from', label: 'Address 2 From' },
      { path: 'petitioner.physicalAddresses[1].to', label: 'Address 2 To' },
    ],
  },
  {
    key: 'p1_employment',
    label: 'Part 1 — Petitioner Employment',
    fields: [
      { path: 'petitioner.employment[0].employer', label: 'Employer 1' },
      { path: 'petitioner.employment[0].street', label: 'Employer 1 Street' },
      { path: 'petitioner.employment[0].unitType', label: 'Employer 1 Unit Type' },
      { path: 'petitioner.employment[0].unitNumber', label: 'Employer 1 Unit Number' },
      { path: 'petitioner.employment[0].city', label: 'Employer 1 City' },
      { path: 'petitioner.employment[0].state', label: 'Employer 1 State' },
      { path: 'petitioner.employment[0].zip', label: 'Employer 1 Zip' },
      { path: 'petitioner.employment[0].country', label: 'Employer 1 Country' },
      { path: 'petitioner.employment[0].occupation', label: 'Employer 1 Occupation' },
      { path: 'petitioner.employment[0].from', label: 'Employer 1 From' },
      { path: 'petitioner.employment[0].to', label: 'Employer 1 To' },

      { path: 'petitioner.employment[1].employer', label: 'Employer 2' },
      { path: 'petitioner.employment[1].street', label: 'Employer 2 Street' },
      { path: 'petitioner.employment[1].unitType', label: 'Employer 2 Unit Type' },
      { path: 'petitioner.employment[1].unitNumber', label: 'Employer 2 Unit Number' },
      { path: 'petitioner.employment[1].city', label: 'Employer 2 City' },
      { path: 'petitioner.employment[1].state', label: 'Employer 2 State' },
      { path: 'petitioner.employment[1].zip', label: 'Employer 2 Zip' },
      { path: 'petitioner.employment[1].country', label: 'Employer 2 Country' },
      { path: 'petitioner.employment[1].occupation', label: 'Employer 2 Occupation' },
      { path: 'petitioner.employment[1].from', label: 'Employer 2 From' },
      { path: 'petitioner.employment[1].to', label: 'Employer 2 To' },
    ],
  },
  {
    key: 'p1_parents_citizenship',
    label: 'Part 1 — Petitioner Parents / Citizenship',
    fields: [
      { path: 'petitioner.parents[0].lastName', label: 'Parent 1 Last' },
      { path: 'petitioner.parents[0].firstName', label: 'Parent 1 First' },
      { path: 'petitioner.parents[0].middleName', label: 'Parent 1 Middle' },
      { path: 'petitioner.parents[0].dob', label: 'Parent 1 DOB' },
      { path: 'petitioner.parents[0].countryBirth', label: 'Parent 1 Country of Birth' },
      { path: 'petitioner.parents[0].currentCityCountry', label: 'Parent 1 Residence' },

      { path: 'petitioner.parents[1].lastName', label: 'Parent 2 Last' },
      { path: 'petitioner.parents[1].firstName', label: 'Parent 2 First' },
      { path: 'petitioner.parents[1].middleName', label: 'Parent 2 Middle' },
      { path: 'petitioner.parents[1].dob', label: 'Parent 2 DOB' },
      { path: 'petitioner.parents[1].countryBirth', label: 'Parent 2 Country of Birth' },
      { path: 'petitioner.parents[1].currentCityCountry', label: 'Parent 2 Residence' },

      { path: 'petitioner.citizenship.how', label: 'Citizenship How' },
      { path: 'petitioner.citizenship.natzCertificate', label: 'Naturalization Certificate #' },
      { path: 'petitioner.citizenship.natzPlace', label: 'Naturalization Place' },
      { path: 'petitioner.citizenship.natzDate', label: 'Naturalization Date' },
    ],
  },
  {
    key: 'p2_beneficiary',
    label: 'Part 2 — Beneficiary',
    fields: [
      { path: 'beneficiary.lastName', label: 'Beneficiary Last' },
      { path: 'beneficiary.firstName', label: 'Beneficiary First' },
      { path: 'beneficiary.middleName', label: 'Beneficiary Middle' },
      { path: 'beneficiary.aNumber', label: 'Beneficiary A-Number' },
      { path: 'beneficiary.ssn', label: 'Beneficiary SSN' },
      { path: 'beneficiary.dob', label: 'Beneficiary DOB' },
      { path: 'beneficiary.cityBirth', label: 'Beneficiary City of Birth' },
      { path: 'beneficiary.countryBirth', label: 'Beneficiary Country of Birth' },
      { path: 'beneficiary.nationality', label: 'Beneficiary Nationality' },

      { path: 'beneficiary.otherNames[0].lastName', label: 'Beneficiary Other Name 1 Last' },
      { path: 'beneficiary.otherNames[0].firstName', label: 'Beneficiary Other Name 1 First' },
      { path: 'beneficiary.otherNames[0].middleName', label: 'Beneficiary Other Name 1 Middle' },
    ],
  },
  {
    key: 'p2_status_passport',
    label: 'Part 2 — Beneficiary US Status / Passport',
    fields: [
      { path: 'beneficiary.inUS', label: 'In the U.S. (yes/no)' },
      { path: 'beneficiary.i94', label: 'I-94' },
      { path: 'beneficiary.classOfAdmission', label: 'Class of Admission' },
      { path: 'beneficiary.arrivalDate', label: 'Arrival Date' },
      { path: 'beneficiary.statusExpires', label: 'Status Expires' },
      { path: 'beneficiary.passportNumber', label: 'Passport Number' },
      { path: 'beneficiary.travelDocNumber', label: 'Travel Doc Number' },
      { path: 'beneficiary.passportCountry', label: 'Passport Country' },
      { path: 'beneficiary.passportExpiration', label: 'Passport Expiration' },
    ],
  },
  {
    key: 'contact_interp_prep',
    label: 'Parts 5–7 — Contact / Interpreter / Preparer',
    fields: [
      { path: 'contact.daytimePhone', label: 'Contact Daytime Phone' },
      { path: 'contact.mobile', label: 'Contact Mobile' },
      { path: 'contact.email', label: 'Contact Email' },

      { path: 'interpreter.lastName', label: 'Interpreter Last' },
      { path: 'interpreter.firstName', label: 'Interpreter First' },
      { path: 'interpreter.business', label: 'Interpreter Business' },
      { path: 'interpreter.phone', label: 'Interpreter Phone' },
      { path: 'interpreter.email', label: 'Interpreter Email' },
      { path: 'interpreter.signDate', label: 'Interpreter Sign Date' },

      { path: 'preparer.isAttorney', label: 'Preparer Is Attorney' },
      { path: 'preparer.lastName', label: 'Preparer Last' },
      { path: 'preparer.firstName', label: 'Preparer First' },
      { path: 'preparer.business', label: 'Preparer Business' },
      { path: 'preparer.phone', label: 'Preparer Phone' },
      { path: 'preparer.email', label: 'Preparer Email' },
      { path: 'preparer.signDate', label: 'Preparer Sign Date' },
    ],
  },
  {
    key: 'additional',
    label: 'Part 8 — Additional Info',
    fields: [{ path: 'additionalInfo', label: 'Additional Info' }],
  },
];

// quick sanity-check list used by mapping routes / diagnostics
export const I129F_DEBUG_FIELD_LIST = [
  'Petitioner_Alien_Registration_page_1_Num_1',
  'Petitioner_USCIS_Online_Acct_Num_page_1_Num_2',
  'Petitioner_Social_Security_Num_page_1_Num_3',
  'Petitioner_Family_Name_Last_Name_page1_6a',
  'Petitioner_Given_Name_First_Name_page1_6b',
  'Petitioner_MiddleName_page1_6.c',
  'Petitioner_Street_Number_and_Name_Page1_8.b',
  'Petitioner_in_Care_of_City_or_Town_page1_8.d',
  'Beneficiary_Family_Name_Last_Name_page4_1.a',
  'Beneficiary_Given_Name_First_Name_page4_1.b',
  'Beneficiary_Date_Of_Birth_page4_4',
  'Petitioners_Contact_Information_Email_Address_page10_3',
  'Interpreter_Email_page10_5',
  'Prepare_Email_page11_5',
];

function fmtDate(v) {
  if (!v) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(v))) {
    const [y, m, d] = String(v).split('-');
    return `${m}/${d}/${y}`;
  }
  return String(v);
}

function norm(v) {
  if (v === null || v === undefined) return '';
  return String(v);
}

function firstNonEmpty(...vals) {
  for (const v of vals) {
    const s = norm(v).trim();
    if (s) return v;
  }
  return '';
}

function pickUnitType(v) {
  if (!v) return '';
  const s = String(v).trim().toLowerCase();
  if (s.startsWith('apt')) return 'Apt';
  if (s.startsWith('ste') || s.startsWith('sui')) return 'Ste';
  if (s.startsWith('fl')) return 'Flr';
  return String(v);
}

function safeSetText(form, name, value) {
  const val = norm(value);
  if (!val) return;
  try {
    form.getTextField(name).setText(val);
  } catch {
    // ignore missing/mismatched fields
  }
}

function safeSelectRadio(form, groupName, exportValue) {
  if (!exportValue) return;
  try {
    form.getRadioGroup(groupName).select(String(exportValue));
  } catch {
    // ignore
  }
}

function yesNoToBool(v) {
  if (v === true) return true;
  if (v === false) return false;
  const s = String(v || '').trim().toLowerCase();
  if (['y', 'yes', 'true', '1'].includes(s)) return true;
  if (['n', 'no', 'false', '0'].includes(s)) return false;
  return null;
}

export function applyI129fMapping(saved = {}, form) {
  if (!form) throw new Error('applyI129fMapping(saved, form) requires a pdf-lib form');

  // ✅ handle both shapes: {data:{...}} and {...}
  const root =
    saved && typeof saved === 'object' && saved.data && typeof saved.data === 'object'
      ? saved.data
      : saved;

  const petitioner = root.petitioner ?? {};
  const beneficiary = root.beneficiary ?? {};
  const contact = root.contact ?? {};
  const interpreter = root.interpreter ?? {};
  const preparer = root.preparer ?? {};

  // -----------------------------
  // PART 1 — PETITIONER
  // -----------------------------
  safeSetText(form, 'Petitioner_Alien_Registration_page_1_Num_1', petitioner.aNumber);
  safeSetText(form, 'Petitioner_USCIS_Online_Acct_Num_page_1_Num_2', petitioner.uscisOnlineAccount);
  safeSetText(form, 'Petitioner_Social_Security_Num_page_1_Num_3', petitioner.ssn);

  // 4. Classification (wizard stores "k1"/"k3" OR object {type:...})
  {
    const t = String(firstNonEmpty(petitioner.classification?.type, petitioner.classification)).toLowerCase();
    if (t) {
      safeSelectRadio(
        form,
        'Petitioner_Select_One_box_Classification_of_Beneficiary',
        t === 'k3'
          ? 'Petitioner_Request_Beneficiary_K3_page_1_Num_4b'
          : 'Petitioner_Request_Beneficiary_K1_page_1_Num_4a'
      );
    }
  }

  // 5. Filed I-130? (wizard stores petitioner.filedI130)
  {
    const yn = yesNoToBool(firstNonEmpty(petitioner.classification?.i130Filed, petitioner.filedI130));
    if (yn !== null) {
      safeSelectRadio(
        form,
        'Petitioner_Filing_K3_Visa_Check_Yes_No_page_1_number5',
        yn ? 'Petitioner_Filing_K3_Filed_I130__Yes' : 'Petitioner_Filing_K3_Filed_I130_No'
      );
    }
  }

  // 6. Name
  safeSetText(form, 'Petitioner_Family_Name_Last_Name_page1_6a', petitioner.lastName);
  safeSetText(form, 'Petitioner_Given_Name_First_Name_page1_6b', petitioner.firstName);
  safeSetText(form, 'Petitioner_MiddleName_page1_6.c', petitioner.middleName);

  // 7. Other names
  {
    const o = Array.isArray(petitioner.otherNames) ? petitioner.otherNames[0] : null;
    safeSetText(form, 'Petitioner_Other_Names_Used_Family_Name_page_1_Num_7a', o?.lastName);
    safeSetText(form, 'Petitioner_Other_Names_Used_Given_Name_page_1_Num_7.b', o?.firstName);
    safeSetText(form, 'Petitioner_Other_Names_Used_Middle_Name_page_1_Num_7.c', o?.middleName);
  }

  // 8. Mailing address (wizard uses unitNumber, mapping also accepts unitNum)
  {
    const m = petitioner.mailing ?? {};
    const unitNum = firstNonEmpty(m.unitNum, m.unitNumber);

    safeSetText(form, 'Petitioner_In_Care_of_Name_page1_8.a', m.inCareOf);
    safeSetText(form, 'Petitioner_Street_Number_and_Name_Page1_8.b', m.street);

    const unitType = pickUnitType(m.unitType);
    const PET_UNIT_EXPORT = {
      Apt: 'Petitioner_in_care_of_Apt_Checkbox_Page1_8.c.',
      Ste: 'Petitioner_in_care_of_Ste_Checkbox_Page1_8.c.',
      Flr: 'Petitioner_in_care_of_Flr_Checkbox_Page1_8.c.',
    };
    if (PET_UNIT_EXPORT[unitType]) {
      safeSelectRadio(form, 'Petitioner_ In_Care_of_Apt_Ste_Flr_Num_Question_page1_8.c', PET_UNIT_EXPORT[unitType]);
    }
    safeSetText(form, 'Petitioner_in_care_of_APt_Ste_Flr_number_Page1_8.c', unitNum);

    safeSetText(form, 'Petitioner_in_Care_of_City_or_Town_page1_8.d', m.city);
    safeSetText(form, 'Petitioner_in_Care_of_State_page1_8.e', m.state);
    safeSetText(form, 'Petitioner_in_Care_of_ZipCode_page1_8.f', m.zip);
    safeSetText(form, 'Petitioner_in_Care_of_Country_page1_8.i', m.country);

    const same = !!m.sameAsPhysical;
    // this is a yes/no radio group in your template
    safeSelectRadio(
      form,
      'Petitioner_is_mailing_address_same_as_physical_address_check_yes_or_no_page1_8.j',
      same
        ? 'Petitioner_Mailing_Adress_Same_as_physical_checkbox_Yes_page1_8.j'
        : 'Petitioner_Mailing_Adress_Same_as_physical_checkbox_No_page1_8.j'
    );
  }

  // 9–12. Address history (wizard uses unitNumber)
  {
    const a1 = Array.isArray(petitioner.physicalAddresses) ? petitioner.physicalAddresses[0] : null;
    const a2 = Array.isArray(petitioner.physicalAddresses) ? petitioner.physicalAddresses[1] : null;

    if (a1) {
      safeSetText(form, 'Petitioner_Address_1_History_Street_Numb_and_name_page2_9.a', a1.street);
      safeSetText(form, 'Petitioner_Address_1_History_Apt_Suite_Floor_Number_Page2_9.b', firstNonEmpty(a1.unitNum, a1.unitNumber));
      safeSetText(form, 'Petitioner_Address_1_History_City_or_town_page2_9.c', a1.city);
      safeSetText(form, 'Petitioner_Address_1_History_State_page2_9.d', a1.state);
      safeSetText(form, 'Petitioner_Address_1_History_ZipCode_page2_9.e', a1.zip);
      safeSetText(form, 'Petitioner_Address_1_History_Country_page2_9.h', a1.country);
      safeSetText(form, 'Petitioner_Address_1_History_DateFrom_page2_10.a', fmtDate(a1.from));
      safeSetText(form, 'Petitioner_Address_1_History_DateTo_page2_10.b', fmtDate(a1.to));
    }

    if (a2) {
      safeSetText(form, 'Petitioner_Address_2_History_Street_Numb_and_name_page2_11.a', a2.street);
      safeSetText(form, 'Petitioner_Address_2_History_Apt_Suite_Floor_Number_Page2_11.b', firstNonEmpty(a2.unitNum, a2.unitNumber));
      safeSetText(form, 'Petitioner_Address_2_History_City_or_town_page2_11.c', a2.city);
      safeSetText(form, 'Petitioner_Address_2_History_State_page2_11.d', a2.state);
      safeSetText(form, 'Petitioner_Address_2_History_ZipCode_page2_11.e', a2.zip);
      safeSetText(form, 'Petitioner_Address_2_History_Country_page2_11.h', a2.country);
      safeSetText(form, 'Petitioner_Address_2_History_DateFrom_page2_12.a', fmtDate(a2.from));
      safeSetText(form, 'Petitioner_Address_2_History_DateTo_page2_12.b', fmtDate(a2.to));
    }
  }

  // Naturalization certificate (wizard uses petitioner.citizenship.*)
  safeSetText(form, 'Petitioner_Certificate_Number_page4_42.a.', firstNonEmpty(petitioner.citizenship?.natzCertificate, petitioner.natzNumber));
  safeSetText(form, 'Petitioner_Place_Of_Issuance_Number_page4_42.b', firstNonEmpty(petitioner.citizenship?.natzPlace, petitioner.natzPlace));
  safeSetText(form, 'Petitioner_Date_Of_Issuance_Number_page4_42.c', fmtDate(firstNonEmpty(petitioner.citizenship?.natzDate, petitioner.natzDate)));

  // -----------------------------
  // BENEFICIARY (basic)
  // -----------------------------
  safeSetText(form, 'Beneficiary_Family_Name_Last_Name_page4_1.a', beneficiary.lastName);
  safeSetText(form, 'Beneficiary_Given_Name_First_Name_page4_1.b', beneficiary.firstName);
  safeSetText(form, 'Beneficiary_Middle_Name_page4_1.c', beneficiary.middleName);

  safeSetText(form, 'Beneficiary_A_Number_if_any_page4_2', beneficiary.aNumber);
  safeSetText(form, 'Beneficiary_Social_Security_Number_page4_3', beneficiary.ssn);

  safeSetText(form, 'Beneficiary_Date_Of_Birth_page4_4', fmtDate(beneficiary.dob));
  safeSetText(form, 'Beneficiary_City_Town_Village_Birth_page4_5', beneficiary.cityBirth);
  safeSetText(form, 'Beneficiary_CountryOfBirth_page4_6', beneficiary.countryBirth);
  safeSetText(form, 'Beneficiary_Citizenship_Country_page4_9', beneficiary.nationality);

  // -----------------------------
  // PART 5 — CONTACT
  // -----------------------------
  safeSetText(form, 'Petitioners_Contact_Information_daytime_Phone_Number_page10_1', contact.daytimePhone);
  safeSetText(form, 'Petitioners_Contact_Information_Mobile_Phone_Number_page10_2', contact.mobile);
  safeSetText(form, 'Petitioners_Contact_Information_Email_Address_page10_3', contact.email);

  // -----------------------------
  // PART 6 — INTERPRETER (wizard has no mobile field)
  // -----------------------------
  safeSetText(form, 'Interpreter_Last_Name_page10_1.a', interpreter.lastName);
  safeSetText(form, 'Interpreter_First_Name_page10_1.b', interpreter.firstName);
  safeSetText(form, 'Interpreter_Business_Org_page10_2', interpreter.business);
  safeSetText(form, 'Interpreter_Daytime_Phone_page10_3', interpreter.phone);
  safeSetText(form, 'Interpreter_Email_page10_5', interpreter.email);
  safeSetText(form, 'Interpreter_Certification_Date_Of_Signature_page10_6', fmtDate(interpreter.signDate));

  // -----------------------------
  // PART 7 — PREPARER
  // -----------------------------
  safeSetText(form, 'Prepare_Last_Name_page11_1.a', preparer.lastName);
  safeSetText(form, 'Prepare_First_Name_page11_1.b', preparer.firstName);
  safeSetText(form, 'Prepare_Business_Org_page11_2', preparer.business);
  safeSetText(form, 'Prepare_Daytime_Phone_page11_3', preparer.phone);
  safeSetText(form, 'Prepare_Email_page11_5', preparer.email);
  safeSetText(form, 'Preparer_Certification_Date_Of_Signature_page11_8', fmtDate(preparer.signDate));

  return true;
}
