// lib/i129fFieldMap.js
//
// This map matches the actual AcroForm field names inside: public/i-129f.pdf
// (field names like "Petitioner_Family_Name_Last_Name_page1_6a").
//
// If you ever replace the PDF template with a different version, you must
// regenerate/update this map to match that template’s field names.

export const I129F_FIELD_MAP = {
  // Text fields
  text: {
    // IDs / numbers (page 1)
    petitioner_alien_number: 'Petitioner_Alien_Registration_page_1_Num_1',
    petitioner_uscis_online_acct: 'Petitioner_USCIS_Online_Acct_Num_page_1_Num_2',
    petitioner_ssn: 'Petitioner_Social_Security_Num_page_1_Num_3',

    // Legal name (page 1)
    petitioner_last: 'Petitioner_Family_Name_Last_Name_page1_6a',
    petitioner_first: 'Petitioner_Given_Name_First_Name_page1_6b',
    petitioner_middle: 'Petitioner_MiddleName_page1_6',

    // Other names used (page 1)
    petitioner_other_last: 'Petitioner_Other_Names_Used_Family_Name_page_1_Num_7a',
    petitioner_other_first: 'Petitioner_Other_Names_Used_Given_Name_page_1_Num_7',
    petitioner_other_middle: 'Petitioner_Other_Names_Used_Middle_Name_page_1_Num_7',

    // Mailing address (page 1)
    mail_in_care_of: 'Petitioner_In_Care_of_Name_page1_8',
    mail_street: 'Petitioner_Street_Number_and_Name_Page1_8',
    mail_unit_number: 'Petitioner_in_care_of_APt_Ste_Flr_number_Page1_8',
    mail_city: 'Petitioner_in_Care_of_City_or_Town_page1_8',
    mail_state: 'Petitioner_in_Care_of_State_page1_8',
    mail_zip: 'Petitioner_in_Care_of_ZipCode_page1_8',
    mail_province: 'Petitioner_in_Care_of_Province_page1_8',
    mail_postal: 'Petitioner_in_Care_of_Postal_Code_page1_8',
    mail_country: 'Petitioner_in_Care_of_Country_page1_8',

    // Address history (page 2) — these are the “physical address history” fields in your PDF
    phys1_street: 'Petitioner_Address_1_History_Street_Numb_and_name_page2_9',
    phys1_unit_number: 'Petitioner_Address_1_History_Apt_Suite_Floor_Number_Page2_9',
    phys1_city: 'Petitioner_Address_1_History_City_or_town_page2_9',
    phys1_state: 'Petitioner_Address_1_History_State_page2_9',
    phys1_zip: 'Petitioner_Address_1_History_ZipCode_page2_9',
    phys1_province: 'Petitioner_Address_1_History_Province_page2_9',
    phys1_postal: 'Petitioner_Address_1_History_PostalCode_page2_9',
    phys1_country: 'Petitioner_Address_1_History_Country_page2_9',

    phys2_street: 'Petitioner_Address_2_History_Street_Numb_and_name_page2_11',
    phys2_unit_number: 'Petitioner_Address_2_History_Apt_Suite_Floor_Number_Page2_11',
    phys2_city: 'Petitioner_Address_2_History_City_or_town_page2_11',
    phys2_state: 'Petitioner_Address_2_History_State_page2_11',
    phys2_zip: 'Petitioner_Address_2_History_ZipCode_page2_11',
    phys2_province: 'Petitioner_Address_2_History_Province_page2_11',
    phys2_postal: 'Petitioner_Address_2_History_PostalCode_page2_11',
    phys2_country: 'Petitioner_Address_2_History_Country_page2_11',

    // Employment history (page 2/3)
    emp1_name: 'Petitioner_employment_History_1_NameOfEmployer_page2_13',
    emp1_street: 'Petitioner_Employement_1_History_StreetNumber_or_name_page2_14',
    emp1_unit_number: 'Petitioner_Employment_History_1_AptSteFlr_Number_Page2_14',
    emp1_city: 'Petitioner_Employement_1_History_City_or_town_page2_14',
    emp1_state: 'Petitioner_Employement_1_History_State_page2_14',
    emp1_zip: 'Petitioner_Employement_1_History_ZipCode_page2_14',
    emp1_province: 'Petitioner_Employement_1_History_Province_page2_14',
    emp1_postal: 'Petitioner_Employement_1_History_PostalCode_page2_14',
    emp1_country: 'Petitioner_Employement_1_History_Country_page2_14',
    emp1_occupation: 'Petitioner_Employement_1_History_Occupation_page2_15',
    emp1_date_from: 'Petitioner_Employement_1_History_Start_Date_page2_16',
    emp1_date_to: 'Petitioner_Employement_1_History_End_Date_page2_16',

    emp2_name: 'Petitioner_employment_History_2_NameOfEmployer_page2_18',
    emp2_street: 'Petitioner_Employement_2_History_StreetNumber_or_name_page2_18',
    emp2_unit_number: 'Petitioner_Employment_History_2_AptSteFlr_Number_Page2_18',
    emp2_city: 'Petitioner_Employement_2_History_City_or_town_page2_18',
    emp2_state: 'Petitioner_Employement_2_History_State_page2_18',
    emp2_zip: 'Petitioner_Employement_2_History_ZipCode_page2_18',
    emp2_province: 'Petitioner_Employement_2_History_Province_page2_18',
    emp2_postal: 'Petitioner_Employement_2_History_PostalCode_page2_18',
    emp2_country: 'Petitioner_Employement_2_History_Country_page2_18',
    emp2_occupation: 'Petitioner_Employement_2_History_Occupation_page2_19',
    emp2_date_from: 'Petitioner_Employement_2_History_Employment_Start_Date_page3_20',
    emp2_date_to: 'Petitioner_Employement_2_History_Employment_End_Date_page3_20',

    // DOB / Birthplace (page 3)
    petitioner_dob: 'Petitioner_Other_Information_Date_of_birth_page3_22',
    petitioner_birth_city: 'Petitioner_Other_Information_City_Town_Village_Birth_page3_24',
    petitioner_birth_state_province: 'Petitioner_Other_Information_Province_State_Birth_page3_25',
    petitioner_birth_country: 'Petitioner_Other_Information_Country_of_Birth_page3_26',

    // Contact (page 10)
    petitioner_phone: 'Petitioners_Contact_Information_daytime_Phone_Number_page10_1',
    petitioner_email: 'Petitioners_Contact_Information_Email_Address_page10_3',
  },

  // Radio groups (your PDF uses radios for these, not checkboxes)
  radios: {
    // Classification (K-1 vs K-3)
    class_type: {
      field: 'Petitioner_Select_One_box_Classification_of_Beneficiary',
      values: {
        k1: 'Petitioner_Request_Beneficiary_K1_page_1_Num_4a',
        k3: 'Petitioner_Request_Beneficiary_K3_page_1_Num_4b',
      },
    },

    // Filed I-130 for K-3? (Yes/No)
    k3_i130_filed: {
      field: 'Petitioner_Filing_K3_Visa_Check_Yes_No_page_1_number5',
      values: {
        yes: 'Petitioner_Filing_K3_Filed_I130__Yes',
        no: 'Petitioner_Filing_K3_Filed_I130__No',
      },
    },

    // Mailing same as physical (Yes/No)
    mailing_same_as_physical: {
      field: 'Petitioner_is_mailing_address_same_as_physical_address_check_yes_or_no_page1_8',
      values: {
        yes: 'Petitioner_Mailing_Adress_Same_as_physical_checkbox_Yes_page1_8.j',
        no: 'Petitioner_Mailing_Adress_Same_as_physical_checkbox_No_page1_8.j',
      },
    },
  },
};
