// lib/i129f-mapping.js
// Map I-129F Wizard saved JSON -> renamed AcroForm field names (your renamed template)

export const I129F_DEBUG_FIELD_LIST = [
  'Petitioner_Request_Beneficiary_K1_page_1_Num_4a',
  'Petitioner_Request_Beneficiary_K3_page_1_Num_4b',
  'Petitioner_Filing_K3_Filed_I130__Yes',
  'Petitioner_Filing_K3_Filed_I130__No',
  'Petitioner_in_care_of_APt_Ste_Flr_number_Page1_8.c',
  'Petitioner_in_Care_of_State_page1_8.e',
  'Petitioner_in_Care_of_ZipCode_page1_8.f',
  'Petitioner_in_Care_of_Province_page1_8.g',
  'Petitioner_in_Care_of_Postal_Code_page1_8.h',
  'Petitioner_Mailing_Adress_Same_as_physical_checkbox_Yes_page1_8.j',
  'Petitioner_Mailing_Adress_Same_as_physical_checkbox_No_page1_8.j',

  'Beneficiary_Information_Biographic_Information_Ethnicity_Hispanic_Checkbox_page9_1',
  'Beneficiary_Information_Biographic_Information_Ethnicity_Not_Hispanic_Checkbox_page9_1',
  'Beneficiary_Information_Biographic_Information_Race_White_Checkbox_page9_2',
  'Beneficiary_Information_Biographic_Information_Race_Asian_Checkbox_page9_2',
  'Beneficiary_Information_Biographic_Information_Race_Black_AfricanAmerican_Checkbox_page9_2',
  'Beneficiary_Information_Biographic_Information_Race_NativeHawaiian_OtherPacificIslander_Checkbox_page9_2',
  'Beneficiary_Information_Biographic_Information_Height_Feet_Checkbox_page9_3',
  'Beneficiary_Information_Biographic_Information_Height_Inches_Checkbox_page9_3',
  'Beneficiary_Information_Biographic_Information_Eye_Color_Checkboxes_page9_5',
  'Beneficiary_Information_Biographic_Information_Hair_Color_Checkboxes_page9_6',
];

function norm(v) {
  if (v === null || v === undefined) return '';
  return String(v);
}

function pad2(x) {
  return String(x).padStart(2, '0');
}

function fmtDate(v) {
  if (!v) return '';
  const s = String(v).trim();

  // yyyy-mm-dd -> MM/DD/YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-');
    return `${m}/${d}/${y}`;
  }

  // m/d/yyyy or mm/dd/yyyy -> MM/DD/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [m, d, y] = s.split('/');
    return `${pad2(m)}/${pad2(d)}/${y}`;
  }

  return s;
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
  return '';
}

function yesNoToBool(v) {
  if (v === true) return true;
  if (v === false) return false;
  const s = String(v || '').trim().toLowerCase();
  if (['y', 'yes', 'true', '1'].includes(s)) return true;
  if (['n', 'no', 'false', '0'].includes(s)) return false;
  return null;
}

function safeSetText(form, name, value) {
  const val = norm(value);
  if (!val) return;
  try { form.getTextField(name).setText(val); } catch {}
}

function safeCheckBox(form, name, checked) {
  try {
    const cb = form.getCheckBox(name);
    if (checked) cb.check();
    else cb.uncheck();
  } catch {}
}

function safeSelectRadio(form, groupName, exportValue) {
  if (!exportValue) return false;
  try {
    form.getRadioGroup(groupName).select(String(exportValue));
    return true;
  } catch {
    return false;
  }
}

export function applyI129fMapping(saved = {}, form) {
  if (!form) throw new Error('applyI129fMapping(saved, form) requires a pdf-lib form');

  // supports both {data:{...}} and {...}
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
  // Part 1 — K-1 / K-3 (Page 1 #4)
  // -----------------------------
  {
    const cls = String(firstNonEmpty(petitioner.classification?.type, petitioner.classification)).toLowerCase();

    const K1 = 'Petitioner_Request_Beneficiary_K1_page_1_Num_4a';
    const K3 = 'Petitioner_Request_Beneficiary_K3_page_1_Num_4b';

    // clear both (checkbox fallback)
    safeCheckBox(form, K1, false);
    safeCheckBox(form, K3, false);

    const group = 'Petitioner_Select_One_box_Classification_of_Beneficiary';

    if (cls === 'k3') {
      const ok = safeSelectRadio(form, group, K3);
      if (!ok) safeCheckBox(form, K3, true);
    } else if (cls === 'k1') {
      const ok = safeSelectRadio(form, group, K1);
      if (!ok) safeCheckBox(form, K1, true);
    }
  }

  // -----------------------------
  // Part 1 — K-3 only: filed I-130? (Page 1 #5)
  // -----------------------------
  {
    const yn = yesNoToBool(firstNonEmpty(petitioner.classification?.i130Filed, petitioner.filedI130));
    const YES = 'Petitioner_Filing_K3_Filed_I130__Yes';
    const NO  = 'Petitioner_Filing_K3_Filed_I130__No';
    const group = 'Petitioner_Filing_K3_Visa_Check_Yes_No_page_1_number5';

    safeCheckBox(form, YES, false);
    safeCheckBox(form, NO, false);

    if (yn === true) {
      const ok = safeSelectRadio(form, group, YES);
      if (!ok) safeCheckBox(form, YES, true);
    } else if (yn === false) {
      const ok = safeSelectRadio(form, group, NO);
      if (!ok) safeCheckBox(form, NO, true);
    }
  }

  // -----------------------------
  // Part 1 — Petitioner basics
  // -----------------------------
  safeSetText(form, 'Petitioner_Alien_Registration_page_1_Num_1', petitioner.aNumber);
  safeSetText(form, 'Petitioner_USCIS_Online_Acct_Num_page_1_Num_2', petitioner.uscisOnlineAccount);
  safeSetText(form, 'Petitioner_Social_Security_Num_page_1_Num_3', petitioner.ssn);

  safeSetText(form, 'Petitioner_Family_Name_Last_Name_page1_6a', petitioner.lastName);
  safeSetText(form, 'Petitioner_Given_Name_First_Name_page1_6b', petitioner.firstName);
  safeSetText(form, 'Petitioner_MiddleName_page1_6.c', petitioner.middleName);

  // Other names used (PDF has ONE row): map first non-empty row from wizard
  {
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

  // Mailing address (Page 1 #8) — includes province/postal now
  {
    const m = petitioner.mailing ?? {};
    const unitNum = firstNonEmpty(m.unitNum, m.unitNumber);

    safeSetText(form, 'Petitioner_In_Care_of_Name_page1_8.a', m.inCareOf);
    safeSetText(form, 'Petitioner_Street_Number_and_Name_Page1_8.b', m.street);

    const unitType = pickUnitType(m.unitType);
    const APT = 'Petitioner_in_care_of_Apt_Checkbox_Page1_8.c.';
    const STE = 'Petitioner_in_care_of_Ste_Checkbox_Page1_8.c.';
    const FLR = 'Petitioner_in_care_of_Flr_Checkbox_Page1_8.c.';
    safeCheckBox(form, APT, unitType === 'Apt');
    safeCheckBox(form, STE, unitType === 'Ste');
    safeCheckBox(form, FLR, unitType === 'Flr');
    safeSetText(form, 'Petitioner_in_care_of_APt_Ste_Flr_number_Page1_8.c', unitNum);

    safeSetText(form, 'Petitioner_in_Care_of_City_or_Town_page1_8.d', m.city);
    safeSetText(form, 'Petitioner_in_Care_of_State_page1_8.e', m.state);
    safeSetText(form, 'Petitioner_in_Care_of_ZipCode_page1_8.f', m.zip);
    safeSetText(form, 'Petitioner_in_Care_of_Province_page1_8.g', m.province);
    safeSetText(form, 'Petitioner_in_Care_of_Postal_Code_page1_8.h', m.postal);
    safeSetText(form, 'Petitioner_in_Care_of_Country_page1_8.i', m.country);

    const yn = yesNoToBool(m.sameAsPhysical);

    const YES = 'Petitioner_Mailing_Adress_Same_as_physical_checkbox_Yes_page1_8.j';
    const NO  = 'Petitioner_Mailing_Adress_Same_as_physical_checkbox_No_page1_8.j';
    safeCheckBox(form, YES, false);
    safeCheckBox(form, NO, false);

    const group = 'Petitioner_is_mailing_address_same_as_physical_address_check_yes_or_no_page1_8.j';

    if (yn === true) {
      const ok = safeSelectRadio(form, group, YES);
      if (!ok) safeCheckBox(form, YES, true);
    } else if (yn === false) {
      const ok = safeSelectRadio(form, group, NO);
      if (!ok) safeCheckBox(form, NO, true);
    }
  }

  // Address history dates — fix the dot on DateFrom (this was a reason dates “didn’t map”)
  {
    const a1 = Array.isArray(petitioner.physicalAddresses) ? petitioner.physicalAddresses[0] : null;
    const a2 = Array.isArray(petitioner.physicalAddresses) ? petitioner.physicalAddresses[1] : null;

    if (a1) {
      safeSetText(form, 'Petitioner_Address_1_History_Street_Numb_and_name_page2_9.a', a1.street);

      const utype = pickUnitType(a1.unitType);
      safeCheckBox(form, 'Petitioner_Address_1_History_Apt_Checkbox_Page2_9.b', utype === 'Apt');
      safeCheckBox(form, 'Petitioner_Address_1_History_Suite_Checkbox_Page2_9.b', utype === 'Ste');
      safeCheckBox(form, 'Petitioner_Address_1_History_Floor_Checkbox_Page2_9.b', utype === 'Flr');

      safeSetText(form, 'Petitioner_Address_1_History_Apt_Suite_Floor_Number_Page2_9.b', firstNonEmpty(a1.unitNum, a1.unitNumber));
      safeSetText(form, 'Petitioner_Address_1_History_City_or_town_page2_9.c', a1.city);
      safeSetText(form, 'Petitioner_Address_1_History_State_page2_9.d', a1.state);
      safeSetText(form, 'Petitioner_Address_1_History_ZipCode_page2_9.e', a1.zip);
      safeSetText(form, 'Petitioner_Address_1_History_Country_page2_9.h', a1.country);

      safeSetText(form, 'Petitioner_Address_1_History_DateFrom_page2_10.a.', fmtDate(a1.from));
      safeSetText(form, 'Petitioner_Address_1_History_DateTo_page2_10.b', fmtDate(a1.to));
    }

    if (a2) {
      safeSetText(form, 'Petitioner_Address_2_History_Street_Numb_and_name_page2_11.a', a2.street);

      const utype = pickUnitType(a2.unitType);
      safeCheckBox(form, 'Petitioner_Address_2_History_Apt_Checkbox_Page2_11.b.', utype === 'Apt');
      safeCheckBox(form, 'Petitioner_Address_2_History_Suite_Checkbox_Page2_11.b.', utype === 'Ste');
      safeCheckBox(form, 'Petitioner_Address_2_History_Floor_Checkbox_Page2_11b', utype === 'Flr');

      safeSetText(form, 'Petitioner_Address_2_History_Apt_Suite_Floor_Number_Page2_11.b', firstNonEmpty(a2.unitNum, a2.unitNumber));
      safeSetText(form, 'Petitioner_Address_2_History_City_or_town_page2_11.c', a2.city);
      safeSetText(form, 'Petitioner_Address_2_History_State_page2_11.d', a2.state);
      safeSetText(form, 'Petitioner_Address_2_History_ZipCode_page2_11.e', a2.zip);
      safeSetText(form, 'Petitioner_Address_2_History_Country_page2_11.h', a2.country);

      safeSetText(form, 'Petitioner_Address_2_History_DateFrom_page2_12.a', fmtDate(a2.from));
      safeSetText(form, 'Petitioner_Address_2_History_DateTo_page2_12.b', fmtDate(a2.to));
    }
  }

  // -----------------------------
  // Beneficiary basics (Page 4)
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
  // Beneficiary Biographic (Page 9) — FIXES Hispanic / Race / Height / Eye / Hair
  // -----------------------------
  {
    // Ethnicity (yes/no -> check only ONE)
    const yn = yesNoToBool(beneficiary.ethnicityHispanic);
    const HISP = 'Beneficiary_Information_Biographic_Information_Ethnicity_Hispanic_Checkbox_page9_1';
    const NOTH = 'Beneficiary_Information_Biographic_Information_Ethnicity_Not_Hispanic_Checkbox_page9_1';

    safeCheckBox(form, HISP, false);
    safeCheckBox(form, NOTH, false);

    // If your PDF also uses a radio group, this is the group name:
    const group = 'Beneficiary_Information_Biographic_Information_Ethnicity_Hispanic_Not_Hispanic_Checkboxes_page9_1';

    if (yn === true) {
      const ok = safeSelectRadio(form, group, HISP);
      if (!ok) safeCheckBox(form, HISP, true);
    } else if (yn === false) {
      const ok = safeSelectRadio(form, group, NOTH);
      if (!ok) safeCheckBox(form, NOTH, true);
    }

    // Race (single select -> check exactly one)
    const race = String(beneficiary.race || '').trim().toLowerCase();
    const RACE = {
      white: 'Beneficiary_Information_Biographic_Information_Race_White_Checkbox_page9_2',
      asian: 'Beneficiary_Information_Biographic_Information_Race_Asian_Checkbox_page9_2',
      black: 'Beneficiary_Information_Biographic_Information_Race_Black_AfricanAmerican_Checkbox_page9_2',
      nhopi: 'Beneficiary_Information_Biographic_Information_Race_NativeHawaiian_OtherPacificIslander_Checkbox_page9_2',
    };

    Object.values(RACE).forEach((n) => safeCheckBox(form, n, false));
    if (RACE[race]) safeCheckBox(form, RACE[race], true);

    // Height
    safeSetText(form, 'Beneficiary_Information_Biographic_Information_Height_Feet_Checkbox_page9_3', beneficiary.heightFeet);
    safeSetText(form, 'Beneficiary_Information_Biographic_Information_Height_Inches_Checkbox_page9_3', beneficiary.heightInches);

    // Eye Color (radio group + fallback checkboxes)
    const eye = String(beneficiary.eyeColor || '').trim().toLowerCase();
    const EYE = {
      black:  'Beneficiary_Information_Biographic_Information_Eye_Color_Black_Checkbox_page9_5',
      blue:   'Beneficiary_Information_Biographic_Information_Eye_Color_Blue_Checkbox_page9_5',
      brown:  'Beneficiary_Information_Biographic_Information_Eye_Color_Brown_Checkbox_page9_5',
      gray:   'Beneficiary_Information_Biographic_Information_Eye_Color_Gray_Checkbox_page9_5',
      green:  'Beneficiary_Information_Biographic_Information_Eye_Color_Green_Checkbox_page9_5',
      hazel:  'Beneficiary_Information_Biographic_Information_Eye_Color_Hazel_Checkbox_page9_5',
      maroon: 'Beneficiary_Information_Biographic_Information_Eye_Color_Maroon_Checkbox_page9_5',
      pink:   'Beneficiary_Information_Biographic_Information_Eye_Color_Pink_Checkbox_page9_5',
      unknown:'Beneficiary_Information_Biographic_Information_Eye_Color_Unkown_Checkbox_page9_5',
    };

    Object.values(EYE).forEach((n) => safeCheckBox(form, n, false));
    if (EYE[eye]) {
      const ok = safeSelectRadio(form, 'Beneficiary_Information_Biographic_Information_Eye_Color_Checkboxes_page9_5', EYE[eye]);
      if (!ok) safeCheckBox(form, EYE[eye], true);
    }

    // Hair Color (radio group + fallback checkboxes)
    const hair = String(beneficiary.hairColor || '').trim().toLowerCase();
    const HAIR = {
      bald:   'Beneficiary_Information_Biographic_Information_Hair_Color_Bald_Checkbox_page9_6',
      black:  'Beneficiary_Information_Biographic_Information_Hair_Color_Black_Checkbox_page9_6',
      blond:  'Beneficiary_Information_Biographic_Information_Hair_Color_Blond_Checkbox_page9_6',
      brown:  'Beneficiary_Information_Biographic_Information_Hair_Color_Brown_Checkbox_page9_6',
      gray:   'Beneficiary_Information_Biographic_Information_Hair_Color_Gray_Checkbox_page9_6',
      red:    'Beneficiary_Information_Biographic_Information_Hair_Color_Red_Checkbox_page9_6',
      sandy:  'Beneficiary_Information_Biographic_Information_Hair_Color_Sandy_Checkbox_page9_6',
      white:  'Beneficiary_Information_Biographic_Information_Hair_Color_White_Checkbox_page9_6',
      unknown_other: 'Beneficiary_Information_Biographic_Information_Hair_Color_Unkown_Other_Checkbox_page9_6',
    };

    Object.values(HAIR).forEach((n) => safeCheckBox(form, n, false));
    if (HAIR[hair]) {
      const ok = safeSelectRadio(form, 'Beneficiary_Information_Biographic_Information_Hair_Color_Checkboxes_page9_6', HAIR[hair]);
      if (!ok) safeCheckBox(form, HAIR[hair], true);
    }
  }

  // -----------------------------
  // Parts 5–7
  // -----------------------------
  safeSetText(form, 'Petitioners_Contact_Information_daytime_Phone_Number_page10_1', contact.daytimePhone);
  safeSetText(form, 'Petitioners_Contact_Information_Mobile_Phone_Number_page10_2', contact.mobile);
  safeSetText(form, 'Petitioners_Contact_Information_Email_Address_page10_3', contact.email);

  safeSetText(form, 'Interpreter_Last_Name_page10_1.a', interpreter.lastName);
  safeSetText(form, 'Interpreter_First_Name_page10_1.b', interpreter.firstName);
  safeSetText(form, 'Interpreter_Business_Org_page10_2', interpreter.business);
  safeSetText(form, 'Interpreter_Daytime_Phone_page10_3', interpreter.phone);
  safeSetText(form, 'Interpreter_Email_page10_5', interpreter.email);
  safeSetText(form, 'Interpreter_Certification_Date_Of_Signature_page10_6', fmtDate(interpreter.signDate));

  safeSetText(form, 'Prepare_Last_Name_page11_1.a', preparer.lastName);
  safeSetText(form, 'Prepare_First_Name_page11_1.b', preparer.firstName);
  safeSetText(form, 'Prepare_Business_Org_page11_2', preparer.business);
  safeSetText(form, 'Prepare_Daytime_Phone_page11_3', preparer.phone);
  safeSetText(form, 'Prepare_Email_page11_5', preparer.email);
  safeSetText(form, 'Preparer_Certification_Date_Of_Signature_page11_8', fmtDate(preparer.signDate));

  return true;
}
