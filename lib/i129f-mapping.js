// lib/i129f-mapping.js
// Map I-129F Wizard saved JSON -> pdf-lib AcroForm field names
// Supports multiple template naming styles (with/without ".a/.b/.c", etc.)

function fmtDate(v) {
  if (!v) return '';
  // Handles <input type="date"> values like 2026-01-25
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

function coalesce(...vals) {
  for (const v of vals) {
    const s = norm(v);
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

/**
 * Generate alias candidates for a PDF field name.
 * Helps when your template has variants like:
 *  - "..._8.a" vs "..._8"
 *  - "..._Num_7.b" vs "..._Num_7"
 *  - trailing "." differences
 */
function aliases(name) {
  const out = new Set();
  if (!name) return [];
  const n = String(name);

  out.add(n);
  out.add(n.replace(/\.$/, ''));

  // Remove trailing ".a" or ".a." style
  out.add(n.replace(/\.[a-z]\.?$/i, ''));

  // Remove patterns like "_Num_7.b" -> "_Num_7"
  out.add(n.replace(/_Num_(\d+)\.[a-z]\b/gi, '_Num_$1'));
  out.add(n.replace(/_Num_(\d+)\.[a-z]\./gi, '_Num_$1'));

  // Remove patterns like "page2_10.a" -> "page2_10"
  out.add(n.replace(/(page\d+_\d+)\.[a-z]\b/gi, '$1'));
  out.add(n.replace(/(page\d+_\d+)\.[a-z]\./gi, '$1'));
  out.add(n.replace(/(Page\d+_\d+)\.[a-z]\b/g, '$1'));
  out.add(n.replace(/(Page\d+_\d+)\.[a-z]\./g, '$1'));

  // Sometimes the PDF ended up dropping the suffix and the letter entirely:
  // "..._page1_8.d" -> "..._page1_8"
  out.add(n.replace(/(_page\d+_\d+)\.[a-z]\b/gi, '$1'));
  out.add(n.replace(/(_page\d+_\d+)\.[a-z]\./gi, '$1'));

  return [...out].filter(Boolean);
}

function trySetTextField(form, fieldName, value) {
  const val = norm(value);
  if (!val) return false;

  // Try alias variations
  for (const name of aliases(fieldName)) {
    try {
      // Best-case: text field
      form.getTextField(name).setText(val);
      return true;
    } catch {
      // Try generic field w/ setText (some templates are weird)
      try {
        const f = form.getField(name);
        if (f && typeof f.setText === 'function') {
          f.setText(val);
          return true;
        }
      } catch {
        // ignore
      }
    }
  }
  return false;
}

function trySelectRadio(form, groupName, exportValue) {
  if (!exportValue) return false;
  const ev = String(exportValue);

  for (const gn of aliases(groupName)) {
    try {
      form.getRadioGroup(gn).select(ev);
      return true;
    } catch {
      // ignore
    }
  }
  return false;
}

function yesNoToBool(v) {
  if (v === true) return true;
  if (v === false) return false;
  const s = String(v || '').trim().toLowerCase();
  if (['y', 'yes', 'true', '1'].includes(s)) return true;
  if (['n', 'no', 'false', '0'].includes(s)) return false;
  return null;
}

/**
 * Short debug list used by /api/i129f/load + mapping-check routes.
 * These should exist in your *current* PDF template.
 */
export const I129F_DEBUG_FIELD_LIST = [
  'Petitioner_Alien_Registration_page_1_Num_1',
  'Petitioner_USCIS_Online_Acct_Num_page_1_Num_2',
  'Petitioner_Social_Security_Num_page_1_Num_3',
  'Petitioner_Family_Name_Last_Name_page1_6a',
  'Petitioner_Given_Name_First_Name_page1_6b',
  'Petitioner_MiddleName_page1_6',
  'Petitioner_In_Care_of_Name_page1_8',
  'Petitioner_Street_Number_and_Name_Page1_8',
  'Petitioner_in_Care_of_City_or_Town_page1_8',
  'Petitioner_in_Care_of_State_page1_8',
  'Petitioner_in_Care_of_ZipCode_page1_8',
  'Beneficiary_Family_Name_Last_Name_page4_1',
  'Beneficiary_Given_Name_First_Name_page4_1',
  'Beneficiary_Middle_Name_page4_1',
  'Petitioners_Contact_Information_Email_Address_page10_3',
];

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
  trySetTextField(form, 'Petitioner_Alien_Registration_page_1_Num_1', petitioner.aNumber);
  trySetTextField(form, 'Petitioner_USCIS_Online_Acct_Num_page_1_Num_2', petitioner.uscisOnlineAccount);
  trySetTextField(form, 'Petitioner_Social_Security_Num_page_1_Num_3', petitioner.ssn);

  // 4. Classification (radio group)
  {
    const classification = String(petitioner.classification?.type ?? petitioner.classification ?? '')
      .trim()
      .toLowerCase();

    if (classification) {
      trySelectRadio(
        form,
        'Petitioner_Select_One_box_Classification_of_Beneficiary',
        classification === 'k3'
          ? 'Petitioner_Request_Beneficiary_K3_page_1_Num_4b'
          : 'Petitioner_Request_Beneficiary_K1_page_1_Num_4a'
      );
    }
  }

  // 5. If K-3, filed I-130? (radio group)
  {
    const yn = yesNoToBool(petitioner.classification?.i130Filed ?? petitioner.filedI130);
    if (yn !== null) {
      trySelectRadio(
        form,
        'Petitioner_Filing_K3_Visa_Check_Yes_No_page_1_number5',
        yn ? 'Petitioner_Filing_K3_Filed_I130__Yes' : 'Petitioner_Filing_K3_Filed_I130__No'
      );
    }
  }

  // 6. Name
  trySetTextField(form, 'Petitioner_Family_Name_Last_Name_page1_6a', petitioner.lastName);
  trySetTextField(form, 'Petitioner_Given_Name_First_Name_page1_6b', petitioner.firstName);
  trySetTextField(form, 'Petitioner_MiddleName_page1_6.c', petitioner.middleName); // alias helper also tries without ".c"
  trySetTextField(form, 'Petitioner_MiddleName_page1_6', petitioner.middleName);

  // 7. Other names (first entry)
  {
    const o = Array.isArray(petitioner.otherNames) ? petitioner.otherNames[0] : null;
    trySetTextField(form, 'Petitioner_Other_Names_Used_Family_Name_page_1_Num_7a', o?.lastName);
    trySetTextField(form, 'Petitioner_Other_Names_Used_Given_Name_page_1_Num_7.b', o?.firstName);
    trySetTextField(form, 'Petitioner_Other_Names_Used_Given_Name_page_1_Num_7', o?.firstName);
    trySetTextField(form, 'Petitioner_Other_Names_Used_Middle_Name_page_1_Num_7.c', o?.middleName);
    trySetTextField(form, 'Petitioner_Other_Names_Used_Middle_Name_page_1_Num_7', o?.middleName);
  }

  // 8. Mailing address
  {
    const m = petitioner.mailing ?? {};
    const unitNum = coalesce(m.unitNum, m.unitNumber);

    trySetTextField(form, 'Petitioner_In_Care_of_Name_page1_8.a', m.inCareOf);
    trySetTextField(form, 'Petitioner_In_Care_of_Name_page1_8', m.inCareOf);

    trySetTextField(form, 'Petitioner_Street_Number_and_Name_Page1_8.b', m.street);
    trySetTextField(form, 'Petitioner_Street_Number_and_Name_Page1_8', m.street);

    // Unit type (radio group)
    const unitType = pickUnitType(m.unitType);
    const PET_UNIT_EXPORT = {
      Apt: 'Petitioner_in_care_of_Apt_Checkbox_Page1_8.c.',
      Ste: 'Petitioner_in_care_of_Ste_Checkbox_Page1_8.c.',
      Flr: 'Petitioner_in_care_of_Flr_Checkbox_Page1_8.c.',
    };
    if (PET_UNIT_EXPORT[unitType]) {
      trySelectRadio(
        form,
        'Petitioner_ In_Care_of_Apt_Ste_Flr_Num_Question_page1_8.c',
        PET_UNIT_EXPORT[unitType]
      );
      trySelectRadio(
        form,
        'Petitioner_ In_Care_of_Apt_Ste_Flr_Num_Question_page1_8',
        PET_UNIT_EXPORT[unitType]
      );
    }

    trySetTextField(form, 'Petitioner_in_care_of_APt_Ste_Flr_number_Page1_8.c', unitNum);
    trySetTextField(form, 'Petitioner_in_care_of_APt_Ste_Flr_number_Page1_8', unitNum);

    trySetTextField(form, 'Petitioner_in_Care_of_City_or_Town_page1_8.d', m.city);
    trySetTextField(form, 'Petitioner_in_Care_of_City_or_Town_page1_8', m.city);

    trySetTextField(form, 'Petitioner_in_Care_of_State_page1_8.e', m.state);
    trySetTextField(form, 'Petitioner_in_Care_of_State_page1_8', m.state);

    trySetTextField(form, 'Petitioner_in_Care_of_ZipCode_page1_8.f', m.zip);
    trySetTextField(form, 'Petitioner_in_Care_of_ZipCode_page1_8', m.zip);

    trySetTextField(form, 'Petitioner_in_Care_of_Province_page1_8.g', m.province);
    trySetTextField(form, 'Petitioner_in_Care_of_Postal_Code_page1_8.h', m.postal);
    trySetTextField(form, 'Petitioner_in_Care_of_Country_page1_8.i', m.country);
    trySetTextField(form, 'Petitioner_in_Care_of_Country_page1_8', m.country);

    // 8.j same as physical (yes/no group)
    const same = yesNoToBool(m.sameAsPhysical);
    if (same !== null) {
      trySelectRadio(
        form,
        'Petitioner_is_mailing_address_same_as_physical_address_check_yes_or_no_page1_8.j',
        same
          ? 'Petitioner_Mailing_Adress_Same_as_physical_checkbox_Yes_page1_8.j'
          : 'Petitioner_Mailing_Adress_Same_as_physical_checkbox_No_page1_8.j'
      );
      trySelectRadio(
        form,
        'Petitioner_is_mailing_address_same_as_physical_address_check_yes_or_no_page1_8',
        same
          ? 'Petitioner_Mailing_Adress_Same_as_physical_checkbox_Yes_page1_8.j'
          : 'Petitioner_Mailing_Adress_Same_as_physical_checkbox_No_page1_8.j'
      );
    }
  }

  // 9–12. Address history (petitioner.physicalAddresses[0..1])
  {
    const a1 = Array.isArray(petitioner.physicalAddresses) ? petitioner.physicalAddresses[0] : null;
    const a2 = Array.isArray(petitioner.physicalAddresses) ? petitioner.physicalAddresses[1] : null;

    if (a1) {
      trySetTextField(form, 'Petitioner_Address_1_History_Street_Numb_and_name_page2_9.a', a1.street);
      trySetTextField(form, 'Petitioner_Address_1_History_Street_Numb_and_name_page2_9', a1.street);

      trySetTextField(
        form,
        'Petitioner_Address_1_History_Apt_Suite_Floor_Number_Page2_9.b',
        coalesce(a1.unitNum, a1.unitNumber)
      );
      trySetTextField(
        form,
        'Petitioner_Address_1_History_Apt_Suite_Floor_Number_Page2_9',
        coalesce(a1.unitNum, a1.unitNumber)
      );

      trySetTextField(form, 'Petitioner_Address_1_History_City_or_town_page2_9.c', a1.city);
      trySetTextField(form, 'Petitioner_Address_1_History_City_or_town_page2_9', a1.city);

      trySetTextField(form, 'Petitioner_Address_1_History_State_page2_9.d', a1.state);
      trySetTextField(form, 'Petitioner_Address_1_History_State_page2_9', a1.state);

      trySetTextField(form, 'Petitioner_Address_1_History_ZipCode_page2_9.e', a1.zip);
      trySetTextField(form, 'Petitioner_Address_1_History_ZipCode_page2_9', a1.zip);

      trySetTextField(form, 'Petitioner_Address_1_History_Country_page2_9.h', a1.country);
      trySetTextField(form, 'Petitioner_Address_1_History_Country_page2_9', a1.country);

      trySetTextField(form, 'Petitioner_Address_1_History_DateFrom_page2_10.a', fmtDate(a1.from));
      trySetTextField(form, 'Petitioner_Address_1_History_DateFrom_page2_10', fmtDate(a1.from));

      trySetTextField(form, 'Petitioner_Address_1_History_DateTo_page2_10.b', fmtDate(a1.to));
      trySetTextField(form, 'Petitioner_Address_1_History_DateTo_page2_10', fmtDate(a1.to));
    }

    if (a2) {
      trySetTextField(form, 'Petitioner_Address_2_History_Street_Numb_and_name_page2_11.a', a2.street);
      trySetTextField(form, 'Petitioner_Address_2_History_Street_Numb_and_name_page2_11', a2.street);

      trySetTextField(
        form,
        'Petitioner_Address_2_History_Apt_Suite_Floor_Number_Page2_11.b',
        coalesce(a2.unitNum, a2.unitNumber)
      );
      trySetTextField(
        form,
        'Petitioner_Address_2_History_Apt_Suite_Floor_Number_Page2_11',
        coalesce(a2.unitNum, a2.unitNumber)
      );

      trySetTextField(form, 'Petitioner_Address_2_History_City_or_town_page2_11.c', a2.city);
      trySetTextField(form, 'Petitioner_Address_2_History_City_or_town_page2_11', a2.city);

      trySetTextField(form, 'Petitioner_Address_2_History_State_page2_11.d', a2.state);
      trySetTextField(form, 'Petitioner_Address_2_History_State_page2_11', a2.state);

      trySetTextField(form, 'Petitioner_Address_2_History_ZipCode_page2_11.e', a2.zip);
      trySetTextField(form, 'Petitioner_Address_2_History_ZipCode_page2_11', a2.zip);

      trySetTextField(form, 'Petitioner_Address_2_History_Country_page2_11.h', a2.country);
      trySetTextField(form, 'Petitioner_Address_2_History_Country_page2_11', a2.country);

      trySetTextField(form, 'Petitioner_Address_2_History_DateFrom_page2_12.a', fmtDate(a2.from));
      trySetTextField(form, 'Petitioner_Address_2_History_DateFrom_page2_12', fmtDate(a2.from));

      trySetTextField(form, 'Petitioner_Address_2_History_DateTo_page2_12.b', fmtDate(a2.to));
      trySetTextField(form, 'Petitioner_Address_2_History_DateTo_page2_12', fmtDate(a2.to));
    }
  }

  // 13–20. Employment history (petitioner.employment[0..1])
  {
    const e1 = Array.isArray(petitioner.employment) ? petitioner.employment[0] : null;
    const e2 = Array.isArray(petitioner.employment) ? petitioner.employment[1] : null;

    if (e1) {
      trySetTextField(form, 'Petitioner_employment_History_1_NameOfEmployer_page2_13', e1.employer);
      trySetTextField(form, 'Petitioner_Employement_1_History_StreetNumber_or_name_page2_14.a', e1.street);
      trySetTextField(form, 'Petitioner_Employement_1_History_StreetNumber_or_name_page2_14', e1.street);

      trySetTextField(
        form,
        'Petitioner_Employment_History_1_AptSteFlr_Number_Page2_14.b',
        coalesce(e1.unitNum, e1.unitNumber)
      );
      trySetTextField(
        form,
        'Petitioner_Employment_History_1_AptSteFlr_Number_Page2_14',
        coalesce(e1.unitNum, e1.unitNumber)
      );

      trySetTextField(form, 'Petitioner_Employement_1_History_City_or_town_page2_14.c', e1.city);
      trySetTextField(form, 'Petitioner_Employement_1_History_City_or_town_page2_14', e1.city);

      trySetTextField(form, 'Petitioner_Employement_1_History_State_page2_14.d', e1.state);
      trySetTextField(form, 'Petitioner_Employement_1_History_State_page2_14', e1.state);

      trySetTextField(form, 'Petitioner_Employement_1_History_ZipCode_page2_14.e', e1.zip);
      trySetTextField(form, 'Petitioner_Employement_1_History_ZipCode_page2_14', e1.zip);

      trySetTextField(form, 'Petitioner_Employement_1_History_Country_page2_14.h', e1.country);
      trySetTextField(form, 'Petitioner_Employement_1_History_Country_page2_14', e1.country);

      trySetTextField(form, 'Petitioner_Employement_1_History_Occupation_page2_15', e1.occupation);
      trySetTextField(form, 'Petitioner_Employement_1_History_Start_Date_page2_16.a', fmtDate(e1.from));
      trySetTextField(form, 'Petitioner_Employement_1_History_Start_Date_page2_16', fmtDate(e1.from));
      trySetTextField(form, 'Petitioner_Employement_1_History_End_Date_page2_16.b', fmtDate(e1.to));
      trySetTextField(form, 'Petitioner_Employement_1_History_End_Date_page2_16', fmtDate(e1.to));
    }

    if (e2) {
      trySetTextField(form, 'Petitioner_employment_History_2_NameOfEmployer_page2_18', e2.employer);
      trySetTextField(form, 'Petitioner_Employement_2_History_StreetNumber_or_name_page2_18.a', e2.street);
      trySetTextField(form, 'Petitioner_Employement_2_History_StreetNumber_or_name_page2_18', e2.street);

      trySetTextField(
        form,
        'Petitioner_Employment_History_2_AptSteFlr_Number_Page2_18.b',
        coalesce(e2.unitNum, e2.unitNumber)
      );
      trySetTextField(
        form,
        'Petitioner_Employment_History_2_AptSteFlr_Number_Page2_18',
        coalesce(e2.unitNum, e2.unitNumber)
      );

      trySetTextField(form, 'Petitioner_Employement_2_History_City_or_town_page2_18.c', e2.city);
      trySetTextField(form, 'Petitioner_Employement_2_History_City_or_town_page2_18', e2.city);

      trySetTextField(form, 'Petitioner_Employement_2_History_State_page2_18.d', e2.state);
      trySetTextField(form, 'Petitioner_Employement_2_History_State_page2_18', e2.state);

      trySetTextField(form, 'Petitioner_Employement_2_History_ZipCode_page2_18.e', e2.zip);
      trySetTextField(form, 'Petitioner_Employement_2_History_ZipCode_page2_18', e2.zip);

      trySetTextField(form, 'Petitioner_Employement_2_History_Country_page2_18.h', e2.country);
      trySetTextField(form, 'Petitioner_Employement_2_History_Country_page2_18', e2.country);

      trySetTextField(form, 'Petitioner_Employement_2_History_Occupation_page2_19', e2.occupation);
      trySetTextField(form, 'Petitioner_Employement_2_History_Employment_Start_Date_page3_20.a', fmtDate(e2.from));
      trySetTextField(form, 'Petitioner_Employement_2_History_Employment_Start_Date_page3_20', fmtDate(e2.from));
      trySetTextField(form, 'Petitioner_Employement_2_History_Employment_End_Date_page3_20.b', fmtDate(e2.to));
      trySetTextField(form, 'Petitioner_Employement_2_History_Employment_End_Date_page3_20', fmtDate(e2.to));
    }
  }

  // Parents (petitioner.parents[0..1])
  {
    const p1 = Array.isArray(petitioner.parents) ? petitioner.parents[0] : null;
    const p2 = Array.isArray(petitioner.parents) ? petitioner.parents[1] : null;

    if (p1) {
      trySetTextField(form, 'Petitioner_Parent_1_Family Name_page3_27.a', p1.lastName);
      trySetTextField(form, 'Petitioner_Parent_1_Family Name_page3_27', p1.lastName);

      trySetTextField(form, 'Petitioner_Parent_1_Given Name_page3_27.b', p1.firstName);
      trySetTextField(form, 'Petitioner_Parent_1_GivenName_page3_27', p1.firstName);

      trySetTextField(form, 'Petitioner_Parent_1_MiddleName_page3_27.c', p1.middleName);
      trySetTextField(form, 'Petitioner_Parent_1_MiddleName_page3_27', p1.middleName);

      trySetTextField(form, 'Petitioner_Parent_1_Date_of_Birth_page3_28', fmtDate(p1.dob));
      trySetTextField(form, 'Petitioner_Parent_1_DateOfBirth_page3_28', fmtDate(p1.dob));

      trySetTextField(form, 'Petitioner_Parent_1_CountryOfBirth_page3_30', p1.countryBirth);
      trySetTextField(form, 'Petitioner_Parent_1_CityTownVillage_Residence_page3_31', p1.currentCityCountry);
      trySetTextField(form, 'Petitioner_Parent_1_CountryOfResidence_page3_32', p1.currentCityCountry);
      trySetTextField(form, 'Petitioner_Parent_1_Country_Residence_page3_31', p1.currentCityCountry);
    }

    if (p2) {
      trySetTextField(form, 'Petitioner_Parent_2_Family Name_page3_32.a', p2.lastName);
      trySetTextField(form, 'Petitioner_Parent_2_Family Name_page3_32', p2.lastName);

      trySetTextField(form, 'Petitioner_Parent_2_Given Name_page3_32.b', p2.firstName);
      trySetTextField(form, 'Petitioner_Parent_2_GivenName_page3_32', p2.firstName);

      trySetTextField(form, 'Petitioner_Parent_2_MiddleName_page3_32.c', p2.middleName);
      trySetTextField(form, 'Petitioner_Parent_2_MiddleName_page3_32', p2.middleName);

      trySetTextField(form, 'Petitioner_Parent_2_Date_of_Birth_page3_33', fmtDate(p2.dob));
      trySetTextField(form, 'Petitioner_Parent_2_DateOfBirth_page3_33', fmtDate(p2.dob));

      trySetTextField(form, 'Petitioner_Parent_2_CountryOfBirth_page3_35', p2.countryBirth);
      trySetTextField(form, 'Petitioner_Parent_2_CityTownVillage_Residence_page3_36', p2.currentCityCountry);
      trySetTextField(form, 'Petitioner_Parent_2_CountryOfResidence_page3_37', p2.currentCityCountry);
      trySetTextField(form, 'Petitioner_Parent_2_Country_Residence_page3_36', p2.currentCityCountry);
    }
  }

  // Citizenship / Naturalization Certificate (from wizard: petitioner.citizenship.*)
  {
    const c = petitioner.citizenship ?? {};
    trySetTextField(
      form,
      'Petitioner_Certificate_Number_page4_42.a.',
      coalesce(c.natzCertificate, petitioner.natzNumber)
    );
    trySetTextField(
      form,
      'Petitioner_Certificate_Number_page4_42',
      coalesce(c.natzCertificate, petitioner.natzNumber)
    );

    trySetTextField(
      form,
      'Petitioner_Place_Of_Issuance_Number_page4_42.b',
      coalesce(c.natzPlace, petitioner.natzPlace)
    );
    trySetTextField(
      form,
      'Petitioner_Place_Of_Issuance_Number_page4_42',
      coalesce(c.natzPlace, petitioner.natzPlace)
    );

    trySetTextField(
      form,
      'Petitioner_Date_Of_Issuance_Number_page4_42.c',
      fmtDate(coalesce(c.natzDate, petitioner.natzDate))
    );
    trySetTextField(
      form,
      'Petitioner_Date_Of_Issuance_Number_page4_42',
      fmtDate(coalesce(c.natzDate, petitioner.natzDate))
    );
  }

  // -----------------------------
  // BENEFICIARY (Wizard Part 2+)
  // -----------------------------
  trySetTextField(form, 'Beneficiary_Family_Name_Last_Name_page4_1.a', beneficiary.lastName);
  trySetTextField(form, 'Beneficiary_Family_Name_Last_Name_page4_1', beneficiary.lastName);

  trySetTextField(form, 'Beneficiary_Given_Name_First_Name_page4_1.b', beneficiary.firstName);
  trySetTextField(form, 'Beneficiary_Given_Name_First_Name_page4_1', beneficiary.firstName);

  trySetTextField(form, 'Beneficiary_Middle_Name_page4_1.c', beneficiary.middleName);
  trySetTextField(form, 'Beneficiary_Middle_Name_page4_1', beneficiary.middleName);

  trySetTextField(form, 'Beneficiary_A_Number_if_any_page4_2', beneficiary.aNumber);

  // SSN field name varies across templates; try a few
  trySetTextField(form, 'Beneficiary_Social_Security_Number_page4_3', beneficiary.ssn);
  trySetTextField(form, 'Beneficiary_Social_Security_Number_page4_3.', beneficiary.ssn);

  trySetTextField(form, 'Beneficiary_Date_Of_Birth_page4_4', fmtDate(beneficiary.dob));
  trySetTextField(form, 'Beneficiary_City_Town_Village_Birth_page4_5', beneficiary.cityBirth);
  trySetTextField(form, 'Beneficiary_City_Town_Village_Birth_page4_7', beneficiary.cityBirth);

  trySetTextField(form, 'Beneficiary_CountryOfBirth_page4_6', beneficiary.countryBirth);
  trySetTextField(form, 'Beneficiary_Country_Birth_page4_8', beneficiary.countryBirth);

  trySetTextField(form, 'Beneficiary_Citizenship_Country_page4_9', beneficiary.nationality);

  // Other names (first entry)
  {
    const o = Array.isArray(beneficiary.otherNames) ? beneficiary.otherNames[0] : null;
    trySetTextField(form, 'Beneficiary_Other_Names_Used_Family_Name_page4_10.a', o?.lastName);
    trySetTextField(form, 'Beneficiary_Other_Names_Used_Family_Name_page4_10', o?.lastName);

    trySetTextField(form, 'Beneficiary_Other_Names_Used_Given_Name_page4_10.b', o?.firstName);
    trySetTextField(form, 'Beneficiary_Other_Names_Used_Given_Name_page4_10', o?.firstName);

    trySetTextField(form, 'Beneficiary_Other_Names_Used_Middle_Name_page4_10.c', o?.middleName);
    trySetTextField(form, 'Beneficiary_Other_Names_Used_Middle_Name_page4_10', o?.middleName);
  }

  // Beneficiary mailing address
  {
    const m = beneficiary.mailing ?? {};
    const unitNum = coalesce(m.unitNum, m.unitNumber);

    trySetTextField(form, 'Beneficiary_Mailing_Address_In_Care_of_Name_page5_11.a', m.inCareOf);
    trySetTextField(form, 'Beneficiary_Mailing_Address_In_Care_of_Name_page5_11', m.inCareOf);

    // street field name differs
    trySetTextField(form, 'Beneficiary_Mailing_Address_Street_Number_Name_page5_11.b', m.street);
    trySetTextField(form, 'Beneficiary_Mailing_Address_In_Care_of_StreetNumber_Name_page5_11', m.street);

    // unit number text field
    trySetTextField(form, 'Beneficiary_Mailing_Address_In_Care_of__Apt_Ste_Flr_Number_of_Type_page5_11.c', unitNum);
    trySetTextField(form, 'Beneficiary_Mailing_Address_In_Care_of__Apt_Ste_Flr_Number_of_Type_page5_11', unitNum);

    trySetTextField(form, 'Beneficiary_Mailing_Address_In_Care_of_City_or_town_page5_11.d', m.city);
    trySetTextField(form, 'Beneficiary_Mailing_Address_In_Care_of_City_Or_town_page5_11', m.city);

    trySetTextField(form, 'Beneficiary_Mailing_Address_In_Care_of_State_page5_11.e', m.state);
    trySetTextField(form, 'Beneficiary_Mailing_Address_In_Care_of_State_page5_11', m.state);

    trySetTextField(form, 'Beneficiary_Mailing_Address_In_Care_of_ZipCode_page5_11.f', m.zip);
    trySetTextField(form, 'Beneficiary_Mailing_Address_In_Care_of_Zipcode_page5_11', m.zip);

    trySetTextField(form, 'Beneficiary_Mailing_Address_In_Care_of_Country_page5_11.i', m.country);
    trySetTextField(form, 'Beneficiary_Mailing_Address_In_Care_of_Country_page5_11', m.country);
  }

  // Beneficiary in-US / I-94 / passport section
  {
    const yn = yesNoToBool(beneficiary.inUS);
    if (yn !== null) {
      // export values can vary; many templates use appearance-state names.
      // We try common legacy exports first; if your PDF uses different export values,
      // this won't break, it just won't select the radio.
      trySelectRadio(
        form,
        'Beneficiary_Other_Information_Beneficiary_Been_In_US_Previously_checkboxes_Yes_No_page6_37',
        yn
          ? 'Beneficiary_Other_Information_Beneficiary_Been_In_US_Previously_checkbox_Yes_page6_37'
          : 'Beneficiary_Other_Information_Beneficiary_Been_In_US_Previously_checkbox_No_page6_37'
      );
    }

    trySetTextField(
      form,
      'Beneficiary_Other_Information_Beneficiary_Entered_as_page6_38.a',
      beneficiary.classOfAdmission
    );
    trySetTextField(
      form,
      'Beneficiary_Other_Information_Beneficiary_Currently_In_US_EnteredAS_page6_38',
      beneficiary.classOfAdmission
    );

    trySetTextField(form, 'Beneficiary_Other_Information_Beneficiary_I94_page6_38.b', beneficiary.i94);
    trySetTextField(
      form,
      'Beneficiary_Other_Information_Beneficiary_Currently_In_US_I94_Arrival_Departure_Num_page6_38',
      beneficiary.i94
    );

    trySetTextField(
      form,
      'Beneficiary_Other_Information_Beneficiary_Arrival_date_page6_38.c',
      fmtDate(beneficiary.arrivalDate)
    );
    trySetTextField(
      form,
      'Beneficiary_Other_Information_Beneficiary_Currently_In_US_Date_Of_Arrival_page6_38',
      fmtDate(beneficiary.arrivalDate)
    );

    trySetTextField(
      form,
      'Beneficiary_Other_Information_Authorized_to_stay_until_page7_38.d',
      fmtDate(beneficiary.statusExpires)
    );
    trySetTextField(
      form,
      'Beneficiary_Other_Information_Beneficiary_Currently_In_US_Date_Of_Expiration_Shown_I94_I95_page7_38',
      fmtDate(beneficiary.statusExpires)
    );

    trySetTextField(
      form,
      'Beneficiary_Other_Information_Passport_Document_Number_page7_38.e',
      beneficiary.passportNumber
    );
    trySetTextField(
      form,
      'Beneficiary_Other_Information_Beneficiary_Currently_In_US_Passport_Number_page7_38',
      beneficiary.passportNumber
    );

    trySetTextField(form, 'Beneficiary_Other_Information_Travel_Doc_Number_page7_38.f', beneficiary.travelDocNumber);
    trySetTextField(
      form,
      'Beneficiary_Other_Information_Beneficiary_Currently_In_US_Travel_Doucment_Number_page7_38',
      beneficiary.travelDocNumber
    );

    trySetTextField(form, 'Beneficiary_Other_Information_Passport_Country_of_Issuance_page7_38.g', beneficiary.passportCountry);
    trySetTextField(
      form,
      'Beneficiary_Other_Information_Beneficiary_Currently_In_US_Travel_Country_Issuance_Passport_or_travel_Document_page7_38',
      beneficiary.passportCountry
    );

    trySetTextField(
      form,
      'Beneficiary_Other_Information_Passport_Expiration_date_page7_38.h',
      fmtDate(beneficiary.passportExpiration)
    );
    trySetTextField(
      form,
      'Beneficiary_Other_Information_Beneficiary_Currently_In_US_Travel_EExpiration_Date_Issuance_Passport_or_travel_Document_page7_38',
      fmtDate(beneficiary.passportExpiration)
    );
  }

  // -----------------------------
  // PART 5 — CONTACT INFO
  // -----------------------------
  trySetTextField(form, 'Petitioners_Contact_Information_daytime_Phone_Number_page10_1', coalesce(contact.daytimePhone, contact.phone));
  trySetTextField(form, 'Petitioners_Contact_Information_Mobile_Phone_Number_page10_2', coalesce(contact.mobile, contact.cell, contact.mobilePhone));
  trySetTextField(form, 'Petitioners_Contact_Information_Email_Address_page10_3', contact.email);

  // -----------------------------
  // PART 6 — INTERPRETER (your PDF uses "Interpreter_Contact_Information_*")
  // -----------------------------
  trySetTextField(form, 'Interpreter_Last_Name_page10_1.a', interpreter.lastName);
  trySetTextField(form, 'Interpreter_Contact_Information_Family_Name_page10_1', interpreter.lastName);

  trySetTextField(form, 'Interpreter_First_Name_page10_1.b', interpreter.firstName);
  trySetTextField(form, 'Interpreter_Contact_Information_Given_Name_page10_1', interpreter.firstName);

  trySetTextField(form, 'Interpreter_Business_Org_page10_2', interpreter.business);
  trySetTextField(form, 'Interpreter_Contact_Information_Business_Organization_Name_page10_2', interpreter.business);

  trySetTextField(form, 'Interpreter_Daytime_Phone_page10_3', interpreter.phone);
  trySetTextField(form, 'Interpreter_Contact_Information_Daytime_Phone_page10_3', interpreter.phone);

  trySetTextField(form, 'Interpreter_Mobile_Phone_page10_4', interpreter.mobile);
  trySetTextField(form, 'Interpreter_Contact_Information_Mobile_Phone_page10_4', interpreter.mobile);

  trySetTextField(form, 'Interpreter_Email_page10_5', interpreter.email);
  trySetTextField(form, 'Interpreter_Contact_Information_Email_Address_page10_5', interpreter.email);

  // Date signed (wizard uses signDate)
  trySetTextField(form, 'Interpreter_Certification_Date_Of_Signature_page10_6', fmtDate(coalesce(interpreter.signDate, interpreter.dateSigned)));

  // -----------------------------
  // PART 7 — PREPARER (your PDF uses "Prepare_*")
  // -----------------------------
  trySetTextField(form, 'Prepare_Last_Name_page11_1.a', preparer.lastName);
  trySetTextField(form, 'Prepare_Full_Name_Family_Name_page10_1', preparer.lastName);

  trySetTextField(form, 'Prepare_First_Name_page11_1.b', preparer.firstName);
  trySetTextField(form, 'Prepare_Full_Name_First_Name_page10_1', preparer.firstName);

  trySetTextField(form, 'Prepare_Business_Org_page11_2', preparer.business);
  trySetTextField(form, 'Prepare_Full_Name_Business_Organization_page10_2', preparer.business);

  trySetTextField(form, 'Prepare_Daytime_Phone_page11_3', preparer.phone);
  trySetTextField(form, 'Prepare_Contact_Information_Daytime_Phone_Number_page10_3', preparer.phone);

  trySetTextField(form, 'Prepare_Mobile_Phone_page11_4', preparer.mobile);
  trySetTextField(form, 'Prepare_Contact_Information_Mobile_Phone_Number_page10_4', preparer.mobile);

  trySetTextField(form, 'Prepare_Email_page11_5', preparer.email);
  trySetTextField(form, 'Prepare_Contact_Information_Email_Address_page10_5', preparer.email);

  trySetTextField(form, 'Preparer_Certification_Date_Of_Signature_page11_8', fmtDate(coalesce(preparer.signDate, preparer.dateSigned)));
  trySetTextField(form, 'Prepare_Date_Of_Signature_page11_6', fmtDate(coalesce(preparer.signDate, preparer.dateSigned)));

  return true;
}
