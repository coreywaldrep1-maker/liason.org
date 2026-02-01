// lib/i129f-mapping.js
// Maps saved wizard JSON to renamed AcroForm field names on the I-129F PDF template.
// NOTE: This mapping targets the renamed PDF in /public/i-129f.pdf

const CLEAR_FIELDS = [
  // Petitioner basics
  'Petitioner_Alien_Registration_page_1_Num_1',
  'Petitioner_USCIS_Online_Acct_Num_page_1_Num_2',
  'Petitioner_Social_Security_Num_page_1_Num_3',

  // ✅ NEW (classification + I-130)
  'Petitioner_Request_Beneficiary_K1_page_1_Num_4a',
  'Petitioner_Request_Beneficiary_K3_page_1_Num_4b',
  'Petitioner_Filing_K3_Filed_I130__Yes',
  'Petitioner_Filing_K3_Filed_I130__No',

  // Mailing address
  'Petitioner_in_care_of_APt_Ste_Flr_number_Page1_8.c',
  'Petitioner_in_Care_of_State_page1_8.e',
  'Petitioner_in_Care_of_ZipCode_page1_8.f',
  'Petitioner_in_Care_of_Province_page1_8.g',
  'Petitioner_in_Care_of_Postal_Code_page1_8.h',

  // ✅ NEW (same as physical yes/no)
  'Petitioner_Mailing_Adress_Same_as_physical_checkbox_Yes_page1_8.j',
  'Petitioner_Mailing_Adress_Same_as_physical_checkbox_No_page1_8.j',

  // Beneficiary basics / biographic (existing)
  'Beneficiary_Family_Name_Last_Name_page4_1.a',
  'Beneficiary_Given_Name_First_Name_page4_1.b',
  'Beneficiary_Date_Of_Birth_page4_4',
  'Beneficiary_Information_Biographic_Information_Ethnicity_Hispanic_Checkbox_page9_1',
  'Beneficiary_Information_Biographic_Information_Ethnicity_Not_Hispanic_Checkbox_page9_1',
  'Beneficiary_Information_Biographic_Information_Race_White_Checkbox_page9_2',
  'Beneficiary_Information_Biographic_Information_Race_Asian_Checkbox_page9_2',
  'Beneficiary_Information_Biographic_Information_Race_Black_AfricanAmerican_Checkbox_page9_2',
  'Beneficiary_Information_Biographic_Information_Race_NativeHawaiian_OtherPacificIslander_Checkbox_page9_2',

  // Email fields
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
  // Accept already formatted MM/DD/YYYY
  return String(v);
}

function norm(v) {
  if (v === null || v === undefined) return '';
  return String(v);
}

function pickUnitType(v) {
  if (!v) return '';
  const s = String(v).trim().toLowerCase();
  if (s.startsWith('apt')) return 'Apt';
  if (s.startsWith('ste')) return 'Ste';
  if (s.startsWith('flr')) return 'Flr';
  return '';
}

function yesNoToBool(v) {
  if (v === true) return true;
  if (v === false) return false;
  if (!v) return null;
  const s = String(v).trim().toLowerCase();
  if (s === 'yes' || s === 'y' || s === 'true') return true;
  if (s === 'no' || s === 'n' || s === 'false') return false;
  return null;
}

function safeSetText(form, name, value) {
  try {
    form.getTextField(name).setText(norm(value));
  } catch {
    // ignore
  }
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

function safeCheckBox(form, name, checked) {
  try {
    const cb = form.getCheckBox(name);
    if (checked) cb.check();
    else cb.uncheck();
  } catch {
    // ignore
  }
}

// helper: enforce single yes/no when fields are separate checkboxes (fallback)
function safeCheckYesNoPair(form, yesField, noField, ynBool) {
  // always clear both first
  safeCheckBox(form, yesField, false);
  safeCheckBox(form, noField, false);
  if (ynBool === true) safeCheckBox(form, yesField, true);
  if (ynBool === false) safeCheckBox(form, noField, true);
}

export function applyI129fMapping(saved, form) {
  const petitioner = saved?.petitioner || {};
  const beneficiary = saved?.beneficiary || {};
  const contact = saved?.contact || {};
  const interpreter = saved?.interpreter || {};
  const preparer = saved?.preparer || {};

  // Clear common fields (helps reduce stale data in some viewers)
  try {
    for (const n of CLEAR_FIELDS) {
      try {
        form.getTextField(n).setText('');
      } catch {
        safeCheckBox(form, n, false);
      }
    }
  } catch {}

  // -----------------------------
  // PART 1 — CLASSIFICATION (Page 1)
  // -----------------------------
  {
    const cls = String(petitioner.classification || '').trim().toLowerCase();

    // Try radio-group select first (if your PDF uses a radio group).
    // If that fails, fall back to checkbox pairs.
    const groupName = 'Petitioner_Select_One_box_Classification_of_Beneficiary';
    const K1 = 'Petitioner_Request_Beneficiary_K1_page_1_Num_4a';
    const K3 = 'Petitioner_Request_Beneficiary_K3_page_1_Num_4b';

    // clear both always (covers checkbox scenario)
    safeCheckBox(form, K1, false);
    safeCheckBox(form, K3, false);

    if (cls === 'k3') {
      const ok = safeSelectRadio(form, groupName, K3);
      if (!ok) safeCheckBox(form, K3, true);
    } else if (cls === 'k1') {
      const ok = safeSelectRadio(form, groupName, K1);
      if (!ok) safeCheckBox(form, K1, true);
    }
  }

  // -----------------------------
  // PART 1 — K-3 ONLY: Filed I-130? (Page 1)
  // -----------------------------
  {
    const yn = yesNoToBool(petitioner.filedI130);
    const groupName = 'Petitioner_Filing_K3_Visa_Check_Yes_No_page_1_number5';
    const YES = 'Petitioner_Filing_K3_Filed_I130__Yes';
    const NO = 'Petitioner_Filing_K3_Filed_I130__No';

    // clear both first (checkbox fallback)
    safeCheckBox(form, YES, false);
    safeCheckBox(form, NO, false);

    if (yn === true) {
      const ok = safeSelectRadio(form, groupName, YES);
      if (!ok) safeCheckBox(form, YES, true);
    } else if (yn === false) {
      const ok = safeSelectRadio(form, groupName, NO);
      if (!ok) safeCheckBox(form, NO, true);
    }
  }

  // -----------------------------
  // PETITIONER (Page 1)
  // -----------------------------
  safeSetText(form, 'Petitioner_Alien_Registration_page_1_Num_1', petitioner.aNumber);
  safeSetText(form, 'Petitioner_USCIS_Online_Acct_Num_page_1_Num_2', petitioner.uscisAccount);
  safeSetText(form, 'Petitioner_Social_Security_Num_page_1_Num_3', petitioner.ssn);

  safeSetText(form, 'Petitioner_Family_Name_Last_Name_page1_6a', petitioner.lastName);
  safeSetText(form, 'Petitioner_Given_Name_First_Name_page1_6b', petitioner.firstName);
  safeSetText(form, 'Petitioner_MiddleName_page1_6.c', petitioner.middleName);

  // Other names used (PDF has 1 row): map FIRST non-empty row from wizard list
  const list = Array.isArray(petitioner.otherNames) ? petitioner.otherNames : [];
  const pOther =
    list.find((x) => {
      const a = String(x?.lastName || '').trim();
      const b = String(x?.firstName || '').trim();
      const c = String(x?.middleName || '').trim();
      return !!(a || b || c);
    }) || list[0] || {};

  safeSetText(form, 'Petitioner_Other_Names_Used_Family_Name_page_1_Num_7a', pOther.lastName);
  safeSetText(form, 'Petitioner_Other_Names_Used_Given_Name_page_1_Num_7.b', pOther.firstName);
  // ✅ This is the one you called out
  safeSetText(form, 'Petitioner_Other_Names_Used_Middle_Name_page_1_Num_7.c', pOther.middleName);

  // -----------------------------
  // PETITIONER MAILING ADDRESS (Page 1)
  // -----------------------------
  const pm = petitioner.mailing || {};

  safeSetText(form, 'Petitioner_In_Care_of_Name_page1_8.a', pm.inCareOf);
  safeSetText(form, 'Petitioner_Street_Number_and_Name_Page1_8.b', pm.street);

  // Apt/Ste/Flr checkboxes + unit number text
  const pUnit = pickUnitType(pm.unitType);
  safeCheckBox(form, 'Petitioner_in_care_of_APt_Ste_Flr_number_Page1_8.c', false); // clear text-field attempt (no-op if checkbox)
  safeCheckBox(form, 'Petitioner_in_care_of_Ste_Checkbox_Page1_8.c', pUnit === 'Ste');
  safeCheckBox(form, 'Petitioner_in_care_of_Flr_Checkbox_Page1_8.c', pUnit === 'Flr');
  // ✅ Required mapping: Unit Number -> Petitioner_in_care_of_APt_Ste_Flr_number_Page1_8.c
  safeSetText(form, 'Petitioner_in_care_of_APt_Ste_Flr_number_Page1_8.c', pm.unitNumber);

  safeSetText(form, 'Petitioner_in_Care_of_City_or_Town_page1_8.d', pm.city);

  // ✅ Required mappings
  safeSetText(form, 'Petitioner_in_Care_of_State_page1_8.e', pm.state);
  safeSetText(form, 'Petitioner_in_Care_of_ZipCode_page1_8.f', pm.zip);
  safeSetText(form, 'Petitioner_in_Care_of_Province_page1_8.g', pm.province);
  safeSetText(form, 'Petitioner_in_Care_of_Postal_Code_page1_8.h', pm.postal);

  safeSetText(form, 'Petitioner_in_Care_of_Country_page1_8.i', pm.country);

  // ✅ Mailing same as physical yes/no (Page 1 8.j)
  {
    const yn = yesNoToBool(pm.sameAsPhysical);
    const YES = 'Petitioner_Mailing_Adress_Same_as_physical_checkbox_Yes_page1_8.j';
    const NO = 'Petitioner_Mailing_Adress_Same_as_physical_checkbox_No_page1_8.j';

    // Try radio group (if present), otherwise enforce single checkbox selection
    const groupName = 'Petitioner_is_mailing_address_same_as_physical_address_check_yes_or_no_page1_8.j';
    if (yn === true) {
      const ok = safeSelectRadio(form, groupName, YES);
      if (!ok) safeCheckYesNoPair(form, YES, NO, true);
    } else if (yn === false) {
      const ok = safeSelectRadio(form, groupName, NO);
      if (!ok) safeCheckYesNoPair(form, YES, NO, false);
    } else {
      // clear both if unanswered
      safeCheckYesNoPair(form, YES, NO, null);
    }
  }

  // -----------------------------
  // PETITIONER PHYSICAL ADDRESS HISTORY (Page 2) — existing mapping (unchanged)
  // -----------------------------
  const pAddr0 = (petitioner.addresses && petitioner.addresses[0]) || {};
  const pAddr1 = (petitioner.addresses && petitioner.addresses[1]) || {};

  safeSetText(form, 'Petitioner_Address_1_History_Date_From_page2_9.b', fmtDate(pAddr0.from));
  safeSetText(form, 'Petitioner_Address_1_History_Date_To_page2_9.c', fmtDate(pAddr0.to));
  safeSetText(form, 'Petitioner_Address_1_History_Street_Numb_and_name_page2_9.a', pAddr0.street);
  safeSetText(form, 'Petitioner_Address_1_History_City_or_town_page2_9.d', pAddr0.city);
  safeSetText(form, 'Petitioner_Address_1_History_State_page2_9.e', pAddr0.state);
  safeSetText(form, 'Petitioner_Address_1_History_Zipcode_page2_9.f', pAddr0.zip);
  safeSetText(form, 'Petitioner_Address_1_History_Country_page2_9.g', pAddr0.country);

  safeSetText(form, 'Petitioner_Address_2_History_Date_From_page2_11.b', fmtDate(pAddr1.from));
  safeSetText(form, 'Petitioner_Address_2_History_Date_To_page2_11.c', fmtDate(pAddr1.to));
  safeSetText(form, 'Petitioner_Address_2_History_Street_Numb_and_name_page2_11.a', pAddr1.street);
  safeSetText(form, 'Petitioner_Address_2_History_City_or_town_page2_11.d', pAddr1.city);
  safeSetText(form, 'Petitioner_Address_2_History_State_page2_11.e', pAddr1.state);
  safeSetText(form, 'Petitioner_Address_2_History_Zipcode_page2_11.f', pAddr1.zip);
  safeSetText(form, 'Petitioner_Address_2_History_Country_page2_11.g', pAddr1.country);

  // -----------------------------
  // ... keep the rest of your existing mappings below this line ...
  // (Beneficiary, Biographic, Criminal, Contact, Interpreter, Preparer, Part 8)
  // -----------------------------
}
