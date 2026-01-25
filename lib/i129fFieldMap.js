// lib/i129fFieldMap.js
//
// Field names match YOUR labeled PDF field names (from i-129f_Names_Fields.pdf.xlsx).
// If you relabel the PDF again, you must update this file.

export const I129F_FIELD_MAP = {
  // Text fields (single name or array of names if your PDF has multiple “number” targets)
  text: {
    // Page 1 — IDs
    petitioner_alien_number: 'Petitioner_Alien_Registration_page_1_Num_1',
    petitioner_uscis_online_acct: 'Petitioner_USCIS_Online_Acct_Num_page_1_Num_2',
    petitioner_ssn: 'Petitioner_Social_Security_Num_page_1_Num_3',

    // Page 1 — Petitioner name
    petitioner_last: 'Petitioner_Family_Name_Last_Name_page1_6a',
    petitioner_first: 'Petitioner_Given_Name_First_Name_page1_6b',
    petitioner_middle: 'Petitioner_MiddleName_page1_6.c',

    // Page 1 — Other names used
    petitioner_other_last: 'Petitioner_Other_Names_Used_Family_Name_page_1_Num_7a',
    petitioner_other_first: 'Petitioner_Other_Names_Used_Given_Name_page_1_Num_7.b.',
    petitioner_other_middle: 'Petitioner_Other_Names_Used_Middle_Name_page_1_Num_7.c.',

    // Page 1 — Mailing address
    mail_in_care_of: 'Petitioner_In_Care_of_Name_page1_8.a',
    mail_street: 'Petitioner_Street_Number_and_Name_Page1_8.b.',
    mail_unit_number: 'Petitioner_in_care_of_APt_Ste_Flr_number_Page1_8.c.',
    mail_city: 'Petitioner_in_Care_of_City_or_Town_page1_8.d',
    mail_state: 'Petitioner_in_Care_of_State_page1_8.e',
    mail_zip: 'Petitioner_in_Care_of_ZipCode_page1_8.f',
    mail_province: 'Petitioner_in_Care_of_Province_page1_8.g',
    mail_postal: 'Petitioner_in_Care_of_Postal_Code_page1_8.h',
    mail_country: 'Petitioner_in_Care_of_Country_page1_8.i',

    // Page 2 — Physical address history #1
    phys1_street: 'Petitioner_Address_1_History_Street_Numb_and_name_page2_9.a',
    phys1_unit_number: 'Petitioner_Address_1_History_Apt_Suite_Floor_Number_Page2_9.b',
    phys1_city: 'Petitioner_Address_1_History_City_or_town_page2_9.c',
    phys1_state: 'Petitioner_Address_1_History_State_page2_9.d',
    phys1_zip: 'Petitioner_Address_1_History_ZipCode_page2_9.e',
    phys1_province: 'Petitioner_Address_1_History_Province_page2_9.f',
    phys1_postal: 'Petitioner_Address_1_History_PostalCode_page2_9.g',
    phys1_country: 'Petitioner_Address_1_History_Country_page2_9.h',

    // Page 2 — Physical address history #2
    phys2_street: 'Petitioner_Address_2_History_Street_Numb_and_name_page2_11.a',
    phys2_unit_number: 'Petitioner_Address_2_History_Apt_Suite_Floor_Number_Page2_11.b',
    phys2_city: 'Petitioner_Address_2_History_City_or_town_page2_11.c',
    phys2_state: 'Petitioner_Address_2_History_State_page2_11.d',
    phys2_zip: 'Petitioner_Address_2_History_ZipCode_page2_11.e',
    phys2_province: 'Petitioner_Address_2_History_Province_page2_11.f',
    phys2_postal: 'Petitioner_Address_2_History_PostalCode_page2_11.g',
    phys2_country: 'Petitioner_Address_2_History_Country_page2_11.h',

    // Page 2/3 — Employment #1
    emp1_name: 'Petitioner_employment_History_1_NameOfEmployer_page2_13',
    emp1_street: 'Petitioner_Employement_1_History_StreetNumber_or_name_page2_14.a.',
    // Your PDF has TWO possible “unit number” fields here; fill both to be safe:
    emp1_unit_number: [
      'Petitioner_Employment_History_1_Apt_Suite_Floor_Number_Page2_14.b',
      'Petitioner_Employment_History_1_AptSteFlr_Number_Page2_14.b',
    ],
    emp1_city: 'Petitioner_Employement_1_History_City_or_town_page2_14.c',
    emp1_state: 'Petitioner_Employement_1_History_State_page2_14.d.',
    emp1_zip: 'Petitioner_Employement_1_History_ZipCode_page2_14.e.',
    emp1_province: 'Petitioner_Employement_1_History_Province_page2_14.f.',
    emp1_postal: 'Petitioner_Employement_1_History_PostalCode_page2_14.g.',
    emp1_country: 'Petitioner_Employement_1_History_Country_page2_14.h.',
    emp1_occupation: 'Petitioner_Employement_1_History_Occupation_page2_15',
    emp1_date_from: 'Petitioner_Employement_1_History_Start_Date_page2_16.a.',
    emp1_date_to: 'Petitioner_Employement_1_History_End_Date_page2_16.b.',

    // Page 2/3 — Employment #2
    emp2_name: 'Petitioner_employment_History_2_NameOfEmployer_page2_18',
    emp2_street: 'Petitioner_Employement_2_History_StreetNumber_or_name_page2_18.a',
    emp2_unit_number: [
      'Petitioner_Employment_History_2_Apt_Suite_Floor_Number_Page2_18.b',
      'Petitioner_Employment_History_2_AptSteFlr_Number_Page2_18.b',
    ],
    emp2_city: 'Petitioner_Employement_2_History_City_or_town_page2_18.c',
    emp2_state: 'Petitioner_Employement_2_History_State_page2_18.d',
    emp2_zip: 'Petitioner_Employement_2_History_ZipCode_page2_18.e',
    emp2_province: 'Petitioner_Employement_2_History_Province_page2_18.f',
    emp2_postal: 'Petitioner_Employement_2_History_PostalCode_page2_18.g',
    emp2_country: 'Petitioner_Employement_2_History_Country_page2_18.h',
    emp2_occupation: 'Petitioner_Employement_2_History_Occupation_page2_19',
    emp2_date_from: 'Petitioner_Employement_2_History_Employment_Start_Date_page3_20.a.',
    emp2_date_to: 'Petitioner_Employement_2_History_Employment_End_Date_page3_20.b',

    // Page 3 — DOB & birth
    petitioner_dob: 'Petitioner_Other_Information_Date_of_birth_page3_22',
    petitioner_birth_city: 'Petitioner_Other_Information_City_Town_Village_Birth_page3_24',
    petitioner_birth_state_province: 'Petitioner_Other_Information_Province_State_Birth_page3_25',
    petitioner_birth_country: 'Petitioner_Other_Information_Country_of_Birth_page3_26',

    // Page 10 — contact
    petitioner_phone: 'Petitioners_Contact_Information_daytime_Phone_Number_page10_1',
    petitioner_email: 'Petitioners_Contact_Information_Email_Address_page10_3',
  },

  // “Select one / Yes-No” style fields that your spreadsheet listed as multiple names in one row.
  // We support BOTH checkbox-style and radio-group-style PDFs via fill logic.
  selectOne: {
    class_type: {
      // K-1 vs K-3 on page 1 question 4.a / 4.b
      k1: 'Petitioner_Request_Beneficiary_K1_page_1_Num_4a',
      k3: 'Petitioner_Request_Beneficiary_K3_page_1_Num_4b',
    },
  },

  booleanPairs: {
    // Page 1 question 5
    k3_i130_filed: {
      yes: 'Petitioner_Filing_K3_Filed_I130__Yes',
      no: 'Petitioner_Filing_K3_Filed_I130__No',
    },

    // Page 1 question 8.j (your sheet also included a group name; we keep it for radio fallback)
    mailing_same_as_physical: {
      group: 'Petitioner_is_mailing_address_same_as_physical_address_check_yes_or_no_page1_8.j',
      yes: 'Petitioner_Mailing_Adress_Same_as_physical_checkbox_Yes_page1_8.j',
      no: 'Petitioner_Mailing_Adress_Same_as_physical_checkbox_No_page1_8.j',
    },
  },

  // Optional: Unit type checkboxes (Apt/Ste/Flr) — we’ll infer from the user’s unit input
  unitTypeGroups: {
    mail_unit_type: {
      apt: 'Petitioner_in_care_of_Apt_Checkbox_Page1_8.c.',
      ste: 'Petitioner_in_care_of_Ste_Checkbox_Page1_8.c.',
      flr: 'Petitioner_in_care_of_Flr_Checkbox_Page1_8.c.',
    },
    phys1_unit_type: {
      apt: 'Petitioner_Address_1_History_Apt_Checkbox_Page2_9.b',
      ste: 'Petitioner_Address_1_History_Suite_Checkbox_Page2_9.b',
      flr: 'Petitioner_Address_1_History_Floor_Checkbox_Page2_9.b',
    },
    phys2_unit_type: {
      apt: 'Petitioner_Address_2_History_Apt_Checkbox_Page2_11.b.',
      ste: 'Petitioner_Address_2_History_Suite_Checkbox_Page2_11.b.',
      flr: 'Petitioner_Address_2_History_Floor_Checkbox_Page2_11b',
    },
    emp1_unit_type: {
      apt: 'Petitioner_Employment_History_1_Apt_Checkbox_Page2_14.b',
      ste: 'Petitioner_Employment_History_1_Ste_Checkbox_Page2_14.b',
      flr: 'Petitioner_Employment_History_1_Flr_Checkbox_Page2_14.b',
    },
    emp2_unit_type: {
      apt: 'Petitioner_Employment_History_2_Apt_Checkbox_Page2_18.b',
      ste: 'Petitioner_Employment_History_2_Ste_Checkbox_Page2_18.b',
      flr: 'Petitioner_Employment_History_2_Flr_Checkbox_Page2_18.b',
    },
  },
};
