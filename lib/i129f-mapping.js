// lib/i129f-mapping.js
// Maps saved wizard JSON to renamed AcroForm field names on the I-129F PDF template.
// NOTE: This mapping targets the renamed PDF in /public/i-129f.pdf

const CLEAR_FIELDS = [
  // Petitioner basics
  'Petitioner_Alien_Registration_page_1_Num_1',
  'Petitioner_USCIS_Online_Acct_Num_page_1_Num_2',
  'Petitioner_Social_Security_Num_page_1_Num_3',

  // Beneficiary basics
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
  if (!exportValue) return;
  try {
    form.getRadioGroup(groupName).select(String(exportValue));
  } catch {
    // ignore
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
        // could be checkbox
        safeCheckBox(form, n, false);
      }
    }
  } catch {}

  // -----------------------------
  // PETITIONER (page 1-3)
  // -----------------------------
  safeSetText(form, 'Petitioner_Alien_Registration_page_1_Num_1', petitioner.aNumber);
  safeSetText(form, 'Petitioner_USCIS_Online_Acct_Num_page_1_Num_2', petitioner.uscisAccount);
  safeSetText(form, 'Petitioner_Social_Security_Num_page_1_Num_3', petitioner.ssn);

  safeSetText(form, 'Petitioner_Family_Name_Last_Name_page1_6a', petitioner.lastName);
  safeSetText(form, 'Petitioner_Given_Name_First_Name_page1_6b', petitioner.firstName);
  safeSetText(form, 'Petitioner_MiddleName_page1_6.c', petitioner.middleName);

  // other names used (first only)
  const pOther0 = (petitioner.otherNames && petitioner.otherNames[0]) || {};
  safeSetText(form, 'Petitioner_Other_Names_Used_Family_Name_page_1_Num_7a', pOther0.lastName);
  safeSetText(form, 'Petitioner_Other_Names_Used_Given_Name_page_1_Num_7.b', pOther0.firstName);
  safeSetText(form, 'Petitioner_Other_Names_Used_Middle_Name_page_1_Num_7.c', pOther0.middleName);

  // Mailing address
  const pm = petitioner.mailing || {};
  safeSetText(form, 'Petitioner_In_Care_of_Name_page1_8.a', pm.inCareOf);
  safeSetText(form, 'Petitioner_Street_Number_and_Name_Page1_8.b', pm.street);

  // Apt/Ste/Flr checkboxes
  const pUnit = pickUnitType(pm.unitType);
  safeCheckBox(form, 'Petitioner_in_care_of_APt_Ste_Flr_number_Page1_8.c', pUnit === 'Apt');
  safeCheckBox(form, 'Petitioner_in_care_of_Ste_Checkbox_Page1_8.c', pUnit === 'Ste');
  safeCheckBox(form, 'Petitioner_in_care_of_Flr_Checkbox_Page1_8.c', pUnit === 'Flr');
  safeSetText(form, 'Petitioner_in_care_of_AptSteFlr_Number_Page1_8.c', pm.unitNumber);

  safeSetText(form, 'Petitioner_in_Care_of_City_or_Town_page1_8.d', pm.city);
  safeSetText(form, 'Petitioner_in_Care_of_State_page1_8.e', pm.state);
  safeSetText(form, 'Petitioner_in_Care_of_ZipCode_page1_8.f', pm.zip);
  safeSetText(form, 'Petitioner_in_Care_of_Province_page1_8.g', pm.province);
  safeSetText(form, 'Petitioner_in_Care_of_Postal_Code_page1_8.h', pm.postal);
  safeSetText(form, 'Petitioner_in_Care_of_Country_page1_8.i', pm.country);

  // DOB / sex / marital
  safeSetText(form, 'Petitioner_Date_Of_Birth_page2_3', fmtDate(petitioner.dob));

  // Sex checkboxes
  {
    const sex = String(petitioner.sex || '').toLowerCase();
    safeCheckBox(form, 'Petitioner_Sex_Male_Checkbox_page2_4', sex === 'male');
    safeCheckBox(form, 'Petitioner_Sex_Female_Checkbox_page2_4', sex === 'female');
  }

  // Marital status radio group
  {
    const ms = String(petitioner.maritalStatus || '').toLowerCase();
    const MS_EXPORT = {
      single: 'Petitioner_Marital_Status_Single_page2_5',
      married: 'Petitioner_Marital_Status_Married_page2_5',
      divorced: 'Petitioner_Marital_Status_Divorced_page2_5',
      widowed: 'Petitioner_Marital_Status_Widowed_page2_5',
      annulled: 'Petitioner_Marital_Status_Annulled_page2_5',
    };
    if (MS_EXPORT[ms]) safeSelectRadio(form, 'Petitioner_Marital_Status_Choices_page2_5', MS_EXPORT[ms]);
  }

  safeSetText(form, 'Petitioner_City_Town_Village_Birth_page2_6', petitioner.cityBirth);
  safeSetText(form, 'Petitioner_Country_Birth_page2_7', petitioner.countryBirth);

  // Address history (first two)
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

  // Parents (petitioner) - if present in saved shape
  safeSetText(form, 'Petitioner_Parent_1_LastName_page3_28.a', petitioner.parent1Last);
  safeSetText(form, 'Petitioner_Parent_1_FirstName_page3_28.b', petitioner.parent1First);
  safeSetText(form, 'Petitioner_Parent_1_MiddleName_page3_28.c', petitioner.parent1Middle);
  safeSetText(form, 'Petitioner_Parent_2_LastName_page3_32.a', petitioner.parent2Last);
  safeSetText(form, 'Petitioner_Parent_2_FirstName_page3_32.b', petitioner.parent2First);
  safeSetText(form, 'Petitioner_Parent_2_MiddleName_page3_32.c', petitioner.parent2Middle);

  // Citizenship / naturalization fields
  safeSetText(form, 'Petitioner_Certificate_Number_page4_42.a', petitioner.citizenship?.natzCertificate);
  safeSetText(form, 'Petitioner_Place_of_Issuance_page4_42.b', petitioner.citizenship?.natzPlace);
  safeSetText(form, 'Petitioner_Date_Of_Issuance_Number_page4_42.c', fmtDate(petitioner.citizenship?.natzDate));

  // -----------------------------
  // BENEFICIARY (page 4-6)
  // -----------------------------
  safeSetText(form, 'Beneficiary_Alien_Registration_Number_page4_2', beneficiary.aNumber);
  safeSetText(form, 'Beneficiary_Social_Security_Number_page4_3', beneficiary.ssn);

  safeSetText(form, 'Beneficiary_Family_Name_Last_Name_page4_1.a', beneficiary.lastName);
  safeSetText(form, 'Beneficiary_Given_Name_First_Name_page4_1.b', beneficiary.firstName);
  safeSetText(form, 'Beneficiary_Middle_Name_page4_1.c', beneficiary.middleName);

  safeSetText(form, 'Beneficiary_Date_Of_Birth_page4_4', fmtDate(beneficiary.dob));

  // sex checkboxes
  {
    const sex = String(beneficiary.sex || '').toLowerCase();
    safeCheckBox(form, 'Beneficiary_Sex_Male_Checkbox_page4_5', sex === 'male');
    safeCheckBox(form, 'Beneficiary_Sex_Female_Checkbox_page4_5', sex === 'female');
  }

  // marital status radio
  {
    const ms = String(beneficiary.maritalStatus || '').toLowerCase();
    const MS_EXPORT = {
      single: 'Beneficiary_Marital_Status_Single_page4_6',
      married: 'Beneficiary_Marital_Status_Married_page4_6',
      divorced: 'Beneficiary_Marital_Status_Divorced_page4_6',
      widowed: 'Beneficiary_Marital_Status_Widowed_page4_6',
      annulled: 'Beneficiary_Marital_Status_Annulled_page4_6',
    };
    if (MS_EXPORT[ms]) safeSelectRadio(form, 'Beneficiary_Marital_Status_Choices_page4_6', MS_EXPORT[ms]);
  }

  safeSetText(form, 'Beneficiary_City_or_town_of_birth_page4_7', beneficiary.cityBirth);
  safeSetText(form, 'Beneficiary_Country_of_birth_page4_8', beneficiary.countryBirth);

  // Mailing address (beneficiary)
  const bm = beneficiary.mailing || {};
  safeSetText(form, 'Beneficiary_Mailing_Address_In_Care_of_Name_page5_10.a', bm.inCareOf);
  safeSetText(form, 'Beneficiary_Mailing_Street_Number_Name_page5_10.b', bm.street);

  const bUnit = pickUnitType(bm.unitType);
  safeCheckBox(form, 'Beneficiary_Mailing_Adress_2_Apt_checkbox_page5_10.c', bUnit === 'Apt');
  safeCheckBox(form, 'Beneficiary_Mailing_Adress_2_Ste_checkbox_page5_10.c', bUnit === 'Ste');
  safeCheckBox(form, 'Beneficiary_Mailing_Adress_2_Flr_checkbox_page5_10.c', bUnit === 'Flr');
  safeSetText(form, 'Beneficiary_Mailing_Adress_2_Apt_Ste_Flr_Num_Field_page5_10.c', bm.unitNumber);

  safeSetText(form, 'Beneficiary_Mailing_Adress_2_City_or_town_page5_10.d', bm.city);
  safeSetText(form, 'Beneficiary_Mailing_Adress_2_State_page5_10.e', bm.state);
  safeSetText(form, 'Beneficiary_Mailing_Adress_2_Zipcode_page5_10.f', bm.zip);
  safeSetText(form, 'Beneficiary_Mailing_Adress_2_Province_page5_10.g', bm.province);
  safeSetText(form, 'Beneficiary_Mailing_Adress_2_PostalCode_page5_10.h', bm.postal);
  safeSetText(form, 'Beneficiary_Mailing_Adress_2_Country_page5_10.i', bm.country);

  // Physical address history (first two)
  const bAddr0 = (beneficiary.addresses && beneficiary.addresses[0]) || {};
  const bAddr1 = (beneficiary.addresses && beneficiary.addresses[1]) || {};
  safeSetText(form, 'Beneficiary_Physical_Address_1_Date_From_page5_12.b', fmtDate(bAddr0.from));
  safeSetText(form, 'Beneficiary_Physical_Address_1_Date_To_page5_12.c', fmtDate(bAddr0.to));
  safeSetText(form, 'Beneficiary_Physical_Address_1_Street_Number_Name_page5_12.a', bAddr0.street);
  safeSetText(form, 'Beneficiary_Physical_Address_1_City_or_town_page5_12.d', bAddr0.city);
  safeSetText(form, 'Beneficiary_Physical_Address_1_State_page5_12.e', bAddr0.state);
  safeSetText(form, 'Beneficiary_Physical_Address_1_Zipcode_page5_12.f', bAddr0.zip);
  safeSetText(form, 'Beneficiary_Physical_Address_1_Country_page5_12.h', bAddr0.country);

  safeSetText(form, 'Beneficiary_Physical_Address_2_Date_From_page5_13.b', fmtDate(bAddr1.from));
  safeSetText(form, 'Beneficiary_Physical_Address_2_Date_To_page5_13.c', fmtDate(bAddr1.to));
  safeSetText(form, 'Beneficiary_Physical_Address_2_Street_Number_Name_page5_13.a', bAddr1.street);
  safeSetText(form, 'Beneficiary_Physical_Address_2_City_or_town_page5_13.d', bAddr1.city);
  safeSetText(form, 'Beneficiary_Physical_Address_2_State_page5_13.e', bAddr1.state);
  safeSetText(form, 'Beneficiary_Physical_Address_2_Zipcode_page5_13.f', bAddr1.zip);
  safeSetText(form, 'Beneficiary_Physical_Address_2_Country_page5_13.h', bAddr1.country);

  // Employment (beneficiary)
  const be = beneficiary.employment || {};
  safeSetText(form, 'Beneficiary_Employer_Company_Name_page6_20', be.employerName);
  safeSetText(form, 'Beneficiary_Occupation_page6_19', be.occupation);
  safeSetText(form, 'Beneficiary_Employer_Street_Number_and_Name_page6_21.a', be.street);

  const beUnit = pickUnitType(be.unitType);
  safeCheckBox(form, 'Beneficiary_Employer_Apt_Ste_Flr_page6_21.b', beUnit === 'Apt');
  safeCheckBox(form, 'Beneficiary_Employer_Ste_Page6_21.b', beUnit === 'Ste');
  safeCheckBox(form, 'Beneficiary_Employer_Flr_page6_21.b', beUnit === 'Flr');
  safeSetText(form, 'Beneficiary_Employer_Apt_Ste_Flr_num_page6_21.b', be.unitNumber);

  safeSetText(form, 'Beneficiary_Employer_1_City_or_Town_page6_21.c', be.city);
  safeSetText(form, 'Beneficiary_Employer_1_State_page6_21.d', be.state);
  safeSetText(form, 'Beneficiary_Employer_1_Zip_code_page6_21.e', be.zip);
  safeSetText(form, 'Beneficiary_Employer_2_Province_page6_21.f', be.province);
  safeSetText(form, 'Beneficiary_Employer_2_Postal_code_page6_21.g', be.postal);
  safeSetText(form, 'Beneficiary_Employer_2_Country_page6_21.h', be.country);

  // Parents (beneficiary)
  const bpar = beneficiary.parents || {};
  safeSetText(form, 'Beneficiary_Parent_1_LastName_page7_26.a', bpar.p1Last);
  safeSetText(form, 'Beneficiary_Parent_1_FirstName_page7_26.b', bpar.p1First);
  safeSetText(form, 'Beneficiary_Parent_1_MiddleName_page7_26.c', bpar.p1Middle);
  safeSetText(form, 'Beneficiary_Parent_1_DateOfBirth_page7_27', fmtDate(bpar.p1Dob));
  safeSetText(form, 'Beneficiary_Parent_1_City_Birth_page7_28', bpar.p1CityBirth);
  safeSetText(form, 'Beneficiary_Parent_1_Country_Birth_page7_29', bpar.p1CountryBirth);

  safeSetText(form, 'Beneficiary_Parent_2_LastName_page7_30.a', bpar.p2Last);
  safeSetText(form, 'Beneficiary_Parent_2_FirstName_page7_30.b', bpar.p2First);
  safeSetText(form, 'Beneficiary_Parent_2_MiddleName_page7_30.c', bpar.p2Middle);
  safeSetText(form, 'Beneficiary_Parent_2_DateOfBirth_page7_31', fmtDate(bpar.p2Dob));
  safeSetText(form, 'Beneficiary_Parent_2_City_Birth_page7_32', bpar.p2CityBirth);
  safeSetText(form, 'Beneficiary_Parent_2_Country_Birth_page7_33', bpar.p2CountryBirth);

  // Nationality / citizenship
  safeSetText(form, 'Beneficiary_Citizenship_Country_page4_9', beneficiary.nationality);

  // -----------------------------
  // BENEFICIARY (biographic - page 9)
  // -----------------------------
  // Ethnicity (single select yes/no)
  {
    const yn = yesNoToBool(beneficiary.ethnicityHispanic);

    // clear both
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
  safeSetText(form, 'Petitioners_Contact_Information_Daytime_Telephone_page10_1', contact.petitionerDayPhone);
  safeSetText(form, 'Petitioners_Contact_Information_Mobile_Telephone_page10_2', contact.petitionerMobile);
  safeSetText(form, 'Petitioners_Contact_Information_Email_Address_page10_3', contact.petitionerEmail);

  // -----------------------------
  // PART 6 — INTERPRETER
  // -----------------------------
  safeSetText(form, 'Interpreter_Family_Name_Last_Name_page10_4.a', interpreter.lastName);
  safeSetText(form, 'Interpreter_Given_Name_First_Name_page10_4.b', interpreter.firstName);
  safeSetText(form, 'Interpreter_Business_Name_page10_4.c', interpreter.business);
  safeSetText(form, 'Interpreter_Street_Number_and_Name_page10_6.a', interpreter.street);

  const iUnit = pickUnitType(interpreter.unitType);
  safeCheckBox(form, 'Interpreter_Apt_Checkbox_page10_6.b', iUnit === 'Apt');
  safeCheckBox(form, 'Interpreter_Ste_Checkbox_page10_6.b', iUnit === 'Ste');
  safeCheckBox(form, 'Interpreter_Flr_Checkbox_page10_6.b', iUnit === 'Flr');
  safeSetText(form, 'Interpreter_Apt_Ste_Flr_Number_page10_6.b', interpreter.unitNumber);

  safeSetText(form, 'Interpreter_City_or_Town_page10_6.c', interpreter.city);
  safeSetText(form, 'Interpreter_State_page10_6.d', interpreter.state);
  safeSetText(form, 'Interpreter_Zip_Code_page10_6.e', interpreter.zip);
  safeSetText(form, 'Interpreter_Province_page10_6.f', interpreter.province);
  safeSetText(form, 'Interpreter_Postal_Code_page10_6.g', interpreter.postal);
  safeSetText(form, 'Interpreter_Country_page10_6.h', interpreter.country);

  safeSetText(form, 'Interpreter_Daytime_Telephone_page10_7', interpreter.dayPhone);
  safeSetText(form, 'Interpreter_Mobile_Telephone_page10_8', interpreter.mobile);
  safeSetText(form, 'Interpreter_Email_page10_5', interpreter.email);
  safeSetText(form, 'Interpreter_Language_page10_9', interpreter.language);

  // -----------------------------
  // PART 7 — PREPARER
  // -----------------------------
  {
    const yn = yesNoToBool(preparer.isAttorney);
    safeCheckBox(form, 'Prepare_Yes_Checkbox_page11_1', yn === true);
    safeCheckBox(form, 'Prepare_No_Checkbox_page11_1', yn === false);
  }

  safeSetText(form, 'Prepare_Family_Name_Last_Name_page11_2.a', preparer.lastName);
  safeSetText(form, 'Prepare_Given_Name_First_Name_page11_2.b', preparer.firstName);
  safeSetText(form, 'Prepare_Business_Name_page11_2.c', preparer.business);
  safeSetText(form, 'Prepare_Street_Number_and_Name_page11_6.a', preparer.street);

  const pUnit2 = pickUnitType(preparer.unitType);
  safeCheckBox(form, 'Prepare_Apt_Checkbox_page11_6.b', pUnit2 === 'Apt');
  safeCheckBox(form, 'Prepare_Ste_Checkbox_page11_6.b', pUnit2 === 'Ste');
  safeCheckBox(form, 'Prepare_Flr_Checkbox_page11_6.b', pUnit2 === 'Flr');
  safeSetText(form, 'Prepare_Apt_Ste_Flr_Number_page11_6.b', preparer.unitNumber);

  safeSetText(form, 'Prepare_City_or_Town_page11_6.c', preparer.city);
  safeSetText(form, 'Prepare_State_page11_6.d', preparer.state);
  safeSetText(form, 'Prepare_Zip_Code_page11_6.e', preparer.zip);
  safeSetText(form, 'Prepare_Province_page11_6.f', preparer.province);
  safeSetText(form, 'Prepare_Postal_Code_page11_6.g', preparer.postal);
  safeSetText(form, 'Prepare_Country_page11_6.h', preparer.country);

  safeSetText(form, 'Prepare_Daytime_Telephone_page11_7', preparer.dayPhone);
  safeSetText(form, 'Prepare_Mobile_Telephone_page11_8', preparer.mobile);
  safeSetText(form, 'Prepare_Email_page11_5', preparer.email);

  safeSetText(form, 'Prepare_Bar_Number_page11_9.a', preparer.barNumber);
  safeSetText(form, 'Prepare_State_of_Licensure_page11_9.b', preparer.stateBar);

  // -----------------------------
  // PART 8 — ADDITIONAL INFORMATION
  // -----------------------------
  safeSetText(form, 'Additional_Information_page12_1', saved.additionalInfo || saved.part8 || '');

  // done
}
