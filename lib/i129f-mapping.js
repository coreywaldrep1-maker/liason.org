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
      { path: 'beneficiary.ethnicityHispanic', label: 'Beneficiary Ethnicity (Hispanic/Latino) (yes/no)' },
      { path: 'beneficiary.race', label: 'Beneficiary Race (single select)' },

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
  'Beneficiary_Information_Biographic_Information_Ethnicity_Hispanic_Checkbox_page9_1',
  'Beneficiary_Information_Biographic_Information_Ethnicity_Not_Hispanic_Checkbox_page9_1',
  'Beneficiary_Information_Biographic_Information_Race_White_Checkbox_page9_2',
  'Beneficiary_Information_Biographic_Information_Race_Asian_Checkbox_page9_2',
  'Beneficiary_Information_Biographic_Information_Race_Black_AfricanAmerican_Checkbox_page9_2',
  'Beneficiary_Information_Biographic_Information_Race_NativeHawaiian_OtherPacificIslander_Checkbox_page9_2',
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
    const s = String(v ?? '').trim();
    if (s) return s;
  }
  return '';
}

function yesNoToBool(v) {
  if (v === true) return true;
  if (v === false) return false;
  const s = String(v ?? '').trim().toLowerCase();
  if (!s) return null;
  if (['y', 'yes', 'true', '1'].includes(s)) return true;
  if (['n', 'no', 'false', '0'].includes(s)) return false;
  return null;
}

function pickUnitType(v) {
  const s = String(v ?? '').trim().toLowerCase();
  if (s.startsWith('apt')) return 'Apt';
  if (s.startsWith('ste') || s.startsWith('sui')) return 'Ste';
  if (s.startsWith('flr') || s.startsWith('flo')) return 'Flr';
  return '';
}

function safeGetField(form, name) {
  try {
    return form.getField(name);
  } catch {
    return null;
  }
}

function safeSetText(form, name, value) {
  const f = safeGetField(form, name);
  if (!f) return;
  try {
    f.setText(norm(value));
  } catch {
    // ignore
  }
}

function safeCheckBox(form, name, checked) {
  const f = safeGetField(form, name);
  if (!f) return;
  try {
    if (checked) f.check();
    else f.uncheck();
  } catch {
    // ignore
  }
}

function safeSelectRadio(form, groupName, exportValue) {
  const f = safeGetField(form, groupName);
  if (!f) return;
  try {
    f.select(String (exportValue));
  } catch {
    // ignore
  }
}

export function applyI129fMapping(saved, form) {
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
    // PDF only provides one row for "Other Names Used".
    // If the user added multiple rows in the wizard, map the FIRST non-empty row.
    const list = Array.isArray(petitioner.otherNames) ? petitioner.otherNames : [];
    const o =
      list.find((x) => {
        const a = String(x?.lastName || '').trim();
        const b = String(x?.firstName || '').trim();
        const c = String(x?.middleName || '').trim();
        return !!(a || b || c);
      }) || list[0] || null;
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

  // -----------------------------
  // PART 2 — BENEFICIARY
  // -----------------------------
  safeSetText(form, 'Beneficiary_Family_Name_Last_Name_page4_1.a', beneficiary.lastName);
  safeSetText(form, 'Beneficiary_Given_Name_First_Name_page4_1.b', beneficiary.firstName);
  safeSetText(form, 'Beneficiary_Middle_Name_page4_1.c', beneficiary.middleName);
  safeSetText(form, 'Beneficiary_Alien_Registration_Num_page4_2', beneficiary.aNumber);
  safeSetText(form, 'Beneficiary_Social_Security_num_page4_3', beneficiary.ssn);
  safeSetText(form, 'Beneficiary_Date_Of_Birth_page4_4', fmtDate(beneficiary.dob));
  safeSetText(form, 'Beneficiary_City_Town_Village_of_Birth_page4_5', beneficiary.cityBirth);
  safeSetText(form, 'Beneficiary_Country_of_Birth_page4_6', beneficiary.countryBirth);
  safeSetText(form, 'Beneficiary_Country_of_Citizenship_or_Nationality_page4_7', beneficiary.nationality);

  // beneficiary other names
  {
    const o = Array.isArray(beneficiary.otherNames) ? beneficiary.otherNames[0] : null;
    safeSetText(form, 'Beneficiary_Other_Names_Used_Family_Name_page4_8.a', o?.lastName);
    safeSetText(form, 'Beneficiary_Other_Names_Used_Given_Name_page4_8.b', o?.firstName);
    safeSetText(form, 'Beneficiary_Other_Names_Used_Middle_Name_page4_8.c', o?.middleName);
  }

  // status / passport
  safeSetText(form, 'Beneficiary_Is_Beneficiary_currently_in_the_United_States_page4_9a', beneficiary.inUS);
  safeSetText(form, 'Beneficiary_I94_Arrival_Departure_Record_Num_page4_9.b', beneficiary.i94);
  safeSetText(form, 'Beneficiary_Current_Nonimmigrant_Status_page4_10a', beneficiary.classOfAdmission);
  safeSetText(form, 'Beneficiary_Date_of_Arrival_page4_10b', fmtDate(beneficiary.arrivalDate));
  safeSetText(form, 'Beneficiary_Date_Status_expires_page4_10c', fmtDate(beneficiary.statusExpires));

  safeSetText(form, 'Beneficiary_Passport_Num_page4_11a', beneficiary.passportNumber);
  safeSetText(form, 'Beneficiary_Travel_Document_Num_page4_11b', beneficiary.travelDocNumber);
  safeSetText(form, 'Beneficiary_Country_of_Issuance_of_Passport_or_Travel_Document_page4_11c', beneficiary.passportCountry);
  safeSetText(form, 'Beneficiary_Expiration_Date_of_Passport_or_Travel_Document_page4_11d', fmtDate(beneficiary.passportExpiration));

  // -----------------------------
  // PART 2 — BIOGRAPHIC INFORMATION (Ethnicity/Race/Height/Eye/Hair)
  // -----------------------------

  // Ethnicity (single yes/no => check exactly ONE)
  {
    const yn = yesNoToBool(beneficiary.ethnicityHispanic);

    // clear both first (so we never end up with both checked)
    safeCheckBox(form, 'Beneficiary_Information_Biographic_Information_Ethnicity_Hispanic_Checkbox_page9_1', false);
    safeCheckBox(form, 'Beneficiary_Information_Biographic_Information_Ethnicity_Not_Hispanic_Checkbox_page9_1', false);

    if (yn === true) {
      safeCheckBox(form, 'Beneficiary_Information_Biographic_Information_Ethnicity_Hispanic_Checkbox_page9_1', true);
    } else if (yn === false) {
      safeCheckBox(form, 'Beneficiary_Information_Biographic_Information_Ethnicity_Not_Hispanic_Checkbox_page9_1', true);
    }
  }

  // Race (wizard is single-select dropdown -> check one box on the PDF)
  {
    const race = String(beneficiary.race || '').trim().toLowerCase();
    const RACE_FIELDS = {
      white: 'Beneficiary_Information_Biographic_Information_Race_White_Checkbox_page9_2',
      asian: 'Beneficiary_Information_Biographic_Information_Race_Asian_Checkbox_page9_2',
      black: 'Beneficiary_Information_Biographic_Information_Race_Black_AfricanAmerican_Checkbox_page9_2',
      nhopi: 'Beneficiary_Information_Biographic_Information_Race_NativeHawaiian_OtherPacificIslander_Checkbox_page9_2',
    };

    // clear all first (so we never end up with multiple boxes checked)
    Object.values(RACE_FIELDS).forEach((n) => safeCheckBox(form, n, false));

    if (RACE_FIELDS[race]) {
      safeCheckBox(form, RACE_FIELDS[race], true);
    }
  }

  // Height (feet/inches)
  safeSetText(form, 'Beneficiary_Information_Biographic_Information_Height_Feet_Checkbox_page9_3', beneficiary.heightFeet);
  safeSetText(form, 'Beneficiary_Information_Biographic_Information_Height_Inches_Checkbox_page9_3', beneficiary.heightInches);

  // Eye Color (single select -> radio group export value)
  {
    const eye = String(beneficiary.eyeColor || '').trim().toLowerCase();
    const EYE_EXPORT = {
      black: 'Beneficiary_Information_Biographic_Information_Eye_Color_Black_Checkbox_page9_5',
      blue: 'Beneficiary_Information_Biographic_Information_Eye_Color_Blue_Checkbox_page9_5',
      brown: 'Beneficiary_Information_Biographic_Information_Eye_Color_Brown_Checkbox_page9_5',
      gray: 'Beneficiary_Information_Biographic_Information_Eye_Color_Gray_Checkbox_page9_5',
      green: 'Beneficiary_Information_Biographic_Information_Eye_Color_Green_Checkbox_page9_5',
      hazel: 'Beneficiary_Information_Biographic_Information_Eye_Color_Hazel_Checkbox_page9_5',
      maroon: 'Beneficiary_Information_Biographic_Information_Eye_Color_Maroon_Checkbox_page9_5',
      pink: 'Beneficiary_Information_Biographic_Information_Eye_Color_Pink_Checkbox_page9_5',
      unknown: 'Beneficiary_Information_Biographic_Information_Eye_Color_Unkown_Checkbox_page9_5',
    };

    if (EYE_EXPORT[eye]) {
      safeSelectRadio(form, 'Beneficiary_Information_Biographic_Information_Eye_Color_Checkboxes_page9_5', EYE_EXPORT[eye]);
    }
  }

  // Hair Color (single select -> radio group export value)
  {
    const hair = String(beneficiary.hairColor || '').trim().toLowerCase();
    const HAIR_EXPORT = {
      bald: 'Beneficiary_Information_Biographic_Information_Hair_Color_Bald_Checkbox_page9_6',
      black: 'Beneficiary_Information_Biographic_Information_Hair_Color_Black_Checkbox_page9_6',
      blond: 'Beneficiary_Information_Biographic_Information_Hair_Color_Blond_Checkbox_page9_6',
      brown: 'Beneficiary_Information_Biographic_Information_Hair_Color_Brown_Checkbox_page9_6',
      gray: 'Beneficiary_Information_Biographic_Information_Hair_Color_Gray_Checkbox_page9_6',
      red: 'Beneficiary_Information_Biographic_Information_Hair_Color_Red_Checkbox_page9_6',
      sandy: 'Beneficiary_Information_Biographic_Information_Hair_Color_Sandy_Checkbox_page9_6',
      white: 'Beneficiary_Information_Biographic_Information_Hair_Color_White_Checkbox_page9_6',
      unknown_other: 'Beneficiary_Information_Biographic_Information_Hair_Color_Unkown_Other_Checkbox_page9_6',
    };

    if (HAIR_EXPORT[hair]) {
      safeSelectRadio(form, 'Beneficiary_Information_Biographic_Information_Hair_Color_Checkboxes_page9_6', HAIR_EXPORT[hair]);
    }
  }

  // -----------------------------
  // PART 3 — OTHER INFORMATION (CRIMINAL)
  // -----------------------------
  {
    const crim = petitioner.criminal || {};

    // Item 1 — restraining/protection order (Yes/No)
    {
      const yn = yesNoToBool(crim.restrainingOrder);
      const group = 'Beneficiary_Information_Criminal_Ever_Subject_Temporary_Permanent_Protection_Or_Restraining_Order_Yes_No_Checkboxes_page8_1';
      const YES = 'Beneficiary_Information_Criminal_Ever_Subject_Temporary_Permanent_Protection_Or_Restraining_Order_Yes_Checkbox_page8_1';
      const NO = 'Beneficiary_Information_Criminal_Ever_Subject_Temporary_Permanent_Protection_Or_Restraining_Order_No_Checkbox_page8_1';

      if (yn === true) safeSelectRadio(form, group, YES);
      if (yn === false) safeSelectRadio(form, group, NO);
    }

    // Item 2.a — arrested/convicted (domestic violence list) (Yes/No)
    {
      const yn = yesNoToBool(crim.arrestedOrConvicted2a);
      const group = 'Beneficiary_Information_Criminal_Ever_Arreted_Convicted_Yes_No_Checkboxes_page8_2.a';
      const YES = 'Beneficiary_Information_Criminal_Ever_Arreted_Convicted_Yes_Checkbox_page8_2.a.';
      const NO = 'Beneficiary_Information_Criminal_Ever_Arreted_Convicted_No_Checkbox_page8_2.a.';

      if (yn === true) safeSelectRadio(form, group, YES);
      if (yn === false) safeSelectRadio(form, group, NO);
    }

    // Item 2.b — arrested/convicted (homicide list) (Yes/No)
    {
      const yn = yesNoToBool(crim.arrestedOrConvicted2b);
      const group = 'Beneficiary_Information_Criminal_Ever_Arreted_Convicted_Yes_No_Checkboxes_page9_2.b';
      const YES = 'Beneficiary_Information_Criminal_Ever_Arreted_Convicted_Yes_Checkbox_page9_2.b';
      const NO = 'Beneficiary_Information_Criminal_Ever_Arreted_Convicted_No_Checkbox_page9_2.b';

      if (yn === true) safeSelectRadio(form, group, YES);
      if (yn === false) safeSelectRadio(form, group, NO);
    }

    // Item 2.c — three or more arrests/convictions (controlled substance/alcohol) (Yes/No)
    {
      const yn = yesNoToBool(crim.arrestedOrConvicted2c);
      const group = 'Beneficiary_Information_Criminal_Ever_Arreted_Three_Or_More_arrets_Convictions_Yes_No_Checkboxes_page9_2.c';
      const YES = 'P3Line2c_Checkboxes_p8_ch2_Yes';
      const NO = 'P3Line2c_Checkboxes_p8_ch2_No';

      if (yn === true) safeSelectRadio(form, group, YES);
      if (yn === false) safeSelectRadio(form, group, NO);
    }

    // Item 3 — checkboxes (select all that apply)
    safeCheckBox(form, 'Beneficiary_Information_Criminal_Reasons_For_Arrest_Conviction_Self-defense_page9_3.a', !!crim.reasonSelfDefense);
    safeCheckBox(form, 'Beneficiary_Information_Criminal_Reasons_For_Arrest_Conviction_Violated_Protection_Order_page9_3.b', !!crim.reasonViolatedProtectionOrder);
    safeCheckBox(form, 'Beneficiary_Information_Criminal_Reasons_For_Arrest_Conviction_Violated_Commited_Arrested_Convicted_Guilty_Connection_Battered_Cruelty_page9_3.c', !!crim.reasonBatteredCruelty);

    // Item 4.a — ever arrested/cited/charged/etc (Yes/No)
    {
      const yn = yesNoToBool(crim.everArrestedCitedCharged);
      const group = 'Beneficiary_Information_Criminal_Fine_$500_Or_More_Yes_No_Checkboxes_page9_4.a';
      const YES = 'Beneficiary_Information_Criminal_Fine_$500_Or_More_Yes_Checkboxes_page9_4.a.';
      const NO = 'Beneficiary_Information_Criminal_Fine_$500_Or_More_No_Checkboxes_page9_4.a.';

      if (yn === true) safeSelectRadio(form, group, YES);
      if (yn === false) safeSelectRadio(form, group, NO);
    }

    // Item 4.b — details
    safeSetText(form, 'Beneficiary_Information_Criminal_Checked_Yes_To_4.a._Provide_Information_page9_4.b', crim.everArrestedDetails);

    // Item 5 — waiver request (select ONE)
    {
      const waiver = String(crim.waiverType || '').trim().toLowerCase();
      const WAIVER_FIELDS = {
        general: 'Beneficiary_Information_Criminal_Waiver_Request_General_Waiver_page9_5.a',
        extraordinary: 'Beneficiary_Information_Criminal_Waiver_Request_Extraordinary_Circumstances_Waiver_page9_5.b',
        mandatory: 'Beneficiary_Information_Criminal_Waiver_Request_Mandatory_Waiver_page9_5.c',
        not_applicable: 'Beneficiary_Information_Criminal_Waiver_Not_applicable_page9_5.d',
      };

      // clear all first so we never end up with multiple boxes checked
      Object.values(WAIVER_FIELDS).forEach((n) => safeCheckBox(form, n, false));

      if (WAIVER_FIELDS[waiver]) {
        safeCheckBox(form, WAIVER_FIELDS[waiver], true);
      }
    }
  }


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
