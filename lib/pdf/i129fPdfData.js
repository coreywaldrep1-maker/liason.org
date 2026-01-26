// lib/pdf/i129fPdfData.js
// Builds a {"pdfFieldName": value} map from the wizard's saved object.
// Values are strings for text fields and booleans for checkboxes.

const F = {
  BEN_A: "Beneficiary_A_Number_if_any_page4_1.d",
  BEN_AB_CITY: "Beneficiary_Physical_Address_Abroad_City_Town_Village_Page7_47.c",
  BEN_AB_COUNTRY: "Beneficiary_Physical_Address_Country_page7_47.e",
  BEN_AB_PHONE: "Beneficiary_Physical_Address_Abroad_Daytime_Tel_Number_Page7_47.f",
  BEN_AB_PROV: "Beneficiary_Physical_Address_Abroad_Province_State_Page7_47.d",
  BEN_AB_STREET: "Beneficiary_Physical_Address_Abroad_StreetNUmb_and_name_Page7_47.a",
  BEN_AB_UNIT: [
    "Beneficiary_Physical_Address_Abroad_Apt_Ste_Flr_num_checkboxes_Page7_47.b",
    "Beneficiary_Physical_Address_Abroad_Apt_checkbox_Page7_47.b",
    "Beneficiary_Physical_Address_Abroad_Ste_checkbox_Page7_47.b",
    "Beneficiary_Physical_Address_Abroad_Flr_checkbox_Page7_47.b",
    "Beneficiary_Physical_Address_Abroad_Apt_Ste_Flr_Num_Page7_47.b"
  ],
  BEN_ARRIVAL: "Beneficiary_Currently_In_US_Date_Of_Arrival_page6_38.c",
  BEN_BCITY: "Beneficiary_City_Town_Village_Birth_page4_7",
  BEN_BCOUNTRY: "Beneficiary_Country_Birth_page4_8",
  BEN_CLASS: "Beneficiary_Other_Information_Beneficiary_Currently_In_US_EnteredAS_page6_38.a",
  BEN_DOB: "Beneficiary_Date_Of_Birth_page4_4",
  BEN_EMP1_CITY: "Beneficiary_Employer_1_Addres_City_Town_Village_page5_17.d",
  BEN_EMP1_COUNTRY: "Beneficiary_Employer_1_Addres_country_page5_17.h",
  BEN_EMP1_FROM: "Beneficiary_Employer_1_Addres_StartDate_page5_19.a",
  BEN_EMP1_NAME: "Beneficiary_Employer_1_Address_NameOfEmployer_page5_16",
  BEN_EMP1_OCC: "Beneficiary_Employer_1_Addres_Occupation_page5_18",
  BEN_EMP1_POSTAL: "Beneficiary_Employer_1_Addres_PostalCode_page5_17.g",
  BEN_EMP1_PROV: "Beneficiary_Employer_1_Addres_Province_page5_17.f",
  BEN_EMP1_STATE: "Beneficiary_Employer_1_Addres_State_page5_17.e",
  BEN_EMP1_STREET: "Beneficiary_Employer_1_Addres_Street_Numb_and_name_page5_17.a",
  BEN_EMP1_TO: "Beneficiary_Employer_1_Addres_EndDate_page5_19.b",
  BEN_EMP1_UNIT: [
    "Beneficiary_Employer_1_Addres_Apt_Ste_Flr_num_checkboxes_page5_17.b",
    "Beneficiary_Employer_1_Addres_Apt_checkbox_page5_17.b",
    "Beneficiary_Employer_1_Addres_Ste_checkbox_page5_17.b",
    "Beneficiary_Employer_1_Addres_Flr_checkbox_page5_17.b",
    "Beneficiary_Employer_1_Addres_Apt_Ste_Flr_Num_page5_17.c"
  ],
  BEN_EMP1_ZIP: "Beneficiary_Employer_1_Addres_ZipCode_page5_17.c",
  BEN_EMP2_CITY: "Beneficiary_Employer_2_City_Town_Vill_page6_21.d",
  BEN_EMP2_COUNTRY: "Beneficiary_Employer_2_Country_page6_21.h",
  BEN_EMP2_FROM: "Beneficiary_Employer_2_StartDate_page6_23.a",
  BEN_EMP2_NAME: "Beneficiary_Employer_2_Address_NameOfEmployer_page6_20",
  BEN_EMP2_OCC: "Beneficiary_Employer_2_Occupation_page6_22",
  BEN_EMP2_POSTAL: "Beneficiary_Employer_2_PostalCode_page6_21.g",
  BEN_EMP2_PROV: "Beneficiary_Employer_2_Province_page6_21.f",
  BEN_EMP2_STATE: "Beneficiary_Employer_2_State_page6_21.e",
  BEN_EMP2_STREET: "Beneficiary_Employer_2_StreetNUmb_and_name_page6_21.a",
  BEN_EMP2_TO: "Beneficiary_Employer_2_EndDate_page6_23.b",
  BEN_EMP2_UNIT: [
    "Beneficiary_Employer_2_Apt_Ste_Flr_Num_checkboxes_page6_21.b",
    "Beneficiary_Employer_2_Apt_checkbox_page6_21.b",
    "Beneficiary_Employer_2_Ste_checkbox_page6_21.b",
    "Beneficiary_Employer_2_Flr_checkbox_page6_21.b",
    "Beneficiary_Employer_2_Apt_Ste_Flr_Num_page6_21.c"
  ],
  BEN_EMP2_ZIP: "Beneficiary_Employer_2_ZipCode_page6_21.c",
  BEN_FIRST: "Beneficiary_Given_Name_First_Name_page4_1.b",
  BEN_I94: "Beneficiary_Other_Information_Beneficiary_Currently_In_US_I94_Arrival_Departure_Num_page6_38.b",
  BEN_INUS_YN: [
    "Beneficiary_Other_Information_Beneficiary_Been_In_US_Previously_checkboxes_Yes_No_page6_37",
    "Beneficiary_Other_Information_Beneficiary_Been_In_US_Previously_checkbox_No_page6_37",
    "Beneficiary_Other_Information_Beneficiary_Been_In_US_Previously_checkbox_Yes_page6_37"
  ],
  BEN_LAST: "Beneficiary_Family_Name_Last_Name_page4_1.a",
  BEN_MAIL_CITY: "Beneficiary_Mailing_Address_In_Care_of_City_or_town_Page4_11.d",
  BEN_MAIL_COUNTRY: "Beneficiary_Mailing_Address_In_Care_of_Country_Page4_11.i",
  BEN_MAIL_INCARE: "Beneficiary_Mailing_Address_In_Care_of_Name_page4_11.a",
  BEN_MAIL_POSTAL: "Beneficiary_Mailing_Address_In_Care_of_Postalcode_Page4_11.h",
  BEN_MAIL_PROV: "Beneficiary_Mailing_Address_In_Care_of_Province_Page4_11.g",
  BEN_MAIL_STATE: "Beneficiary_Mailing_Address_In_Care_of_State_Page4_11.e",
  BEN_MAIL_STREET: "Beneficiary_Mailing_Address_In_Care_of_Street_Number_page4_11.b",
  BEN_MAIL_UNIT: [
    "Beneficiary_Mailing_Address_In_Care_of_Apt_Ste_Flr_checkboxes_Page4_11.c",
    "Beneficiary_Mailing_Address_In_Care_of_Apt_checkbox_Page4_11.c",
    "Beneficiary_Mailing_Address_In_Care_of_Ste_checkbox_Page4_11.c",
    "Beneficiary_Mailing_Address_In_Care_of_Flr_checkbox_Page4_11.c",
    "Beneficiary_Mailing_Address_In_Care_of_AptSteFlr_Number_Page4_11.c"
  ],
  BEN_MAIL_ZIP: "Beneficiary_Mailing_Address_In_Care_of_Zipcode_Page4_11.f",
  BEN_MARITAL: [
    "Beneficiary_Marital_Status_Page4_6_Checkboxes",
    "Beneficiary_Status_Single_Page4_6",
    "Beneficiary_Status_Married_Page4_6",
    "Beneficiary_Status_Divorced_Page4_6",
    "Beneficiary_Status_Widowed_Page4_6"
  ],
  BEN_MID: "Beneficiary_Middle_Name_page4_1.c",
  BEN_NAT: "Beneficiary_Citizenship_Country_page4_9",
  BEN_OTHER_FIRST: "Beneficiary_Other_Names_Used_Given_Name_page4_10.b",
  BEN_OTHER_LAST: "Beneficiary_Other_Names_Used_Family_Name_page4_10.a",
  BEN_OTHER_MID: "Beneficiary_Other_Names_Used_Middle_Name_page4_10.c",
  BEN_PARENT1_BCOUNTRY: "Beneficiary_Parent_1_Information_Country_Of_birth_page5_28",
  BEN_PARENT1_DOB: "Beneficiary_Parent_1_Information_Date_Of_Birth_page5_26",
  BEN_PARENT1_FIRST: "Beneficiary_Parent_1_Information_FirstName_page5_24.b",
  BEN_PARENT1_LAST: "Beneficiary_Parent_1_Information_LastName_page5_24.a",
  BEN_PARENT1_MID: "Beneficiary_Parent_1_Information_MiddleName_page5_24.c",
  BEN_PARENT1_RESCITY: "Beneficiary_Parent_1_Information_City_Ton_Vill_Residence_page5_29.a",
  BEN_PARENT1_RESCOUNTRY: "Beneficiary_Parent_1_Information_Country_of__Residence_page5_29.b",
  BEN_PARENT1_SEX: [
    "Beneficiary_Parent_1_Information_Sex_Checkboxes_page5_27",
    "Beneficiary_Parent_1_Information_Male_page5_27",
    "Beneficiary_Parent_1_Information_Female_page5_27"
  ],
  BEN_PARENT2_BCOUNTRY: "Beneficiary_Parent_2_Information_Country_Of_Birth_page5_35",
  BEN_PARENT2_DOB: "Beneficiary_Parent_2_Information_DateOfBirth_page5_33",
  BEN_PARENT2_FIRST: "Beneficiary_Parent_2_Information_FirstName_page5_31.b",
  BEN_PARENT2_LAST: "Beneficiary_Parent_2_Information_LastName_page5_31.a",
  BEN_PARENT2_MID: "Beneficiary_Parent_2_Information_MiddleName_page5_31.c",
  BEN_PARENT2_RESCITY: "Beneficiary_Parent_2_Information_City_Town_Vil_Residence_page5_36.a",
  BEN_PARENT2_RESCOUNTRY: "Beneficiary_Parent_2_Information_Country_residence_page5_36.b",
  BEN_PARENT2_SEX: [
    "Beneficiary_Parent_2_Information_Sex_Checkboxes_page5_34",
    "Beneficiary_Parent_2_Information_Male_page5_34",
    "Beneficiary_Parent_2_Information_Female_page5_34"
  ],
  BEN_PASS_CTRY: "Beneficiary_Other_Information_Beneficiary_Currently_In_US_Travel_Country_Issuance_Passport_or_travel_Document_page7_38.g",
  BEN_PASS_EXP: "Beneficiary_Other_Information_Beneficiary_Currently_In_US_Travel_EExpiration_Date_Issuance_Passport_or_travel_Document_page7_38.h",
  BEN_PASS_NO: "Beneficiary_Other_Information_Beneficiary_Currently_In_US_Passport_Number_page7_38.e",
  BEN_SEX: [
    "Beneficiary_Sex_Checkboxes_page4_5",
    "Beneficiary_Sex_Checkbox_Male_page4_5",
    "Beneficiary_Sex_Checkbox_Female_page4_5"
  ],
  BEN_SSN: "Beneficiary_Social_Security_if_any_page4_2",
  BEN_STATUS_EXP: "Beneficiary_Other_Information_Beneficiary_Currently_In_US_Date_Of_Expiration_Shown_I94_I95_page6_38.d",
  BEN_TRAVEL_NO: "Beneficiary_Other_Information_Beneficiary_Currently_In_US_Travel_Doucment_Number_page7_38.f",
  BEN_US_CITY: "Beneficiary_Address_In_United_states_Where_address_Intends_to_live_City_Town_Village_Page7_45.c",
  BEN_US_PHONE: "Beneficiary_Address_In_United_states_Where_address_Intends_to_live_DayTimePhone_Number_Page7_46",
  BEN_US_STATE: "Beneficiary_Address_In_United_states_Where_address_Intends_to_live_State_Page7_45.d",
  BEN_US_STREET: "Beneficiary_Address_In_United_states_Where_address_Intends_to_live_Street_Numb_and_name_Page7_45.a",
  BEN_US_UNIT: [
    "Beneficiary_Address_In_United_states_Where_address_Intends_to_live_Apt_Ste_Flr_Num_Checkboxes_Page7_45.b",
    "Beneficiary_Address_In_United_states_Where_address_Intends_to_live_Apt_checkbox_Page7_45.b",
    "Beneficiary_Address_In_United_states_Where_address_Intends_to_live_Ste_checkbox_Page7_45.b",
    "Beneficiary_Address_In_United_states_Where_address_Intends_to_live_Flr_checkbox_Page7_45.b",
    "Beneficiary_Address_In_United_states_Where_address_Intends_to_live_Apt_Ste_Flr_Num_Page7_45.b"
  ],
  BEN_US_ZIP: "Beneficiary_Address_In_United_states_Where_address_Intends_to_live_ZipCode_Page7_45.e",
  CLS_I130_YN: [
    "Petitioner_Filing_K3_Filed_I130__Yes_page1_5.a",
    "Petitioner_Filing_K3_Filed_I130__No_page1_5.b"
  ],
  CLS_K1: "Petitioner_Request_Beneficiary_K1_page_1_Num_4a",
  CLS_K3: "Petitioner_Request_Beneficiary_K3_page_1_Num_4b",
  CONT1: "Continued_Information_1_Explanation_Area_Page12_3.d",
  CONT1_ITEM: "Continued_Information_1_Item_Number_Page12_3.c",
  CONT1_PAGE: "Continued_Information_1_Page_Number_Page12_3.a",
  CONT1_PART: "Continued_Information_1_Part_Number_Page12_3.b",
  CONT2: "Continued_Information_2_Explanation_Area_Page12_4.d",
  CONT2_ITEM: "Continued_Information_2_Item_Number_Page12_4.c",
  CONT2_PAGE: "Continued_Information_2_Page_Number_Page12_4.a",
  CONT2_PART: "Continued_Information_2_Part_Number_Page12_4.b",
  CONT3: "Continued_Information_3_Explanation_Area_Page12_5.d",
  CONT3_ITEM: "Continued_Information_3_Item_Number_Page12_5.c",
  CONT3_PAGE: "Continued_Information_3_Page_Number_Page12_5.a",
  CONT3_PART: "Continued_Information_3_Part_Number_Page12_5.b",
  CONT4: "Continued_Information_4_Explanation_Area_Page12_6.d",
  CONT4_ITEM: "Continued_Information_4_Item_Number_Page12_6.c",
  CONT4_PAGE: "Continued_Information_4_Page_Number_Page12_6.a",
  CONT4_PART: "Continued_Information_4_Part_Number_Page12_6.b",
  EMP1_CITY: "Petitioner_Employement_1_History_City_or_town_Page2_14.d",
  EMP1_COUNTRY: "Petitioner_Employement_1_History_Country_Page2_14.h",
  EMP1_FROM: "Petitioner_Employement_1_History_Start_Date_Page2_15.a",
  EMP1_NAME: "Petitioner_employment_History_1_NameOfEmployer_page2_13",
  EMP1_OCC: "Petitioner_Employement_1_History_Occupation_Page2_15",
  EMP1_POSTAL: "Petitioner_Employement_1_History_PostalCode_Page2_14.g",
  EMP1_PROV: "Petitioner_Employement_1_History_Province_Page2_14.f",
  EMP1_STATE: "Petitioner_Employement_1_History_State_page2_14.d",
  EMP1_STREET: "Petitioner_Employement_1_History_StreetNumber_Page2_14.a",
  EMP1_TO: "Petitioner_Employement_1_History_End_Date_Page2_15.b",
  EMP1_UNIT: [
    "Petitioner_Employment_History_1_Apt_Suite_Floor_Number_Page2_14.b",
    "Petitioner_Employment_History_1_Apt_Checkbox_Page2_14.b",
    "Petitioner_Employment_History_1_Ste_Checkbox_Page2_14.b",
    "Petitioner_Employment_History_1_Flr_Checkbox_Page2_14.b",
    "Petitioner_Employment_History_1_AptSteFlr_Number_Page2_14.b"
  ],
  EMP1_ZIP: "Petitioner_Employement_1_History_ZipCode_Page2_14.e",
  EMP2_CITY: "Petitioner_Employement_2_History_City_or_town_Page2_18.d",
  EMP2_COUNTRY: "Petitioner_Employement_2_History_Country_Page2_18.h",
  EMP2_FROM: "Petitioner_Employement_2_History_Employment_Start_Date_Page2_19.a",
  EMP2_NAME: "Petitioner_employment_History_2_NameOfEmployer_page2_17",
  EMP2_OCC: "Petitioner_Employement_2_History_Occupation_Page2_19",
  EMP2_POSTAL: "Petitioner_Employement_2_History_PostalCode_Page2_18.g",
  EMP2_PROV: "Petitioner_Employement_2_History_Province_Page2_18.f",
  EMP2_STATE: "Petitioner_Employement_2_History_State_page2_18.d",
  EMP2_STREET: "Petitioner_Employement_2_History_StreetNumber_Page2_18.a",
  EMP2_TO: "Petitioner_Employement_2_History_Employment_End_Date_Page2_19.b",
  EMP2_UNIT: [
    "Petitioner_Employment_History_2_Apt_Suite_Floor_Number_Page2_18.b",
    "Petitioner_Employment_History_2_Apt_Checkbox_Page2_18.b",
    "Petitioner_Employment_History_2_Ste_Checkbox_Page2_18.b",
    "Petitioner_Employment_History_2_Flr_Checkbox_Page2_18.b",
    "Petitioner_Employment_History_2_AptSteFlr_Number_Page2_18.b"
  ],
  EMP2_ZIP: "Petitioner_Employement_2_History_ZipCode_Page2_18.e",
  INT_BUS: "Interpreter_Contact_Information_Business_Organization_Name_page10_1.c",
  INT_DATE: "Interpreter_Certification_Date_Of_Signature_page10_4.b",
  INT_DAY: "Interpreter_Contact_Information_Daytime_Telephone_Number_page10_2",
  INT_EMAIL: "Interpreter_Contact_Information_Email_page10_3",
  INT_LANG: "Interpreter_Certification_Signature_Language_Field_page10_4.a",
  INT_MOB: "Interpreter_Contact_Information_Mobile_Telephone_Number_page10_2",
  INT_NAME: [
    "Interpreter_Contact_Information_Family_Name_Last_Name_page10_1.a",
    "Interpreter_Contact_Information_Given_Name_First_Name_page10_1.b"
  ],
  MAIL_CITY: "Petitioner_in_Care_of_City_or_Town_page1_8.d",
  MAIL_COUNTRY: "Petitioner_in_Care_of_Country_page1_8.i.",
  MAIL_INCARE: "Petitioner_In_Care_of_Name_page1_8.a",
  MAIL_POSTAL: "Petitioner_in_Care_of_Postal_Code_page1_8.h",
  MAIL_PROV: "Petitioner_in_Care_of_Province_page1_8.g",
  MAIL_SAME: [
    "Petitioner_is_mailing_Address_same_as_physical_checkbox_Yes_NO_page1_8.j",
    "Petitioner_Mailing_Adress_Same_as_physical_checkbox_Yes_page1_8.j",
    "Petitioner_Mailing_Adress_Same_as_physical_checkbox_No_page1_8.j"
  ],
  MAIL_STATE: "Petitioner_in_Care_of_State_page1_8.e",
  MAIL_STREET: "Petitioner_Street_Number_and_Name_Page1_8.b.",
  MAIL_UNIT: [
    "Petitioner_ In_Care_of_Apt_Ste_Flr_Num_Question_page1_8.c",
    "Petitioner_in_care_of_Apt_Checkbox_page1_8.c",
    "Petitioner_in_care_of_Ste_Checkbox_page1_8.c",
    "Petitioner_in_care_of_Flr_checkbox_page1_8.c",
    "Petitioner_in_care_of_APt_Ste_Flr_number_Page1_8.c."
  ],
  MAIL_ZIP: "Petitioner_in_Care_of_ZipCode_page1_8.f",
  NATCERT_DATE: "Petitioner_Date_Of_Issuance_Number_page4_42.c.",
  NATCERT_NUM: "Petitioner_Certificate_Number_page4_42.a.",
  NATCERT_PLACE: "Petitioner_Place_Of_Issuance_Number_page4_42.b.",
  NATCERT_YN: [
    "Petitioner_Obtained_Cert_Of_Naturalization_Certificate_IN_Own_Name_CheckBoxes_Yes_No_page4_41",
    "Petitioner_Obtained_Cert_Of_Naturalization_Certificate_IN_Own_Name_CheckBox_yes_page4_41",
    "Petitioner_Obtained_Cert_Of_Naturalization_Certificate_IN_Own_Name_CheckBox_No_page4_41"
  ],
  PARENT1_BCOUNTRY: "Petitioner_Parent_1_CountryOfBirth_page3_30",
  PARENT1_DOB: "Petitioner_Parent_1_DateOfBirth_page3_28",
  PARENT1_FIRST: "Petitioner_Parent_1_GivenName_FirstName_page3_27.b",
  PARENT1_LAST: "Petitioner_Parent_1_Family Name_page3_27.a",
  PARENT1_MID: "Petitioner_Parent_1_MiddleName_page3_27.c",
  PARENT1_RESCITY: "Petitioner_Parent_1_CityTownVillage_Residence_page3_31.a",
  PARENT1_RESCOUNTRY: "Petitioner_Parent_1_Country_Residence_page3_31.b",
  PARENT1_SEX: [
    "Petitioner_Parent_1_Sex_Check_Male_Female_page3_29",
    "Petitioner_Parent_1_Sex_Check_Male_page3_29",
    "Petitioner_Parent_1_Sex_Check_Female_page3_29"
  ],
  PARENT2_BCOUNTRY: "Petitioner_Parent_2_CountryOfBirth_page3_35",
  PARENT2_DOB: "Petitioner_Parent_2_DateOfBirth_page3_33",
  PARENT2_FIRST: "Petitioner_Parent_2_GivenName_FirstName_page3_32.b",
  PARENT2_LAST: "Petitioner_Parent_2_FamilyName_page3_32.a",
  PARENT2_MID: "Petitioner_Parent_2_MiddleName_page3_32.c",
  PARENT2_RESCITY: "Petitioner_Parent_2_CityTownVillage_Residence_page3_36.a",
  PARENT2_RESCOUNTRY: "Petitioner_Parent_2_Country_Residence_page3_36.b",
  PARENT2_SEX: [
    "Petitioner_Parent_2_Sex_Check_Male_Female_page3_34",
    "Petitioner_Parent_2_Sex_Check_Male_page3_34",
    "Petitioner_Parent_2_Sex_Check_Female_page3_34"
  ],
  PET_A_NUM: "Petitioner_Alien_Registration_page_1_Num_1",
  PET_BCITY: "Petitioner_Other_Information_City_Town_Village_Birth_page_24",
  PET_BCOUNTRY: "Petitioner_Other_Information_Country_of_Birth_26",
  PET_BPROV: "Petitioner_Other_Information_Province_State_Birth_25",
  PET_DOB: "Petitioner_Other_Information_Date_of_birth_22",
  PET_EMAIL: "Petitioners_Contact_Information_Email_Page9_40",
  PET_FIRST: "Petitioner_Given_Name_First_Name_page1_6b",
  PET_LAST: "Petitioner_Family_Name_Last_Name_page1_6a",
  PET_MARITAL: [
    "Petitioner_Other_Information_Marital_Status_page3_23_CheckBoxes",
    "Petitioner_Other_Information_Marital_Status_Single_CheckBox_page3_23",
    "Petitioner_Other_Information_Marital_Status_Married_CheckBox_page3_23",
    "Petitioner_Other_Information_Marital_Status_Divorced_CheckBox_page3_23",
    "Petitioner_Other_Information_Marital_Status_Widowed_CheckBox_page3_23"
  ],
  PET_MID: "Petitioner_MiddleName_page1_6c",
  PET_MOBILE: "Petitioners_Contact_Information_Mobile_Telephone_Page9_39",
  PET_OTHER_FIRST: "Petitioner_Other_Names_Used_Given_Name_page1_7b",
  PET_OTHER_LAST: "Petitioner_Other_Names_Used_Family_Name_page1_7a",
  PET_OTHER_MID: "Petitioner_Other_Names_Used_Middle_Name_page1_7c",
  PET_PHONE: "Petitioners_Contact_Information_daytime_Telephone_Page9_38",
  PET_SEX: [
    "Petitioner_Other_Information_Sex_Checkbox_Male_Female_page3_21",
    "Petitioner_Other_Information_Sex_Checkbox_Male_page3_21",
    "Petitioner_Other_Information_Sex_Checkbox_Female_page3_21"
  ],
  PET_SSN: "Petitioner_Social_Security_Num_page_1_Num_3",
  PET_USCIS: "Petitioner_USCIS_Online_Acct_Num_page_1_Num_2",
  PHYS1_CITY: "Petitioner_Address_1_History_City_or_town_Page2_9.d.",
  PHYS1_COUNTRY: "Petitioner_Address_1_History_Country_Page2_9.h",
  PHYS1_FROM: "Petitioner_Address_1_History_DateFrom_Page2_10.a.",
  PHYS1_POSTAL: "Petitioner_Address_1_History_PostalCode_Page2_9.g",
  PHYS1_PROV: "Petitioner_Address_1_History_Province_Page2_9.f",
  PHYS1_STATE: "Petitioner_Address_1_History_State_Page2_9.e",
  PHYS1_STREET: "Petitioner_Address_1_History_Street_Numb_and_name_Page2_9.a.",
  PHYS1_TO: "Petitioner_Address_1_History_DateTo_Page2_10.b.",
  PHYS1_UNIT: [
    "Petitioner_Address_1_History_Apt_Suite_Floor_Number_Page2_9.c",
    "Petitioner_Address_1_History_Apt_Checkbox_Page2_9.c",
    "Petitioner_Address_1_History_Suite_Checkbox_Page2_9.c",
    "Petitioner_Address_1_History_Floor_Checkbox_Page2_9.c",
    "Petitioner_Address_1_History_Apt_Ste_Flr_Num_Question_Page2_9.c"
  ],
  PHYS1_ZIP: "Petitioner_Address_1_History_ZipCode_Page2_9.b.",
  PHYS2_CITY: "Petitioner_Address_2_History_City_or_town_Page2_12.d.",
  PHYS2_COUNTRY: "Petitioner_Address_2_History_Country_Page2_12.h",
  PHYS2_FROM: "Petitioner_Address_2_History_DateFrom_Page2_12.a.",
  PHYS2_POSTAL: "Petitioner_Address_2_History_PostalCode_Page2_12.g",
  PHYS2_PROV: "Petitioner_Address_2_History_Province_Page2_12.f",
  PHYS2_STATE: "Petitioner_Address_2_History_State_Page2_12.e",
  PHYS2_STREET: "Petitioner_Address_2_History_Street_Numb_and_name_Page2_12.a.",
  PHYS2_TO: "Petitioner_Address_2_History_DateTo_Page2_12.b.",
  PHYS2_UNIT: [
    "Petitioner_Address_2_History_Apt_Suite_Floor_Number_Page2_12.c",
    "Petitioner_Address_2_History_Apt_Checkbox_Page2_12.c",
    "Petitioner_Address_2_History_Suite_Checkbox_Page2_12.c",
    "Petitioner_Address_2_History_Floor_Checkbox_Page2_12.c",
    "Petitioner_Address_2_History_Apt_Ste_Flr_Num_Question_Page2_12.c"
  ],
  PHYS2_ZIP: "Petitioner_Address_2_History_ZipCode_Page2_12.b.",
  PREP_BUS: "Prepare_Full_Name_Business_Organization_Name_page11_1.c",
  PREP_DATE: "Prepare_Date_Of_Signature_page11_6.b",
  PREP_DAY: "Prepare_Contact_Information_Daytime_Telephone_Number_page11_2",
  PREP_EMAIL: "Prepare_Contact_Information_Email_page11_5",
  PREP_MOB: "Prepare_Contact_Information_Mobile_Telephone_Number_page11_2",
  PREP_NAME: [
    "Prepare_Full_Name_Family_Name_Last_Name_page11_1.a",
    "Prepare_Full_Name_Given_Name_First_Name_page11_1.b"
  ]
};

const str = (v) => (v === undefined || v === null) ? "" : String(v).trim();
const normLower = (v) => str(v).toLowerCase();

function setText(out, name, value) {
  if (!name) return;
  const v = str(value);
  if (v !== "") out[name] = v;
}

function setCheck(out, name, checked) {
  if (!name) return;
  out[name] = !!checked;
}

function setYesNo(out, yesName, noName, value) {
  if (value === true) {
    setCheck(out, yesName, true);
    setCheck(out, noName, false);
  } else if (value === false) {
    setCheck(out, yesName, false);
    setCheck(out, noName, true);
  }
}

function normalizeSex(sex) {
  const v = normLower(sex);
  if (v.startsWith("m")) return "male";
  if (v.startsWith("f")) return "female";
  return "";
}

function setSex(out, maleName, femaleName, sex) {
  const s = normalizeSex(sex);
  if (s === "male") {
    setCheck(out, maleName, true);
    setCheck(out, femaleName, false);
  } else if (s === "female") {
    setCheck(out, maleName, false);
    setCheck(out, femaleName, true);
  }
}

function normalizeUnitType(unitType) {
  const v = normLower(unitType);
  if (v.startsWith("apt")) return "apt";
  if (v.startsWith("ste") || v.startsWith("sui")) return "ste";
  if (v.startsWith("flr") || v.startsWith("flo")) return "flr";
  return "";
}

function setUnit(out, unitType, unitNum, names) {
  // names: { apt, ste, flr, numFields: [] }
  const t = normalizeUnitType(unitType);
  if (names?.apt) setCheck(out, names.apt, t === "apt");
  if (names?.ste) setCheck(out, names.ste, t === "ste");
  if (names?.flr) setCheck(out, names.flr, t === "flr");

  const num = str(unitNum);
  if (Array.isArray(names?.numFields) && num) {
    for (const n of names.numFields) setText(out, n, num);
  }
}

function normalizeMarital(ms) {
  const v = normLower(ms);
  if (v.startsWith("single")) return "single";
  if (v.startsWith("mar")) return "married";
  if (v.startsWith("div")) return "divorced";
  if (v.startsWith("wid")) return "widowed";
  return "";
}

function setMarital(out, names, maritalStatus) {
  // names: { single, married, divorced, widowed }
  const m = normalizeMarital(maritalStatus);
  if (names?.single) setCheck(out, names.single, m === "single");
  if (names?.married) setCheck(out, names.married, m === "married");
  if (names?.divorced) setCheck(out, names.divorced, m === "divorced");
  if (names?.widowed) setCheck(out, names.widowed, m === "widowed");
}

function getAt(arr, idx) {
  return Array.isArray(arr) ? (arr[idx] || {}) : {};
}

export function buildI129fPdfData(saved = {}) {
  const out = {};

  const pet = saved.petitioner || {};
  const cls = saved.classification || {};
  const mail = saved.mailing || {};
  const phys = Array.isArray(saved.physicalAddresses) ? saved.physicalAddresses : [];
  const emp = Array.isArray(saved.employment) ? saved.employment : [];
  const pParents = Array.isArray(pet.parents) ? pet.parents : [];

  // --- Petitioner basics ---
  setText(out, F.PET_A_NUM, pet.aNumber);
  setText(out, F.PET_USCIS, pet.uscisOnlineAccount);
  setText(out, F.PET_SSN, pet.ssn);

  // Classification K-1 / K-3
  const clsType = normLower(cls.type);
  if (clsType) {
    setCheck(out, F.CLS_K1, clsType === "k1");
    setCheck(out, F.CLS_K3, clsType === "k3");
  }
  // I-130 filed (only if K-3)
  if (Array.isArray(F.CLS_I130_YN) && F.CLS_I130_YN.length >= 2) {
    setYesNo(out, F.CLS_I130_YN[0], F.CLS_I130_YN[1], clsType === "k3" ? !!cls.i130Filed : undefined);
  }

  // Legal name
  setText(out, F.PET_LAST, pet.lastName);
  setText(out, F.PET_FIRST, pet.firstName);
  setText(out, F.PET_MID, pet.middleName);

  // Other names (first entry)
  const petOther0 = getAt(pet.otherNames, 0);
  setText(out, F.PET_OTHER_LAST, petOther0.lastName);
  setText(out, F.PET_OTHER_FIRST, petOther0.firstName);
  setText(out, F.PET_OTHER_MID, petOther0.middleName);

  // Mailing address
  setText(out, F.MAIL_INCARE, mail.inCareOf);
  setText(out, F.MAIL_STREET, mail.street);
  setUnit(out, mail.unitType, mail.unitNum, {
    apt: F.MAIL_UNIT?.[1],
    ste: F.MAIL_UNIT?.[2],
    flr: F.MAIL_UNIT?.[3],
    numFields: [F.MAIL_UNIT?.[4]],
  });
  setText(out, F.MAIL_CITY, mail.city);
  setText(out, F.MAIL_STATE, mail.state);
  setText(out, F.MAIL_ZIP, mail.zip);
  setText(out, F.MAIL_PROV, mail.province);
  setText(out, F.MAIL_POSTAL, mail.postal);
  setText(out, F.MAIL_COUNTRY, mail.country);

  // Mailing same as physical (Yes/No)
  setYesNo(out, F.MAIL_SAME?.[1], F.MAIL_SAME?.[2], mail.sameAsPhysical);

  // Physical address history #1
  const phys1 = getAt(phys, 0);
  setText(out, F.PHYS1_STREET, phys1.street);
  setUnit(out, phys1.unitType, phys1.unitNum, {
    apt: F.PHYS1_UNIT?.[1],
    ste: F.PHYS1_UNIT?.[2],
    flr: F.PHYS1_UNIT?.[3],
    numFields: [F.PHYS1_UNIT?.[4]],
  });
  // Note: PHYS unit number field is PHYS*_UNIT[0] in your template
  setText(out, F.PHYS1_UNIT?.[0], phys1.unitNum);

  setText(out, F.PHYS1_CITY, phys1.city);
  setText(out, F.PHYS1_STATE, phys1.state);
  setText(out, F.PHYS1_ZIP, phys1.zip);
  setText(out, F.PHYS1_PROV, phys1.province);
  setText(out, F.PHYS1_POSTAL, phys1.postal);
  setText(out, F.PHYS1_COUNTRY, phys1.country);
  setText(out, F.PHYS1_FROM, phys1.from);
  setText(out, F.PHYS1_TO, phys1.to);

  // Physical address history #2
  const phys2 = getAt(phys, 1);
  setText(out, F.PHYS2_STREET, phys2.street);
  setUnit(out, phys2.unitType, phys2.unitNum, {
    apt: F.PHYS2_UNIT?.[1],
    ste: F.PHYS2_UNIT?.[2],
    flr: F.PHYS2_UNIT?.[3],
    numFields: [F.PHYS2_UNIT?.[4]],
  });
  setText(out, F.PHYS2_UNIT?.[0], phys2.unitNum);

  setText(out, F.PHYS2_CITY, phys2.city);
  setText(out, F.PHYS2_STATE, phys2.state);
  setText(out, F.PHYS2_ZIP, phys2.zip);
  setText(out, F.PHYS2_PROV, phys2.province);
  setText(out, F.PHYS2_POSTAL, phys2.postal);
  setText(out, F.PHYS2_COUNTRY, phys2.country);
  setText(out, F.PHYS2_FROM, phys2.from);
  setText(out, F.PHYS2_TO, phys2.to);

  // Employment #1
  const emp1 = getAt(emp, 0);
  setText(out, F.EMP1_NAME, emp1.employer);
  setText(out, F.EMP1_STREET, emp1.street);
  setUnit(out, emp1.unitType, emp1.unitNum, {
    apt: F.EMP1_UNIT?.[1],
    ste: F.EMP1_UNIT?.[2],
    flr: F.EMP1_UNIT?.[3],
    numFields: [F.EMP1_UNIT?.[0], F.EMP1_UNIT?.[4]].filter(Boolean),
  });
  setText(out, F.EMP1_CITY, emp1.city);
  setText(out, F.EMP1_STATE, emp1.state);
  setText(out, F.EMP1_ZIP, emp1.zip);
  setText(out, F.EMP1_PROV, emp1.province);
  setText(out, F.EMP1_POSTAL, emp1.postal);
  setText(out, F.EMP1_COUNTRY, emp1.country);
  setText(out, F.EMP1_OCC, emp1.occupation);
  setText(out, F.EMP1_FROM, emp1.from);
  setText(out, F.EMP1_TO, emp1.to);

  // Employment #2
  const emp2 = getAt(emp, 1);
  setText(out, F.EMP2_NAME, emp2.employer);
  setText(out, F.EMP2_STREET, emp2.street);
  setUnit(out, emp2.unitType, emp2.unitNum, {
    apt: F.EMP2_UNIT?.[1],
    ste: F.EMP2_UNIT?.[2],
    flr: F.EMP2_UNIT?.[3],
    numFields: [F.EMP2_UNIT?.[0], F.EMP2_UNIT?.[4]].filter(Boolean),
  });
  setText(out, F.EMP2_CITY, emp2.city);
  setText(out, F.EMP2_STATE, emp2.state);
  setText(out, F.EMP2_ZIP, emp2.zip);
  setText(out, F.EMP2_PROV, emp2.province);
  setText(out, F.EMP2_POSTAL, emp2.postal);
  setText(out, F.EMP2_COUNTRY, emp2.country);
  setText(out, F.EMP2_OCC, emp2.occupation);
  setText(out, F.EMP2_FROM, emp2.from);
  setText(out, F.EMP2_TO, emp2.to);

  // Petitioner contact info
  setText(out, F.PET_PHONE, pet.phone);
  setText(out, F.PET_MOBILE, pet.mobile);
  setText(out, F.PET_EMAIL, pet.email);

  // Petitioner other info
  setSex(out, F.PET_SEX?.[1], F.PET_SEX?.[2], pet.sex);
  setText(out, F.PET_DOB, pet.dob);
  setMarital(out, {
    single: F.PET_MARITAL?.[1],
    married: F.PET_MARITAL?.[2],
    divorced: F.PET_MARITAL?.[3],
    widowed: F.PET_MARITAL?.[4],
  }, pet.maritalStatus);
  setText(out, F.PET_BCITY, pet.cityBirth);
  setText(out, F.PET_BPROV, pet.provinceBirth);
  setText(out, F.PET_BCOUNTRY, pet.countryBirth);

  // Petitioner parents
  const pp1 = getAt(pParents, 0);
  setText(out, F.PARENT1_LAST, pp1.lastName);
  setText(out, F.PARENT1_FIRST, pp1.firstName);
  setText(out, F.PARENT1_MID, pp1.middleName);
  setText(out, F.PARENT1_DOB, pp1.dob);
  setSex(out, F.PARENT1_SEX?.[1], F.PARENT1_SEX?.[2], pp1.sex);
  setText(out, F.PARENT1_BCOUNTRY, pp1.countryBirth);
  setText(out, F.PARENT1_RESCITY, pp1.currentCityCountry);
  setText(out, F.PARENT1_RESCOUNTRY, pp1.countryCurrent);

  const pp2 = getAt(pParents, 1);
  setText(out, F.PARENT2_LAST, pp2.lastName);
  setText(out, F.PARENT2_FIRST, pp2.firstName);
  setText(out, F.PARENT2_MID, pp2.middleName);
  setText(out, F.PARENT2_DOB, pp2.dob);
  setSex(out, F.PARENT2_SEX?.[1], F.PARENT2_SEX?.[2], pp2.sex);
  setText(out, F.PARENT2_BCOUNTRY, pp2.countryBirth);
  setText(out, F.PARENT2_RESCITY, pp2.currentCityCountry);
  setText(out, F.PARENT2_RESCOUNTRY, pp2.countryCurrent);

  // Naturalization cert: if any details exist, mark Yes
  const hasNat = !!(str(pet.natzNumber) || str(pet.natzPlace) || str(pet.natzDate));
  setYesNo(out, F.NATCERT_YN?.[1], F.NATCERT_YN?.[2], hasNat ? true : undefined);
  setText(out, F.NATCERT_NUM, pet.natzNumber);
  setText(out, F.NATCERT_PLACE, pet.natzPlace);
  setText(out, F.NATCERT_DATE, pet.natzDate);

  // --- Beneficiary ---
  const ben = saved.beneficiary || {};
  const benMail = ben.mailing || {};
  const benPhys = ben.physicalAddress || {};
  const benParents = Array.isArray(ben.parents) ? ben.parents : [];
  const benEmp = Array.isArray(ben.employment) ? ben.employment : [];

  setText(out, F.BEN_LAST, ben.lastName);
  setText(out, F.BEN_FIRST, ben.firstName);
  setText(out, F.BEN_MID, ben.middleName);
  setText(out, F.BEN_A, ben.aNumber);
  setText(out, F.BEN_SSN, ben.ssn);
  setText(out, F.BEN_DOB, ben.dob);

  setSex(out, F.BEN_SEX?.[1], F.BEN_SEX?.[2], ben.sex);
  setMarital(out, {
    single: F.BEN_MARITAL?.[1],
    married: F.BEN_MARITAL?.[2],
    divorced: F.BEN_MARITAL?.[3],
    widowed: F.BEN_MARITAL?.[4],
  }, ben.maritalStatus);

  setText(out, F.BEN_BCITY, ben.cityBirth);
  setText(out, F.BEN_BCOUNTRY, ben.countryBirth);
  setText(out, F.BEN_NAT, ben.nationality);

  // Beneficiary other names (first entry)
  const benOther0 = getAt(ben.otherNames, 0);
  setText(out, F.BEN_OTHER_LAST, benOther0.lastName);
  setText(out, F.BEN_OTHER_FIRST, benOther0.firstName);
  setText(out, F.BEN_OTHER_MID, benOther0.middleName);

  // Beneficiary mailing
  setText(out, F.BEN_MAIL_INCARE, benMail.inCareOf);
  setText(out, F.BEN_MAIL_STREET, benMail.street);
  setUnit(out, benMail.unitType, benMail.unitNum, {
    apt: F.BEN_MAIL_UNIT?.[1],
    ste: F.BEN_MAIL_UNIT?.[2],
    flr: F.BEN_MAIL_UNIT?.[3],
    numFields: [F.BEN_MAIL_UNIT?.[4]],
  });
  setText(out, F.BEN_MAIL_CITY, benMail.city);
  setText(out, F.BEN_MAIL_STATE, benMail.state);
  setText(out, F.BEN_MAIL_ZIP, benMail.zip);
  setText(out, F.BEN_MAIL_PROV, benMail.province);
  setText(out, F.BEN_MAIL_POSTAL, benMail.postal);
  setText(out, F.BEN_MAIL_COUNTRY, benMail.country);

  // Beneficiary in U.S. (template’s yes/no is stored as [group, NO, YES])
  setYesNo(out, F.BEN_INUS_YN?.[2], F.BEN_INUS_YN?.[1], ben.inUS);

  // U.S. status fields only if in US
  if (ben.inUS === true) {
    setText(out, F.BEN_CLASS, ben.classOfAdmission);
    setText(out, F.BEN_I94, ben.i94);
    setText(out, F.BEN_ARRIVAL, ben.arrivalDate);
    setText(out, F.BEN_STATUS_EXP, ben.statusExpires);
  }

  // Passport / travel doc
  setText(out, F.BEN_PASS_NO, ben.passportNumber);
  setText(out, F.BEN_TRAVEL_NO, ben.travelDocNumber);
  setText(out, F.BEN_PASS_CTRY, ben.passportCountry);
  setText(out, F.BEN_PASS_EXP, ben.passportExpiration);

  // Physical address to live (US vs Abroad)
  if (ben.inUS === true) {
    setText(out, F.BEN_US_STREET, benPhys.street);
    setUnit(out, benPhys.unitType, benPhys.unitNum, {
      apt: F.BEN_US_UNIT?.[1],
      ste: F.BEN_US_UNIT?.[2],
      flr: F.BEN_US_UNIT?.[3],
      numFields: [F.BEN_US_UNIT?.[4]],
    });
    setText(out, F.BEN_US_CITY, benPhys.city);
    setText(out, F.BEN_US_STATE, benPhys.state);
    setText(out, F.BEN_US_ZIP, benPhys.zip);
  } else if (ben.inUS === false) {
    setText(out, F.BEN_AB_STREET, benPhys.street);
    setUnit(out, benPhys.unitType, benPhys.unitNum, {
      apt: F.BEN_AB_UNIT?.[1],
      ste: F.BEN_AB_UNIT?.[2],
      flr: F.BEN_AB_UNIT?.[3],
      numFields: [F.BEN_AB_UNIT?.[4]],
    });
    setText(out, F.BEN_AB_CITY, benPhys.city);
    setText(out, F.BEN_AB_PROV, benPhys.province);
    setText(out, F.BEN_AB_COUNTRY, benPhys.country);
  }

  // Beneficiary employment #1
  const be1 = getAt(benEmp, 0);
  setText(out, F.BEN_EMP1_NAME, be1.employer);
  setText(out, F.BEN_EMP1_STREET, be1.street);
  setUnit(out, be1.unitType, be1.unitNum, {
    apt: F.BEN_EMP1_UNIT?.[1],
    ste: F.BEN_EMP1_UNIT?.[2],
    flr: F.BEN_EMP1_UNIT?.[3],
    numFields: [F.BEN_EMP1_UNIT?.[4]],
  });
  setText(out, F.BEN_EMP1_CITY, be1.city);
  setText(out, F.BEN_EMP1_STATE, be1.state);
  setText(out, F.BEN_EMP1_ZIP, be1.zip);
  setText(out, F.BEN_EMP1_PROV, be1.province);
  setText(out, F.BEN_EMP1_POSTAL, be1.postal);
  setText(out, F.BEN_EMP1_COUNTRY, be1.country);
  setText(out, F.BEN_EMP1_OCC, be1.occupation);
  setText(out, F.BEN_EMP1_FROM, be1.from);
  setText(out, F.BEN_EMP1_TO, be1.to);

  // Beneficiary employment #2
  const be2 = getAt(benEmp, 1);
  setText(out, F.BEN_EMP2_NAME, be2.employer);
  setText(out, F.BEN_EMP2_STREET, be2.street);
  setUnit(out, be2.unitType, be2.unitNum, {
    apt: F.BEN_EMP2_UNIT?.[1],
    ste: F.BEN_EMP2_UNIT?.[2],
    flr: F.BEN_EMP2_UNIT?.[3],
    numFields: [F.BEN_EMP2_UNIT?.[4]],
  });
  setText(out, F.BEN_EMP2_CITY, be2.city);
  setText(out, F.BEN_EMP2_STATE, be2.state);
  setText(out, F.BEN_EMP2_ZIP, be2.zip);
  setText(out, F.BEN_EMP2_PROV, be2.province);
  setText(out, F.BEN_EMP2_POSTAL, be2.postal);
  setText(out, F.BEN_EMP2_COUNTRY, be2.country);
  setText(out, F.BEN_EMP2_OCC, be2.occupation);
  setText(out, F.BEN_EMP2_FROM, be2.from);
  setText(out, F.BEN_EMP2_TO, be2.to);

  // Beneficiary parents
  const bp1 = getAt(benParents, 0);
  setText(out, F.BEN_PARENT1_LAST, bp1.lastName);
  setText(out, F.BEN_PARENT1_FIRST, bp1.firstName);
  setText(out, F.BEN_PARENT1_MID, bp1.middleName);
  setText(out, F.BEN_PARENT1_DOB, bp1.dob);
  setSex(out, F.BEN_PARENT1_SEX?.[1], F.BEN_PARENT1_SEX?.[2], bp1.sex);
  setText(out, F.BEN_PARENT1_BCOUNTRY, bp1.countryBirth);
  setText(out, F.BEN_PARENT1_RESCITY, bp1.currentCityCountry);
  setText(out, F.BEN_PARENT1_RESCOUNTRY, bp1.countryCurrent);

  const bp2 = getAt(benParents, 1);
  setText(out, F.BEN_PARENT2_LAST, bp2.lastName);
  setText(out, F.BEN_PARENT2_FIRST, bp2.firstName);
  setText(out, F.BEN_PARENT2_MID, bp2.middleName);
  setText(out, F.BEN_PARENT2_DOB, bp2.dob);
  setSex(out, F.BEN_PARENT2_SEX?.[1], F.BEN_PARENT2_SEX?.[2], bp2.sex);
  setText(out, F.BEN_PARENT2_BCOUNTRY, bp2.countryBirth);
  setText(out, F.BEN_PARENT2_RESCITY, bp2.currentCityCountry);
  setText(out, F.BEN_PARENT2_RESCOUNTRY, bp2.countryCurrent);

  // Interpreter
  const interpreter = saved.interpreter || {};
  if (interpreter.used) {
    setText(out, F.INT_NAME?.[0], interpreter.lastName);
    setText(out, F.INT_NAME?.[1], interpreter.firstName);
    setText(out, F.INT_BUS, interpreter.business);
    setText(out, F.INT_DAY, interpreter.phone1);
    setText(out, F.INT_MOB, interpreter.phone2);
    setText(out, F.INT_EMAIL, interpreter.email);
    setText(out, F.INT_LANG, interpreter.language);
    setText(out, F.INT_DATE, interpreter.signDate);
  }

  // Preparer
  const preparer = saved.preparer || {};
  if (preparer.used) {
    setText(out, F.PREP_NAME?.[0], preparer.lastName);
    setText(out, F.PREP_NAME?.[1], preparer.firstName);
    setText(out, F.PREP_BUS, preparer.business);
    setText(out, F.PREP_DAY, preparer.phone1);
    setText(out, F.PREP_MOB, preparer.phone2);
    setText(out, F.PREP_EMAIL, preparer.email);
    setText(out, F.PREP_DATE, preparer.signDate);
  }

  // Part 8 → Continued info blocks
  const p8 = saved.part8 || {};
  setText(out, F.CONT1, p8.line3d);
  setText(out, F.CONT2, p8.line4d);
  setText(out, F.CONT3, p8.line5d);
  setText(out, F.CONT4, p8.line6d);

  return out;
}
