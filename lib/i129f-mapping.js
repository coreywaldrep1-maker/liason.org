// lib/i129f-mapping.js
// Map I-129F Wizard saved JSON -> pdf-lib AcroForm field names (your renamed template)

export const I129F_DEBUG_FIELD_LIST = [
  // Petitioner (quick sanity checks)
  'Petitioner_Alien_Registration_page_1_Num_1',
  'Petitioner_USCIS_Online_Acct_Num_page_1_Num_2',
  'Petitioner_Social_Security_Num_page_1_Num_3',
  'Petitioner_Family_Name_Last_Name_page1_6a',
  'Petitioner_Given_Name_First_Name_page1_6b',
  'Petitioner_MiddleName_page1_6.c',
  'Petitioner_Street_Number_and_Name_Page1_8.b',
  'Petitioner_in_Care_of_City_or_Town_page1_8.d',

  // Beneficiary (quick sanity checks)
  'Beneficiary_Family_Name_Last_Name_page4_1.a',
  'Beneficiary_Given_Name_First_Name_page4_1.b',
  'Beneficiary_Date_Of_Birth_page4_4',

  // Contact / Interpreter / Preparer
  'Petitioners_Contact_Information_Email_Address_page10_3',
  'Interpreter_Email_page10_5',
  'Prepare_Email_page11_5',
];

function fmtDate(v) {
  if (!v) return '';
  // Handles <input type="date"> values like 2026-01-25
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [y, m, d] = v.split('-');
    return `${m}/${d}/${y}`;
  }
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
    // ignore missing/mismatched fields (template differences)
  }
}

function safeSelectRadio(form, groupName, exportValue) {
  if (!exportValue) return;
  try {
    form.getRadioGroup(groupName).select(String(exportValue));
  } catch {
    // ignore if not a radio group / missing
  }
}

function safeCheck(form, name, on) {
  try {
    const cb = form.getCheckBox(name);
    if (on) cb.check();
    else cb.uncheck();
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

  const petitioner = saved.petitioner ?? {};
  const beneficiary = saved.beneficiary ?? {};
  const contact = saved.contact ?? {};
  const interpreter = saved.interpreter ?? {};
  const preparer = saved.preparer ?? {};

  // -----------------------------
  // PART 1 — PETITIONER (Page 1+)
  // -----------------------------
  safeSetText(form, 'Petitioner_Alien_Registration_page_1_Num_1', petitioner.aNumber);
  safeSetText(form, 'Petitioner_USCIS_Online_Acct_Num_page_1_Num_2', petitioner.uscisOnlineAccount);
  safeSetText(form, 'Petitioner_Social_Security_Num_page_1_Num_3', petitioner.ssn);

  // 4. Classification (radio group)
  // export values (from your template):
  //  - Petitioner_Request_Beneficiary_K1_page_1_Num_4a
  //  - Petitioner_Request_Beneficiary_K3_page_1_Num_4b
  if (petitioner.classification?.type) {
    const t = String(petitioner.classification.type).toLowerCase();
    safeSelectRadio(
      form,
      'Petitioner_Select_One_box_Classification_of_Beneficiary',
      t === 'k3'
        ? 'Petitioner_Request_Beneficiary_K3_page_1_Num_4b'
        : 'Petitioner_Request_Beneficiary_K1_page_1_Num_4a'
    );
  }

  // 5. If K-3, filed I-130? (radio group)
  // export values:
  //  - Petitioner_Filing_K3_Filed_I130__Yes
  //  - Petitioner_Filing_K3_Filed_I130_No
  {
    const yn = yesNoToBool(petitioner.classification?.i130Filed);
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

  // 7. Other names (first entry)
  {
    const o = Array.isArray(petitioner.otherNames) ? petitioner.otherNames[0] : null;
    safeSetText(form, 'Petitioner_Other_Names_Used_Family_Name_page_1_Num_7a', o?.lastName);
    safeSetText(form, 'Petitioner_Other_Names_Used_Given_Name_page_1_Num_7.b', o?.firstName);
    safeSetText(form, 'Petitioner_Other_Names_Used_Middle_Name_page_1_Num_7.c', o?.middleName);
  }

  // 8. Mailing address
  {
    const m = petitioner.mailing ?? {};
    safeSetText(form, 'Petitioner_In_Care_of_Name_page1_8.a', m.inCareOf);
    safeSetText(form, 'Petitioner_Street_Number_and_Name_Page1_8.b', m.street);

    // unit type radio group export values:
    //  - Petitioner_in_care_of_Apt_Checkbox_Page1_8.c.
    //  - Petitioner_in_care_of_Ste_Checkbox_Page1_8.c.
    //  - Petitioner_in_care_of_Flr_Checkbox_Page1_8.c.
    const unitType = pickUnitType(m.unitType);
    const PET_UNIT_EXPORT = {
      Apt: 'Petitioner_in_care_of_Apt_Checkbox_Page1_8.c.',
      Ste: 'Petitioner_in_care_of_Ste_Checkbox_Page1_8.c.',
      Flr: 'Petitioner_in_care_of_Flr_Checkbox_Page1_8.c.',
    };
    if (PET_UNIT_EXPORT[unitType]) {
      safeSelectRadio(form, 'Petitioner_ In_Care_of_Apt_Ste_Flr_Num_Question_page1_8.c', PET_UNIT_EXPORT[unitType]);
    }
    safeSetText(form, 'Petitioner_in_care_of_APt_Ste_Flr_number_Page1_8.c', m.unitNum);

    safeSetText(form, 'Petitioner_in_Care_of_City_or_Town_page1_8.d', m.city);
    safeSetText(form, 'Petitioner_in_Care_of_State_page1_8.e', m.state);
    safeSetText(form, 'Petitioner_in_Care_of_ZipCode_page1_8.f', m.zip);
    safeSetText(form, 'Petitioner_in_Care_of_Province_page1_8.g', m.province);
    safeSetText(form, 'Petitioner_in_Care_of_Postal_Code_page1_8.h', m.postal);
    safeSetText(form, 'Petitioner_in_Care_of_Country_page1_8.i', m.country);

    // 8.j same as physical (yes/no radio)
    // export values:
    //  - Petitioner_Mailing_Adress_Same_as_physical_checkbox_Yes_page1_8.j
    //  - Petitioner_Mailing_Adress_Same_as_physical_checkbox_No_page1_8.j
    const same = yesNoToBool(m.sameAsPhysical);
    if (same !== null) {
      safeSelectRadio(
        form,
        'Petitioner_is_mailing_address_same_as_physical_address_check_yes_or_no_page1_8.j',
        same
          ? 'Petitioner_Mailing_Adress_Same_as_physical_checkbox_Yes_page1_8.j'
          : 'Petitioner_Mailing_Adress_Same_as_physical_checkbox_No_page1_8.j'
      );
    }
  }

  // 9–12. Address history (uses petitioner.physicalAddresses[0..1])
  {
    const a1 = Array.isArray(petitioner.physicalAddresses) ? petitioner.physicalAddresses[0] : null;
    const a2 = Array.isArray(petitioner.physicalAddresses) ? petitioner.physicalAddresses[1] : null;

    if (a1) {
      safeSetText(form, 'Petitioner_Address_1_History_Street_Numb_and_name_page2_9.a', a1.street);
      safeSetText(form, 'Petitioner_Address_1_History_Apt_Ste_Floor_Checkbox_Page2_9.b', pickUnitType(a1.unitType));
      safeSetText(form, 'Petitioner_Address_1_History_Apt_Suite_Floor_Number_Page2_9.b', a1.unitNum);
      safeSetText(form, 'Petitioner_Address_1_History_City_or_town_page2_9.c', a1.city);
      safeSetText(form, 'Petitioner_Address_1_History_State_page2_9.d', a1.state);
      safeSetText(form, 'Petitioner_Address_1_History_ZipCode_page2_9.e', a1.zip);
      safeSetText(form, 'Petitioner_Address_1_History_Province_page2_9.f', a1.province);
      safeSetText(form, 'Petitioner_Address_1_History_PostalCode_page2_9.g', a1.postal);
      safeSetText(form, 'Petitioner_Address_1_History_Country_page2_9.h', a1.country);
      safeSetText(form, 'Petitioner_Address_1_History_DateFrom_page2_10.a', fmtDate(a1.from));
      safeSetText(form, 'Petitioner_Address_1_History_DateTo_page2_10.b', fmtDate(a1.to));
    }

    if (a2) {
      safeSetText(form, 'Petitioner_Address_2_History_Street_Numb_and_name_page2_11.a', a2.street);
      safeSetText(form, 'Petitioner_Address_2_History_Apt_Ste_Floor_Checkbox_Page2_11.b', pickUnitType(a2.unitType));
      safeSetText(form, 'Petitioner_Address_2_History_Apt_Suite_Floor_Number_Page2_11.b', a2.unitNum);
      safeSetText(form, 'Petitioner_Address_2_History_City_or_town_page2_11.c', a2.city);
      safeSetText(form, 'Petitioner_Address_2_History_State_page2_11.d', a2.state);
      safeSetText(form, 'Petitioner_Address_2_History_ZipCode_page2_11.e', a2.zip);
      safeSetText(form, 'Petitioner_Address_2_History_Province_page2_11.f', a2.province);
      safeSetText(form, 'Petitioner_Address_2_History_PostalCode_page2_11.g', a2.postal);
      safeSetText(form, 'Petitioner_Address_2_History_Country_page2_11.h', a2.country);
      safeSetText(form, 'Petitioner_Address_2_History_DateFrom_page2_12.a', fmtDate(a2.from));
      safeSetText(form, 'Petitioner_Address_2_History_DateTo_page2_12.b', fmtDate(a2.to));
    }
  }

  // 13–20. Employment history (uses petitioner.employment[0..1])
  {
    const e1 = Array.isArray(petitioner.employment) ? petitioner.employment[0] : null;
    const e2 = Array.isArray(petitioner.employment) ? petitioner.employment[1] : null;

    const EMP1_UNIT_EXPORT = {
      Apt: 'Petitioner_Employment_History_1_Apt_Checkbox_Page2_14.b',
      Ste: 'Petitioner_Employment_History_1_Suite_Checkbox_Page2_14.b',
      Flr: 'Petitioner_Employment_History_1_Floor_Checkbox_Page2_14.b',
    };
    const EMP2_UNIT_EXPORT = {
      Apt: 'Petitioner_Employment_History_2_Apt_Checkbox_Page2_18.b',
      Ste: 'Petitioner_Employment_History_2_Suite_Checkbox_Page2_18.b',
      Flr: 'Petitioner_Employment_History_2_Floor_Checkbox_Page2_18.b',
    };

    if (e1) {
      safeSetText(form, 'Petitioner_employment_History_1_NameOfEmployer_page2_13', e1.employer);
      safeSetText(form, 'Petitioner_Employement_1_History_StreetNumber_or_name_page2_14.a', e1.street);

      const ut = pickUnitType(e1.unitType);
      if (EMP1_UNIT_EXPORT[ut]) {
        safeSelectRadio(
          form,
          'Petitioner_Employment_History_1_Apt_Suite_Floor_Number_Page2_14.b',
          EMP1_UNIT_EXPORT[ut]
        );
      }
      safeSetText(form, 'Petitioner_Employment_History_1_AptSteFlr_Number_Page2_14.b', e1.unitNum);

      safeSetText(form, 'Petitioner_Employement_1_History_City_or_town_page2_14.c', e1.city);
      safeSetText(form, 'Petitioner_Employement_1_History_State_page2_14.d', e1.state);
      safeSetText(form, 'Petitioner_Employement_1_History_ZipCode_page2_14.e', e1.zip);
      safeSetText(form, 'Petitioner_Employement_1_History_Province_page2_14.f', e1.province);
      safeSetText(form, 'Petitioner_Employement_1_History_PostalCode_page2_14.g', e1.postal);
      safeSetText(form, 'Petitioner_Employement_1_History_Country_page2_14.h', e1.country);

      safeSetText(form, 'Petitioner_Employement_1_History_Occupation_page2_15', e1.occupation);
      safeSetText(form, 'Petitioner_Employement_1_History_Start_Date_page2_16.a', fmtDate(e1.from));
      safeSetText(form, 'Petitioner_Employement_1_History_End_Date_page2_16.b', fmtDate(e1.to));
    }

    if (e2) {
      safeSetText(form, 'Petitioner_employment_History_2_NameOfEmployer_page2_18', e2.employer);
      safeSetText(form, 'Petitioner_Employement_2_History_StreetNumber_or_name_page2_18.a', e2.street);

      const ut = pickUnitType(e2.unitType);
      if (EMP2_UNIT_EXPORT[ut]) {
        safeSelectRadio(
          form,
          'Petitioner_Employment_History_2_Apt_Suite_Floor_Number_Page2_18.b',
          EMP2_UNIT_EXPORT[ut]
        );
      }
      safeSetText(form, 'Petitioner_Employment_History_2_AptSteFlr_Number_Page2_18.b', e2.unitNum);

      safeSetText(form, 'Petitioner_Employement_2_History_City_or_town_page2_18.c', e2.city);
      safeSetText(form, 'Petitioner_Employement_2_History_State_page2_18.d', e2.state);
      safeSetText(form, 'Petitioner_Employement_2_History_ZipCode_page2_18.e', e2.zip);
      safeSetText(form, 'Petitioner_Employement_2_History_Province_page2_18.f', e2.province);
      safeSetText(form, 'Petitioner_Employement_2_History_PostalCode_page2_18.g', e2.postal);
      safeSetText(form, 'Petitioner_Employement_2_History_Country_page2_18.h', e2.country);

      safeSetText(form, 'Petitioner_Employement_2_History_Occupation_page2_19', e2.occupation);
      safeSetText(form, 'Petitioner_Employement_2_History_Employment_Start_Date_page3_20.a', fmtDate(e2.from));
      safeSetText(form, 'Petitioner_Employement_2_History_Employment_End_Date_page3_20.b', fmtDate(e2.to));
    }
  }

  // 21–26. Petitioner other info (sex, dob, marital, birth)
  {
    if (petitioner.sex) {
      const s = String(petitioner.sex).toLowerCase();
      safeSelectRadio(
        form,
        'Petitioner_Other_Information_Sex_page3_21',
        s.startsWith('m')
          ? 'Petitioner_Other_Information_Sex_Checkbox_Male_page3_21'
          : 'Petitioner_Other_Information_Sex_Checkbox_Female_page3_21'
      );
    }

    safeSetText(form, 'Petitioner_Other_Information_Date_of_birth_page3_22', fmtDate(petitioner.dob));

    if (petitioner.maritalStatus) {
      const ms = String(petitioner.maritalStatus).toLowerCase();
      const MARITAL_EXPORT = {
        single: 'Petitioner_Marital_Status_Checkbox_Single_page3_23',
        married: 'Petitioner_Marital_Status_Checkbox_Married_page3_23',
        divorced: 'Petitioner_Marital_Status_Checkbox_Divorced_page3_23',
        widowed: 'Petitioner_Marital_Status_Checkbox_Widowed_page3_23',
      };
      if (MARITAL_EXPORT[ms]) {
        safeSelectRadio(form, 'Petitioner_Other_Information_Marital_Status_page3_23', MARITAL_EXPORT[ms]);
      }
    }

    safeSetText(form, 'Petitioner_Other_Information_City_Town_Village_Birth_page3_24', petitioner.cityBirth);
    safeSetText(form, 'Petitioner_Other_Information_Province_State_Birth_page3_25', petitioner.provinceBirth);
    safeSetText(form, 'Petitioner_Other_Information_Country_of_Birth_page3_26', petitioner.countryBirth);
  }

  // 27–36. Petitioner parents (uses petitioner.parents[0..1])
  {
    const p1 = Array.isArray(petitioner.parents) ? petitioner.parents[0] : null;
    const p2 = Array.isArray(petitioner.parents) ? petitioner.parents[1] : null;

    const P1_SEX_EXPORT = {
      male: 'Petitioner_Parent_1_Sex_Male_Checkbox_page3_28',
      female: 'Petitioner_Parent_1_Sex_Female_Checkbox_page3_28',
    };
    const P2_SEX_EXPORT = {
      male: 'Petitioner_Parent_2_Sex_Male_Checkbox_page3_33',
      female: 'Petitioner_Parent_2_Sex_Female_Checkbox_page3_33',
    };

    if (p1) {
      safeSetText(form, 'Petitioner_Parent_1_Family Name_page3_27.a', p1.lastName);
      safeSetText(form, 'Petitioner_Parent_1_Given Name_page3_27.b', p1.firstName);
      safeSetText(form, 'Petitioner_Parent_1_MiddleName_page3_27.c', p1.middleName);
      safeSetText(form, 'Petitioner_Parent_1_Date_of_Birth_page3_28', fmtDate(p1.dob));

      if (p1.sex) {
        const sx = String(p1.sex).toLowerCase().startsWith('m') ? 'male' : 'female';
        safeSelectRadio(form, 'Petitioner_Parent_1_Sex_Check_Male_Female_page3_29', P1_SEX_EXPORT[sx]);
      }

      safeSetText(form, 'Petitioner_Parent_1_CountryOfBirth_page3_30', p1.countryBirth);
      safeSetText(form, 'Petitioner_Parent_1_CityTownVillage_Residence_page3_31', p1.currentCityCountry);
      safeSetText(form, 'Petitioner_Parent_1_CountryOfResidence_page3_32', p1.currentCityCountry);
    }

    if (p2) {
      safeSetText(form, 'Petitioner_Parent_2_Family Name_page3_32.a', p2.lastName);
      safeSetText(form, 'Petitioner_Parent_2_Given Name_page3_32.b', p2.firstName);
      safeSetText(form, 'Petitioner_Parent_2_MiddleName_page3_32.c', p2.middleName);
      safeSetText(form, 'Petitioner_Parent_2_Date_of_Birth_page3_33', fmtDate(p2.dob));

      if (p2.sex) {
        const sx = String(p2.sex).toLowerCase().startsWith('m') ? 'male' : 'female';
        safeSelectRadio(form, 'Petitioner_Parent_2_Sex_Check_Male_Female_page3_34', P2_SEX_EXPORT[sx]);
      }

      safeSetText(form, 'Petitioner_Parent_2_CountryOfBirth_page3_35', p2.countryBirth);
      safeSetText(form, 'Petitioner_Parent_2_CityTownVillage_Residence_page3_36', p2.currentCityCountry);
      safeSetText(form, 'Petitioner_Parent_2_CountryOfResidence_page3_37', p2.currentCityCountry);
    }
  }

  // Naturalization certificate (your template naming)
  safeSetText(form, 'Petitioner_Certificate_Number_page4_42.a.', petitioner.natzNumber);
  safeSetText(form, 'Petitioner_Place_Of_Issuance_Number_page4_42.b', petitioner.natzPlace);
  safeSetText(form, 'Petitioner_Date_Of_Issuance_Number_page4_42.c', fmtDate(petitioner.natzDate));

  // -----------------------------
  // BENEFICIARY (basic + addresses)
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

  // Beneficiary other names (first entry)
  {
    const o = Array.isArray(beneficiary.otherNames) ? beneficiary.otherNames[0] : null;
    safeSetText(form, 'Beneficiary_Other_Names_Used_Family_Name_page4_10.a', o?.lastName);
    safeSetText(form, 'Beneficiary_Other_Names_Used_Given_Name_page4_10.b', o?.firstName);
    safeSetText(form, 'Beneficiary_Other_Names_Used_Middle_Name_page4_10.c', o?.middleName);
  }

  // Beneficiary mailing address
  {
    const m = beneficiary.mailing ?? {};
    safeSetText(form, 'Beneficiary_Mailing_Address_In_Care_of_Name_page5_11.a', m.inCareOf);
    safeSetText(form, 'Beneficiary_Mailing_Address_Street_Number_Name_page5_11.b', m.street);

    const unitType = pickUnitType(m.unitType);
    const BEN_MAIL_UNIT_EXPORT = {
      Apt: 'Beneficiary_Mailing_Address_Apt_Checkbox_page5_11.c.',
      Ste: 'Beneficiary_Mailing_Address_Suite_checkbox_page5_11.c.',
      Flr: 'Beneficiary_Mailing_Address_Floor_checkbox_page5_11.c.',
    };
    if (BEN_MAIL_UNIT_EXPORT[unitType]) {
      safeSelectRadio(
        form,
        'Beneficiary_Mailing_Address_In_Care_of_Apt_Ste_Flr_Number_page5_11.c',
        BEN_MAIL_UNIT_EXPORT[unitType]
      );
    }
    safeSetText(form, 'Beneficiary_Mailing_Address_In_Care_of__Apt_Ste_Flr_Number_of_Type_page5_11.c', m.unitNum);

    safeSetText(form, 'Beneficiary_Mailing_Address_In_Care_of_City_or_town_page5_11.d', m.city);
    safeSetText(form, 'Beneficiary_Mailing_Address_In_Care_of_State_page5_11.e', m.state);
    safeSetText(form, 'Beneficiary_Mailing_Address_In_Care_of_ZipCode_page5_11.f', m.zip);
    safeSetText(form, 'Beneficiary_Mailing_Address_In_Care_of_Province_page5_11.g', m.province);
    safeSetText(form, 'Beneficiary_Mailing_Address_In_Care_of_Postal_code_page5_11.h', m.postal);
    safeSetText(form, 'Beneficiary_Mailing_Address_In_Care_of_Country_page5_11.i', m.country);
  }

  // Beneficiary physical address abroad
  {
    const a = beneficiary.physicalAddress ?? {};
    safeSetText(form, 'Beneficiary_Physical_Address_Abroad_StreetNUmber_Name_page7_47.a', a.street);

    // Some templates have both a “type” text field and a radio + number field.
    safeSetText(form, 'Beneficiary_Physical_Address_Abroad_Apt_Ste_Flr_Number_field_page7_47.a', pickUnitType(a.unitType));

    const unitType = pickUnitType(a.unitType);
    const BEN_ABROAD_UNIT_EXPORT = {
      Apt: 'Beneficiary_Abroad_Address_Apt_Checkbox_page7_47.b',
      Ste: 'Beneficiary_Abroad_Address_Suite_checkbox_page7_47.b',
      Flr: 'Beneficiary_Abroad_Address_Floor_checkbox_page7_47.b',
    };
    if (BEN_ABROAD_UNIT_EXPORT[unitType]) {
      safeSelectRadio(
        form,
        'Beneficiary_Physical_Address_Abroad_Apt_Ste_Flr_NUmber_page7_47.b',
        BEN_ABROAD_UNIT_EXPORT[unitType]
      );
    }
    safeSetText(form, 'Beneficiary_Physical_Address_Abroad_Apt_Ste_Flr_Number_field_page7_47.b', a.unitNum);

    safeSetText(form, 'Beneficiary_Physical_Address_Abroad_City_Town_page7_47.c', a.city);
    safeSetText(form, 'Beneficiary_Physical_Address_Abroad_Province_page7_47.d', a.province);
  }

  // Beneficiary employment (uses beneficiary.employment[0..1])
  {
    const e1 = Array.isArray(beneficiary.employment) ? beneficiary.employment[0] : null;
    const e2 = Array.isArray(beneficiary.employment) ? beneficiary.employment[1] : null;

    const BEN_EMP1_UNIT_EXPORT = {
      Apt: 'Beneficiary_Employer_Address_Apt_Checkbox_page5_17.b.',
      Ste: 'Beneficiary_Employer_Address_Suite_checkbox_page5_17.b.',
      Flr: 'Beneficiary_Employer_Address_Floor_checkbox_page5_17.b.',
    };
    const BEN_EMP2_UNIT_EXPORT = {
      Apt: 'Beneficiary_Employer_Address_Apt_Checkbox_page6_21.b.',
      Ste: 'Beneficiary_Employer_Address_Suite_checkbox_page6_21.b.',
      Flr: 'Beneficiary_Employer_Address_Floor_checkbox_page6_21.b.',
    };

    if (e1) {
      safeSetText(form, 'Beneficiary_Employer_1_Name_page5_16', e1.employer);
      safeSetText(form, 'Beneficiary_Employer_Address_Street_Number_Name_page5_17.a', e1.street);

      const ut = pickUnitType(e1.unitType);
      if (BEN_EMP1_UNIT_EXPORT[ut]) {
        safeSelectRadio(form, 'Beneficiary_Employer_1_Addres_Apt_Ste_Flr_num_page5_17.b', BEN_EMP1_UNIT_EXPORT[ut]);
      }
      safeSetText(form, 'Beneficiary_Employer_Address_Apt_Suite_Floor_number_field_page5_17.b', e1.unitNum);

      safeSetText(form, 'Beneficiary_Employer_Address_City_Town_page5_17.c', e1.city);
      safeSetText(form, 'Beneficiary_Employer_Address_State_page5_17.d', e1.state);
      safeSetText(form, 'Beneficiary_Employer_Address_ZipCode_page5_17.e', e1.zip);

      safeSetText(form, 'Beneficiary_Employer_Occupation_page5_18', e1.occupation);
      safeSetText(form, 'Beneficiary_Employer_Start_Date_page5_19.a.', fmtDate(e1.from));
      safeSetText(form, 'Beneficiary_Employer_End_Date_page5_19.b', fmtDate(e1.to));
    }

    if (e2) {
      safeSetText(form, 'Beneficiary_Employer_2_Name_page6_20', e2.employer);
      safeSetText(form, 'Beneficiary_Employer_2_Address_Street_number_Name_page6_21.a', e2.street);

      const ut = pickUnitType(e2.unitType);
      if (BEN_EMP2_UNIT_EXPORT[ut]) {
        safeSelectRadio(form, 'Beneficiary_Employer_2_Addres_Apt_Ste_Flr_num_page6_21.b', BEN_EMP2_UNIT_EXPORT[ut]);
      }
      safeSetText(form, 'Beneficiary_Employer_2_Address_Apt_Ste_Flr_number_page6_21.b', e2.unitNum);

      safeSetText(form, 'Beneficiary_Employer_2_Address_City_or_Town_page6_21.c', e2.city);
      safeSetText(form, 'Beneficiary_Employer_2_Address_State_page6_21.d', e2.state);
      safeSetText(form, 'Beneficiary_Employer_2_Address_ZipCode_page6_21.e', e2.zip);

      safeSetText(form, 'Beneficiary_Employer_2_Occupation_page6_22', e2.occupation);
      safeSetText(form, 'Beneficiary_Employer_2_Start_Date_page6_23.a', fmtDate(e2.from));
      safeSetText(form, 'Beneficiary_Employer_2_End_Date_page6_23.b', fmtDate(e2.to));
    }
  }

  // Beneficiary parents (uses beneficiary.parents[0..1])
  {
    const p1 = Array.isArray(beneficiary.parents) ? beneficiary.parents[0] : null;
    const p2 = Array.isArray(beneficiary.parents) ? beneficiary.parents[1] : null;

    const B_P1_SEX_EXPORT = {
      male: 'Beneficiary_Parent_1_Sex_Check_Male_page6_25',
      female: 'Beneficiary_Parent_1_Sex_Check_Female_page6_25',
    };
    const B_P2_SEX_EXPORT = {
      male: 'Beneficiary_Parent_2_Sex_Check_Male_page6_30',
      female: 'Beneficiary_Parent_2_Sex_Check_Female_page6_30',
    };

    if (p1) {
      safeSetText(form, 'Beneficiary_Parent_1_Information_Family_Name_page6_24.a', p1.lastName);
      safeSetText(form, 'Beneficiary_Parent_1_Information_Given_Name_page6_24.b', p1.firstName);
      safeSetText(form, 'Beneficiary_Parent_1_Information_Middle_Name_page6_24.c', p1.middleName);
      safeSetText(form, 'Beneficiary_Parent_1_Information_Date_of_Birth_page6_25', fmtDate(p1.dob));
      if (p1.sex) {
        const sx = String(p1.sex).toLowerCase().startsWith('m') ? 'male' : 'female';
        safeSelectRadio(
          form,
          'Beneficiary_Parent_1_Information_Sex_Male_Female_Checkboxes_page6_26',
          B_P1_SEX_EXPORT[sx]
        );
      }
      safeSetText(form, 'Beneficiary_Parent_1_Information_Country_of_Birth_page6_27', p1.countryBirth);
      safeSetText(form, 'Beneficiary_Parent_1_Information_City_Town_Residence_page6_28', p1.currentCityCountry);
      safeSetText(form, 'Beneficiary_Parent_1_Information_Country_of_Residence_page6_29', p1.currentCityCountry);
    }

    if (p2) {
      safeSetText(form, 'Beneficiary_Parent_2_Information_Family_Name_page6_30.a', p2.lastName);
      safeSetText(form, 'Beneficiary_Parent_2_Information_Given_Name_page6_30.b', p2.firstName);
      safeSetText(form, 'Beneficiary_Parent_2_Information_Middle_Name_page6_30.c', p2.middleName);
      safeSetText(form, 'Beneficiary_Parent_2_Information_Date_of_Birth_page6_31', fmtDate(p2.dob));
      if (p2.sex) {
        const sx = String(p2.sex).toLowerCase().startsWith('m') ? 'male' : 'female';
        safeSelectRadio(
          form,
          'Beneficiary_Parent_2_Information_Sex_Male_Female_Checkboxes_page6_32',
          B_P2_SEX_EXPORT[sx]
        );
      }
      safeSetText(form, 'Beneficiary_Parent_2_Information_Country_of_Birth_page6_33', p2.countryBirth);
      safeSetText(form, 'Beneficiary_Parent_2_Information_City_Town_Residence_page6_34', p2.currentCityCountry);
      safeSetText(form, 'Beneficiary_Parent_2_Information_Country_of_Residence_page6_35', p2.currentCityCountry);
    }
  }

  // Beneficiary in-US / I-94 / passport section (template spread across page6 + page7)
  {
    const yn = yesNoToBool(beneficiary.inUS);
    if (yn !== null) {
      safeSelectRadio(
        form,
        'Beneficiary_Other_Information_Beneficiary_Been_In_US_Previously_checkboxes_Yes_No_page6_37',
        yn ? 'Beneficiary_Been_in_US_Yes_page6_37' : 'Beneficiary_Been_in_US_No_page6_37'
      );
    }

    safeSetText(form, 'Beneficiary_Other_Information_Beneficiary_Entered_as_page6_38.a', beneficiary.classOfAdmission);
    safeSetText(form, 'Beneficiary_Other_Information_Beneficiary_I94_page6_38.b', beneficiary.i94);
    safeSetText(form, 'Beneficiary_Other_Information_Beneficiary_Arrival_date_page6_38.c', fmtDate(beneficiary.arrivalDate));

    safeSetText(form, 'Beneficiary_Other_Information_Authorized_to_stay_until_page7_38.d', fmtDate(beneficiary.statusExpires));
    safeSetText(form, 'Beneficiary_Other_Information_Passport_Document_Number_page7_38.e', beneficiary.passportNumber);
    safeSetText(form, 'Beneficiary_Other_Information_Travel_Doc_Number_page7_38.f', beneficiary.travelDocNumber);
    safeSetText(form, 'Beneficiary_Other_Information_Passport_Country_of_Issuance_page7_38.g', beneficiary.passportCountry);
    safeSetText(form, 'Beneficiary_Other_Information_Passport_Expiration_date_page7_38.h', fmtDate(beneficiary.passportExpiration));
  }

  // -----------------------------
  // PART 5 — CONTACT INFO
  // -----------------------------
  safeSetText(form, 'Petitioners_Contact_Information_daytime_Phone_Number_page10_1', contact.phone);
  safeSetText(form, 'Petitioners_Contact_Information_Mobile_Phone_Number_page10_2', contact.mobile);
  safeSetText(form, 'Petitioners_Contact_Information_Email_Address_page10_3', contact.email);

  // -----------------------------
  // PART 6 — INTERPRETER
  // -----------------------------
  safeSetText(form, 'Interpreter_Last_Name_page10_1.a', interpreter.lastName);
  safeSetText(form, 'Interpreter_First_Name_page10_1.b', interpreter.firstName);
  safeSetText(form, 'Interpreter_Business_Org_page10_2', interpreter.business);
  safeSetText(form, 'Interpreter_Daytime_Phone_page10_3', interpreter.phone);
  safeSetText(form, 'Interpreter_Mobile_Phone_page10_4', interpreter.mobile);
  safeSetText(form, 'Interpreter_Email_page10_5', interpreter.email);
  safeSetText(form, 'Interpreter_Certification_Signature_Language_Field_page10', interpreter.language);
  safeSetText(form, 'Interpreter_Certification_Date_Of_Signature_page10_6', fmtDate(interpreter.dateSigned));

  // -----------------------------
  // PART 7 — PREPARER
  // -----------------------------
  safeSetText(form, 'Prepare_Last_Name_page11_1.a', preparer.lastName);
  safeSetText(form, 'Prepare_First_Name_page11_1.b', preparer.firstName);
  safeSetText(form, 'Prepare_Business_Org_page11_2', preparer.business);
  safeSetText(form, 'Prepare_Daytime_Phone_page11_3', preparer.phone);
  safeSetText(form, 'Prepare_Mobile_Phone_page11_4', preparer.mobile);
  safeSetText(form, 'Prepare_Email_page11_5', preparer.email);
  safeSetText(form, 'Preparer_Certification_Date_Of_Signature_page11_8', fmtDate(preparer.dateSigned));

  return true;
}
