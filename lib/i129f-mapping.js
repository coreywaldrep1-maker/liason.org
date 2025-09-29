// lib/i129f-mapping.js
// Exports:
//  - I129F_SECTIONS: used by wizard tabs
//  - I129F_DEBUG_FIELD_LIST: every exact PDF field name (from your Excel), for the inspector
//  - buildI129FPdfFields(form): returns { [pdfFieldName]: value } — robust to missing/boolean values

export const I129F_SECTIONS = [
  'Part 1 — Petitioner Information',
  'Part 2 — Information About Your Fiance(e)',
  'Part 3 — Other Information (Criminal/Legal)',
  'Part 4 — Information About Your Relationship',
  'Part 5 — Petitioner Contact Information',
  "Part 6 — Interpreter's Contact Information",
  "Part 7 — Preparer's Contact Information",
  'Part 8 — Additional Information'
];

// ---------- SAFETY HELPERS ----------
const toStr = (v) => (v == null ? '' : (typeof v === 'string' ? v : String(v)));
const set = (out, name, value) => {
  if (!name) return;
  const v = toStr(value);
  if (v !== '') out[name] = v;
};
const setYN = (out, yesField, noField, bool) => {
  if (bool === true) out[yesField] = 'Checked';
  else if (bool === false) out[noField] = 'Checked';
};
const setCheck = (out, name, bool) => {
  if (bool === true) out[name] = 'Checked';
};
const first = (arr) => (Array.isArray(arr) && arr.length ? arr[0] : undefined);

// ---------- MAIN MAPPER ----------
export function buildI129FPdfFields(form = {}) {
  const out = {};
  const P = form.petitioner || {};
  const B = form.beneficiary || {};
  const REL = form.relationship || {};
  const INT = form.interpreter || {};
  const PREP = form.preparer || {};
  const MAIL = P.mailingAddress || P.address || {};
  const PHYS1 = (P.addresses && P.addresses[0]) || P.physicalAddress || P.address || {};
  const PHYS2 = (P.addresses && P.addresses[1]) || {};
  const PHYS3 = (P.addresses && P.addresses[2]) || {};
  const BPADDR = (B.addresses && B.addresses[0]) || B.address || {};
  const BADDR2 = (B.addresses && B.addresses[1]) || {};
  const BADDR3 = (B.addresses && B.addresses[2]) || {};
  const BEMP1 = (B.employments && B.employments[0]) || B.employment || {};
  const BEMP2 = (B.employments && B.employments[1]) || {};
  const CRIM = form.criminal || form.petitionerCriminal || {};

  // ---- Part 1 — identifiers (1–5) ----
  set(out, 'Petitioner_Alien_Registration_page_1_Num_1', P.aNumber);
  set(out, 'Petitioner_USCIS_Online_Acct_Num_page_1_Num_2', P.uscisOnlineAccountNumber || P.uscisOnlineNumber);
  set(out, 'Petitioner_Social_Security_Num_page_1_num_3', P.ssn || P.ssnNumber);
  // 4a/4b K-1 / K-3
  setCheck(out, 'Petitioner_Request_Beneficiary_K1_page_1_Num_4a', P.classification === 'K1' || P.requestK1 === true);
  setCheck(out, 'Petitioner_Request_Beneficiary_K3_page_1_Num_4b', P.classification === 'K3' || P.requestK3 === true);
  // 5. I-130 filed? (two checkboxes in the PDF)
  setYN(out,
    'Petitioner_Filing_K3_Filed_I130__Yes',
    'Petitioner_Filing_K3_Filed_I130__No',
    P.filedI130
  );

  // ---- Part 1 — name (6–7) ----
  set(out, 'Petitioner_Family_Name_page_1_num_6a', P.lastName || P.familyName);
  set(out, 'Petitioner_Given_Name_page_1_6b', P.firstName || P.givenName);
  set(out, 'Petitioner_MiddleName_page1_6.c', P.middleName);

  const PON1 = first(P.otherNames);
  const PON2 = Array.isArray(P.otherNames) ? P.otherNames[1] : undefined;
  if (PON1) {
    set(out, 'Petitioner_Other_1_Family_Name_page1_7a', PON1.lastName || PON1.familyName);
    set(out, 'Petitioner_Other_1_Given_Name_page1_7b', PON1.firstName || PON1.givenName);
    set(out, 'Petitioner_Other_1_Middle_Name_page1_7c', PON1.middleName);
  }
  if (PON2) {
    set(out, 'Petitioner_Other_2_Family_Name_page_1_7.d.3', PON2.lastName || PON2.familyName);
    set(out, 'Petitioner_Other_2_Given_Name_page_1_7.e.3', PON2.firstName || PON2.givenName);
    set(out, 'Petitioner_Other_2_Middle_Name_page_1_7.f.3', PON2.middleName);
  }

  // ---- Part 1 — mailing (8) ----
  set(out, 'Petitioner_In_Care_Of_Name_page1_8a', MAIL.inCareOf || MAIL.careOf);
  set(out, 'Petitioner_Mailing_Street_num_namee_8b', MAIL.street || MAIL.street1 || MAIL.streetNumberName);
  set(out, 'Petitioner_ In_Care_of_Apt_Ste_Flr_Num_Question_Mark_page1_8c', MAIL.unitType); // 'Apt'|'Ste'|'Flr'
  set(out, 'Petitioner_Apt_Ste_Flr_Num_page1_8c', MAIL.unitNumber);
  set(out, 'Petitioner_Mailing_City_Town_page1_8d', MAIL.city);
  set(out, 'Petitioner_Mailing_State__page1_8e', MAIL.state);
  set(out, 'Petitioner_Mailing_Zip_Code_5and_4_num_page1_8f', MAIL.zip || MAIL.zip5 || MAIL.zipPlus4);
  set(out, 'Petitioner_Mailing_Province_page1_8g', MAIL.province);
  set(out, 'Petitioner_in_Care_of_Province_page1_8.g', MAIL.province);
  set(out, 'Petitioner_Mailing_Postal_Code_page1_8h', MAIL.postalCode);
  set(out, 'Petitioner_in_Care_of_Postal_Code_page1_8.h', MAIL.postalCode);
  set(out, 'Petitioner_Mailing_Country_page1_8i', MAIL.country);
  set(out, 'Petitioner_in_Care_of_Country_page1_8.i', MAIL.country);
  setYN(out,
    'Petitioner_is_mailing_address_same_as_physical_address_Y',
    'Petitioner_is_mailing_address_same_as_physical_address_N',
    MAIL.sameAsPhysical
  );

  // ---- Part 1 — physical address #1 (9 + 10) ----
  set(out, 'Petitioner_Address_1_History_Street_Numb_and_name_page2_9.a.', PHYS1.street || PHYS1.street1 || PHYS1.streetNumberName);
  set(out, 'Petitioner_Address_1_History_Apt_Suite_Floor_Num_page2_9.b', PHYS1.unitNumber);
  set(out, 'Petitioner_Address_1_History_City_or_town_page2_9.c.', PHYS1.city);
  set(out, 'Petitioner_Address_1_History_State_page2_9.d', PHYS1.state);
  set(out, 'Petitioner_Address_1_History_ZipCode_page2_9.e', PHYS1.zip);
  set(out, 'Petitioner_Address_1_History_Province_page2_9.f', PHYS1.province);
  set(out, 'Petitioner_Address_1_History_PostalCode_page2_9.g', PHYS1.postalCode);
  set(out, 'Petitioner_Address_1_History_Country_page2_9.h', PHYS1.country);
  set(out, 'Petitioner_Address_1_History_DateFrom_page2_10.a.', PHYS1.from || PHYS1.dateFrom || PHYS1.startDate);
  set(out, 'Petitioner_Address_1_History_DateTo_page2_10.b', PHYS1.to || PHYS1.dateTo || PHYS1.endDate);

  // ---- physical address #2 (11–13) ----
  set(out, 'Petitioner_Address_2_History_Street_Numb_and_name_page2_11.a', PHYS2.street || PHYS2.street1);
  set(out, 'Petitioner_Address_2_History_Apt_Suite_Floor_Num_page2_11.b', PHYS2.unitNumber);
  set(out, 'Petitioner_Address_2_History_City_or_town_page2_11.c.', PHYS2.city);
  set(out, 'Petitioner_Address_2_History_State_page2_11.d', PHYS2.state);
  set(out, 'Petitioner_Address_2_History_ZipCode_page2_11.e.', PHYS2.zip);
  set(out, 'Petitioner_Address_2_History_Province_page2_11.f', PHYS2.province);
  set(out, 'Petitioner_Address_2_History_PostalCode_page2_11.g', PHYS2.postalCode);
  set(out, 'Petitioner_Address_2_History_Country_page2_11.h', PHYS2.country);
  set(out, 'Petitioner_Address_2_History_DateFrom_page2_12.a', PHYS2.from || PHYS2.dateFrom || PHYS2.startDate);
  set(out, 'Petitioner_Address_2_History_DateTo_page2_13.a', PHYS2.to || PHYS2.dateTo || PHYS2.endDate);

  // ---- physical address #3 (14) ----
  set(out, 'Petitioner_Address_3_History_Street_Numb_and_name_page2_14.a', PHYS3.street || PHYS3.street1);
  set(out, 'Petitioner_Address_3_History_Apt_Suite_Floor_Num_page2_14.b', PHYS3.unitNumber);
  set(out, 'Petitioner_Address_3_History_City_or_town_page2_14.c', PHYS3.city);
  set(out, 'Petitioner_Address_3_History_State_page2_14.d', PHYS3.state);
  set(out, 'Petitioner_Address_3_History_ZipCode_page2_14.e', PHYS3.zip);
  set(out, 'Petitioner_Address_3_History_Province_page2_14.f', PHYS3.province);
  set(out, 'Petitioner_Address_3_History_PostalCode_page2_14.g', PHYS3.postalCode);
  set(out, 'Petitioner_Address_3_History_Country_page2_14.h', PHYS3.country);

  // ---- DOB / birth / citizenship / spouse / marital (15–21) ----
  set(out, 'Petitioner_Date_Of_Birth_page1_15', P.dob || P.dateOfBirth);
  set(out, 'Petitioner_Sex_CheckM_F_page1_16', P.sex);
  set(out, 'Petitioner_City_Of_Birth_page1_17a', P.birthCity || P?.birth?.city);
  set(out, 'Petitioner_Country_Of_Birth_page1_17b', P.birthCountry || P?.birth?.country);
  set(out, 'Petitioner_Country_Of_Cittizenship_Nationality_page1_18', P.citizenshipCountry || P.nationality);
  set(out, 'Petitioner_Country_Of_Formmer_Citizenship_page1__19', P.formerCitizenship);
  set(out, 'Petitioner_Spouses_Family_Name_page1__20a', P?.currentSpouse?.lastName || P?.spouse?.lastName);
  set(out, 'Petitioner_Spouses_Given_Name_page1_20b', P?.currentSpouse?.firstName || P?.spouse?.firstName);
  set(out, 'Petitioner_Spouses_Middle_Name_page1__20c', P?.currentSpouse?.middleName);
  set(out, 'Petitioner_Marital_Status_page1_21', P.maritalStatus);

  // ---- Parents (22–23) ----
  const PAR1 = (P.parents && P.parents[0]) || P.parent1 || {};
  const PAR2 = (P.parents && P.parents[1]) || P.parent2 || {};
  set(out, 'Petitioner_Parents_1_Family_Name_page1_22a', PAR1.lastName);
  set(out, 'Petitioner_Parents_1_Given_Name_page1_22b', PAR1.firstName);
  set(out, 'Petitioner_Parents_1_Middle_Name_page1_22c', PAR1.middleName);
  set(out, 'Petitioner_Parents_1_Date_Of_Birth_page1_22d', PAR1.dob || PAR1.dateOfBirth);
  set(out, 'Petitioner_Parents_1_Sex_check_M_or_F_page1_22e', PAR1.sex);
  set(out, 'Petitioner_Parents_1_Current_city_Or_Town_page1_22f', PAR1.city);
  set(out, 'Petitioner_Parents_1_Current_Country_page1_22g', PAR1.country);

  set(out, 'Petitioner_Parents_2_Family_Name_page2_23a', PAR2.lastName);
  set(out, 'Petitioner_Parents_2_Given_Name_page2_23b', PAR2.firstName);
  set(out, 'Petitioner_Parents_2_Middle_Name_page2_23c', PAR2.middleName);
  set(out, 'Petitioner_Parents_2_Date_Of_Birth_page2_23d', PAR2.dob || PAR2.dateOfBirth);
  set(out, 'Petitioner_Parents_2_Sex_Check_M_Or_F_page2_23e', PAR2.sex);
  set(out, 'Petitioner_Parents_2_Current_City_Or_Town_page2_23f', PAR2.city);
  set(out, 'Petitioner_Parents_2_Current_Country_page2_23g', PAR2.country);

  // ---- Beneficiary (page 3–5) ----
  set(out, 'Beneficiary_Family_Name_page3_1a', B.lastName);
  set(out, 'Beneficiary_Given_Name_page3_1b', B.firstName);
  set(out, 'Beneficiary_Middle_Name_page3_1c', B.middleName);

  const BON1 = first(B.otherNames);
  const BON2 = Array.isArray(B.otherNames) ? B.otherNames[1] : undefined;
  if (BON1) {
    set(out, 'Beneficiary_Other_1_Family_Name_page3_2a', BON1.lastName);
    set(out, 'Beneficiary_Other_1_Given_Name_page3_2b', BON1.firstName);
    set(out, 'Beneficiary_Other_1_Middle_Name_page3_2c', BON1.middleName);
  }
  if (BON2) {
    set(out, 'Beneficiary_Other_2_Family_Name_page3_2d', BON2.lastName);
    set(out, 'Beneficiary_Other_2_Given_Name_page3_2e', BON2.firstName);
    set(out, 'Beneficiary_Other_2_Middle_Name_page3_2f', BON2.middleName);
  }

  set(out, 'Beneficiary_Date_Of_Birth_page3_3', B.dob || B.dateOfBirth);
  set(out, 'Beneficiary_Sex_Check_M_Or_F_page3_4', B.sex);
  set(out, 'Beneficiary_City_Or_Town_Of_Birth_page3_5', B.birthCity || B?.birth?.city);
  set(out, 'Beneficiary_Country_Of_Birth_page3_6', B.birthCountry || B?.birth?.country);
  set(out, 'Beneficiary_Nationality_page3_7', B.citizenshipCountry || B.nationality);
  set(out, 'Beneficiary_Alien_Registration_Number_page3_8', B.aNumber);
  set(out, 'Beneficiary_USCIS_Online_Account_Num_page3_9', B.uscisOnlineAccountNumber || B.uscisOnlineNumber);
  set(out, 'Beneficiary_US_Social_Security_Number_page3_10', B.ssn);

  // Beneficiary addresses — current / prior 1 / prior 2
  set(out, 'Beneficiary_Current_Street_Number_Name_page3_11a', BPADDR.street || BPADDR.street1);
  set(out, 'Beneficiary_Current_AptSteFlr_Num_Question_Mark_page3_11b', BPADDR.unitType);
  set(out, 'Beneficiary_Current_AptSteFlr_Num_page3_11b', BPADDR.unitNumber);
  set(out, 'Beneficiary_Current_City_Town_page3_11c', BPADDR.city);
  set(out, 'Beneficiary_Current_State_page3_11d', BPADDR.state);
  set(out, 'Beneficiary_Current_Zip_Code_page3_11e', BPADDR.zip);
  set(out, 'Beneficiary_Current_Province_page3_11f', BPADDR.province);
  set(out, 'Beneficiary_Current_Postal_Code_page3_11g', BPADDR.postalCode);
  set(out, 'Beneficiary_Current_Country_page3_11h', BPADDR.country);

  set(out, 'Beneficiary_Prior_Address_1_Street_Number_Name_page3_12a', BADDR2.street || BADDR2.street1);
  set(out, 'Beneficiary_Prior_Address_1_Apt_Ste_Flr_Num_Question_Mark_page3_12b', BADDR2.unitType);
  set(out, 'Beneficiary_Prior_Address_1_Apt_Ste_Flr_Num_page3_12b', BADDR2.unitNumber);
  set(out, 'Beneficiary_Prior_Address_1_City_Or_Town_page3_12c', BADDR2.city);
  set(out, 'Beneficiary_Prior_Address_1_State_page3_12d', BADDR2.state);
  set(out, 'Beneficiary_Prior_Address_1_Zip_Code_page3_12e', BADDR2.zip);
  set(out, 'Beneficiary_Prior_Address_1_Province_page3_12f', BADDR2.province);
  set(out, 'Beneficiary_Prior_Address_1_Postal_Code_page3_12g', BADDR2.postalCode);
  set(out, 'Beneficiary_Prior_Address_1_Country_page3_12h', BADDR2.country);

  set(out, 'Beneficiary_Prior_Address_2_Street_Number_Name_page3_13a', BADDR3.street || BADDR3.street1);
  set(out, 'Beneficiary_Prior_Address_2_Apt_Ste_Flr_Num_Question_Mark_page3_13b', BADDR3.unitType);
  set(out, 'Beneficiary_Prior_Address_2_Apt_Ste_Flr_Num_page3_13b', BADDR3.unitNumber);
  set(out, 'Beneficiary_Prior_Address_2_City_Or_Town_page3_13c', BADDR3.city);
  set(out, 'Beneficiary_Prior_Address_2_State_page3_13d', BADDR3.state);
  set(out, 'Beneficiary_Prior_Address_2_Zip_Code_page3_13e', BADDR3.zip);
  set(out, 'Beneficiary_Prior_Address_2_Province_page3_13f', BADDR3.province);
  set(out, 'Beneficiary_Prior_Address_2_Postal_Code_page3_13g', BADDR3.postalCode);
  set(out, 'Beneficiary_Prior_Address_2_Country_page3_13h', BADDR3.country);

  // Beneficiary employment 1 & 2 (16–23)
  set(out, 'Beneficiary_Employer_1_Address_NameOfEmployer_page5_16', BEMP1.name || BEMP1.employerName);
  set(out, 'Beneficiary_Employer_1_Addres_StreetNumber_Name_page5_17.a.', BEMP1.street || BEMP1.street1);
  set(out, 'Beneficiary_Employer_1_Addres_Apt_Ste_Flr_num_Question_Mark_page5_17.b.', BEMP1.unitType);
  set(out, 'Beneficiary_Employer_1_Addres_City_Town_page5_17.c.', BEMP1.city);
  set(out, 'Beneficiary_Employer_1_Addres_State_page5_17.d.', BEMP1.state);
  set(out, 'Beneficiary_Employer_1_Addres_ZipCode_page5_17.e.', BEMP1.zip);
  set(out, 'Beneficiary_Employer_1_Addres_Province_page5_17.f.', BEMP1.province);
  set(out, 'Beneficiary_Employer_1_Addres_PostalCode_page5_17.g.', BEMP1.postalCode);
  set(out, 'Beneficiary_Employer_1_Addres_country_page5_17.h.', BEMP1.country);
  set(out, 'Beneficiary_Employer_1_Addres_Occupation_page5_18', BEMP1.occupation || BEMP1.jobTitle);
  set(out, 'Beneficiary_Employer_1_Addres_StartDate_page5_19.a.', BEMP1.from || BEMP1.startDate);
  set(out, 'Beneficiary_Employer_1_Addres_EndDate_page5_19.b.', BEMP1.to || BEMP1.endDate);

  set(out, 'Beneficiary_Employer_2_Address_NameOfEmployer_page5_20', BEMP2.name || BEMP2.employerName);
  set(out, 'Beneficiary_Employer_2_Address_StreetNumber_Name_page5_21.a', BEMP2.street || BEMP2.street1);
  set(out, 'Beneficiary_Employer_2_Address_AptSte_Flr_num_Question_mark_page5_21.b', BEMP2.unitType);
  set(out, 'Beneficiary_Employer_2_Address_City_Town_page5_21.c', BEMP2.city);
  set(out, 'Beneficiary_Employer_2_Address_State_page5_21.d', BEMP2.state);
  set(out, 'Beneficiary_Employer_2_Address_ZipCode_page5_21.e', BEMP2.zip);
  set(out, 'Beneficiary_Employer_2_Address_Province_page5_21.f', BEMP2.province);
  set(out, 'Beneficiary_Employer_2_Address_PostalCode_page5_21.g', BEMP2.postalCode);
  set(out, 'Beneficiary_Employer_2_Address_Country_page5_21.h', BEMP2.country);
  set(out, 'Beneficiary_Employer_2_Address_Occupation_page5_22', BEMP2.occupation || BEMP2.jobTitle);
  set(out, 'Beneficiary_Employer_2_Address_StartDate_page5_23.a', BEMP2.from || BEMP2.startDate);
  set(out, 'Beneficiary_Employer_2_Address_EndDate_page5_23.b', BEMP2.to || BEMP2.endDate);

  // ---- Part 3 — Criminal / Legal (page 6–7) ----
  setYN(out, 'Have_You_Ever_Arrested_charged_convicted_page6_1__Yes', 'Have_You_Ever_Arrested_charged_convicted_page6_1__No', CRIM.everArrested);
  setYN(out, 'Either_Perm_Jud_Or_investigain_Explain_page6_2__Yes', 'Either_Perm_Jud_Or_investigain_Explain_page6_2__No', CRIM.explainedInPart8);
  setYN(out, 'Have_You_Ever_Convicted_Domestic_violence_page6_3__Yes', 'Have_You_Ever_Convicted_Domestic_violence_page6_3__No', CRIM.domesticViolence);
  setYN(out, 'Three_Stalking_Or_Child_abuse_page6_3__Yes', 'Three_Stalking_Or_Child_abuse_page6_3__No', CRIM.stalkingOrChildAbuse);
  setYN(out, 'Any_Cruelty_or_involving_cruelty_page6_3__Yes', 'Any_Cruelty_or_involving_cruelty_page6_3__No', CRIM.crueltyOrNeglect);
  setYN(out, 'Restraining_Or_Protection_order_page6__4__Yes', 'Restraining_Or_Protection_order_page6__4__No', CRIM.restrainingOrder);
  setYN(out, 'Have_You_Ever_Sexual_contact_Minor_page6__5__Yes', 'Have_You_Ever_Sexual_contact_Minor_page6__5__No', CRIM.sexualContactWithMinor);
  setYN(out, 'Have_You_Ever_Release_without_permission_page6_6__Yes', 'Have_You_Ever_Release_without_permission_page6_6__No', CRIM.releaseWithoutPermission);
  setYN(out, 'Have_You_Ever_Sexually_Explicit_img_minor_page6_7__Yes', 'Have_You_Ever_Sexually_Explicit_img_minor_page6_7__No', CRIM.childPornography);
  setYN(out, 'Have_You_Ever_Types_criminal_activity_page6_8__Yes', 'Have_You_Ever_Types_criminal_activity_page6_8__No', CRIM.otherCriminalActivity);
  set(out, 'Explain_At_C_Explain_page6__9', CRIM.explanation || (CRIM.explainedInPart8 ? 'See Part 8' : ''));

  // ---- Part 5 — Petitioner contact (page 8) ----
  set(out, 'Petitioner_Daytime_telephone_Number_page8_1', P.dayPhone || P.phone);
  set(out, 'Petitioner_Mobile_Time_telephone_Number_page8_2', P.mobilePhone);
  set(out, 'Petitioner_Email_Address_page8_3', P.email);

  // ---- Part 6 — Interpreter (page 8–9) ----
  const usedInterpreter = !!(INT?.lastName || INT?.firstName || INT?.email || INT?.phone);
  setYN(out, 'did_you_use_an_interpreter_Yes', 'did_you_use_an_interpreter_No', usedInterpreter);

  set(out, 'Interpreter_Family_Name_page9_1a', INT.lastName);
  set(out, 'Interpreter_Given_Name_page9_1b', INT.firstName || INT.givenName);
  set(out, 'Interpreter_Business_Or_Org_Nam_page9_1c', INT.businessName);
  set(out, 'Interpreter_Day_Telephone_Num_page9_2', INT.dayPhone || INT.phone);
  set(out, 'Interpreter_Mobile_Telephone_Num_page9_3', INT.mobilePhone);
  set(out, 'Interpreter_EmailAddress_page9_4', INT.email);
  set(out, 'Interpreter_Address_Street_Number_Name_page9_5a', INT.street || INT?.address?.street);
  set(out, 'Interpreter_Address_AptSteFlr_question_mark_page9_5b', INT.unitType);
  set(out, 'Interpreter_Address_AptSteFlr__Number_page9_5b', INT.unitNumber);
  set(out, 'Interpreter_Address_City_or_Town_page9_5c', INT.city || INT?.address?.city);
  set(out, 'Interpreter_Address_State_page9_5d', INT.state || INT?.address?.state);
  set(out, 'Interpreter_Address_Zip_Code_page9_5e', INT.zip || INT?.address?.zip);
  set(out, 'Interpreter_Address_Province_page9_5f', INT.province || INT?.address?.province);
  set(out, 'Interpreter_Address_Postal_Code_page9_5g', INT.postalCode || INT?.address?.postalCode);
  set(out, 'Interpreter_Address_Country_page9_5h', INT.country || INT?.address?.country);

  // ---- Part 7 — Preparer (page 9–10) ----
  const usedPreparer = !!(PREP?.lastName || PREP?.firstName || PREP?.email || PREP?.phone);
  setYN(out, 'Did_You_Use_Prepar_Yes', 'Did_You_Use_Prepar_No', usedPreparer);

  set(out, 'Preparers_Family_Name_page9_1.a', PREP.lastName);
  set(out, 'Preparers_Given_Name_page9_1.b', PREP.firstName);
  set(out, 'Preparers_Business_Or_Org_Name_page9_2', PREP.businessName);
  set(out, 'Preparers_Street_Number_Name_page9_3a', PREP.street || PREP?.address?.street);
  set(out, 'Preparers_AptSteFlr_Question_mark_page9_3b', PREP.unitType);
  set(out, 'Preparers_AptSteFlr_nummber_page9_3b', PREP.unitNumber);
  set(out, 'Preparers_City_Or_Town_page9_3c', PREP.city || PREP?.address?.city);
  set(out, 'Preparers_State_page9_3d', PREP.state || PREP?.address?.state);
  set(out, 'Preparers_Zip_Code_page9_3e', PREP.zip || PREP?.address?.zip);
  set(out, 'Preparers_Province_page9_3f', PREP.province || PREP?.address?.province);
  set(out, 'Preparers_Postal_Code_page9_3g', PREP.postalCode || PREP?.address?.postalCode);
  set(out, 'Preparers_Country_page9_3h', PREP.country || PREP?.address?.country);
  set(out, 'Preparer_Contact_Daytime_Tel_page10_4', PREP.dayPhone || PREP.phone);
  set(out, 'Preparer_Contact_Mobile_Tel__page10_5', PREP.mobilePhone);
  set(out, 'Preparer_Contact_Email_Address__page10_6', PREP.email);

  // ---- Part 8 — Additional Info (page 11) ----
  const A8 = form.part8 || form.additionalInfo || {};
  set(out, 'Part_8_3d_pg_11', A8.line3d);
  set(out, 'Part_8_4d_page11', A8.line4d);
  set(out, 'Part_8_5d_page11', A8.line5d);
  set(out, 'Part_8_6d_page11', A8.line6d);

  return out;
}

// ---------- FULL DEBUG LIST (from your Excel) ----------
export const I129F_DEBUG_FIELD_LIST = [
  'Petitioner_Alien_Registration_page_1_Num_1',
  'Petitioner_USCIS_Online_Acct_Num_page_1_Num_2',
  'Petitioner_Social_Security_Num_page_1_num_3',
  'Petitioner_Request_Beneficiary_K1_page_1_Num_4a',
  'Petitioner_Request_Beneficiary_K3_page_1_Num_4b',
  'Petitioner_Filing_K3_Filed_I130__Yes        Petitioner_Filing_K3_Filed_I130__No',
  'Petitioner_Family_Name_page_1_num_6a',
  'Petitioner_Given_Name_page_1_6b',
  'Petitioner_MiddleName_page1_6.c',
  'Petitioner_Other_1_Family_Name_page1_7a',
  'Petitioner_Other_1_Given_Name_page1_7b',
  'Petitioner_Other_1_Middle_Name_page1_7c',
  'Petitioner_Other_2_Family_Name_page_1_7.d.3',
  'Petitioner_Other_2_Given_Name_page_1_7.e.3',
  'Petitioner_Other_2_Middle_Name_page_1_7.f.3',
  'Petitioner_In_Care_Of_Name_page1_8a',
  'Petitioner_Mailing_Street_num_namee_8b',
  'Petitioner_ In_Care_of_Apt_Ste_Flr_Num_Question_Mark_page1_8c',
  'Petitioner_Apt_Ste_Flr_Num_page1_8c',
  'Petitioner_Mailing_City_Town_page1_8d',
  'Petitioner_Mailing_State__page1_8e',
  'Petitioner_Mailing_Zip_Code_5and_4_num_page1_8f',
  'Petitioner_Mailing_Province_page1_8g',
  'Petitioner_in_Care_of_Province_page1_8.g',
  'Petitioner_Mailing_Postal_Code_page1_8h',
  'Petitioner_in_Care_of_Postal_Code_page1_8.h',
  'Petitioner_Mailing_Country_page1_8i',
  'Petitioner_in_Care_of_Country_page1_8.i',
  'Petitioner_is_mailing_address_same_as_physical_address_Y',
  'Petitioner_is_mailing_address_same_as_physical_address_N',
  'Petitioner_Address_1_History_Street_Numb_and_name_page2_9.a.',
  'Petitioner_Address_1_History_Apt_Suite_Floor_Num_page2_9.b',
  'Petitioner_Address_1_History_City_or_town_page2_9.c.',
  'Petitioner_Address_1_History_State_page2_9.d',
  'Petitioner_Address_1_History_ZipCode_page2_9.e',
  'Petitioner_Address_1_History_Province_page2_9.f',
  'Petitioner_Address_1_History_PostalCode_page2_9.g',
  'Petitioner_Address_1_History_Country_page2_9.h',
  'Petitioner_Address_1_History_DateFrom_page2_10.a.',
  'Petitioner_Address_1_History_DateTo_page2_10.b',
  'Petitioner_Address_2_History_Street_Numb_and_name_page2_11.a',
  'Petitioner_Address_2_History_Apt_Suite_Floor_Num_page2_11.b',
  'Petitioner_Address_2_History_City_or_town_page2_11.c.',
  'Petitioner_Address_2_History_State_page2_11.d',
  'Petitioner_Address_2_History_ZipCode_page2_11.e.',
  'Petitioner_Address_2_History_Province_page2_11.f',
  'Petitioner_Address_2_History_PostalCode_page2_11.g',
  'Petitioner_Address_2_History_Country_page2_11.h',
  'Petitioner_Address_2_History_DateFrom_page2_12.a',
  'Petitioner_Address_2_History_DateTo_page2_13.a',
  'Petitioner_Address_3_History_Street_Numb_and_name_page2_14.a',
  'Petitioner_Address_3_History_Apt_Suite_Floor_Num_page2_14.b',
  'Petitioner_Address_3_History_City_or_town_page2_14.c',
  'Petitioner_Address_3_History_State_page2_14.d',
  'Petitioner_Address_3_History_ZipCode_page2_14.e',
  'Petitioner_Address_3_History_Province_page2_14.f',
  'Petitioner_Address_3_History_PostalCode_page2_14.g',
  'Petitioner_Address_3_History_Country_page2_14.h',
  'Petitioner_Date_Of_Birth_page1_15',
  'Petitioner_Sex_CheckM_F_page1_16',
  'Petitioner_City_Of_Birth_page1_17a',
  'Petitioner_Country_Of_Birth_page1_17b',
  'Petitioner_Country_Of_Cittizenship_Nationality_page1_18',
  'Petitioner_Country_Of_Formmer_Citizenship_page1__19',
  'Petitioner_Spouses_Family_Name_page1__20a',
  'Petitioner_Spouses_Given_Name_page1_20b',
  'Petitioner_Spouses_Middle_Name_page1__20c',
  'Petitioner_Marital_Status_page1_21',
  'Petitioner_Parents_1_Family_Name_page1_22a',
  'Petitioner_Parents_1_Given_Name_page1_22b',
  'Petitioner_Parents_1_Middle_Name_page1_22c',
  'Petitioner_Parents_1_Date_Of_Birth_page1_22d',
  'Petitioner_Parents_1_Sex_check_M_or_F_page1_22e',
  'Petitioner_Parents_1_Current_city_Or_Town_page1_22f',
  'Petitioner_Parents_1_Current_Country_page1_22g',
  'Petitioner_Parents_2_Family_Name_page2_23a',
  'Petitioner_Parents_2_Given_Name_page2_23b',
  'Petitioner_Parents_2_Middle_Name_page2_23c',
  'Petitioner_Parents_2_Date_Of_Birth_page2_23d',
  'Petitioner_Parents_2_Sex_Check_M_Or_F_page2_23e',
  'Petitioner_Parents_2_Current_City_Or_Town_page2_23f',
  'Petitioner_Parents_2_Current_Country_page2_23g',
  'Beneficiary_Family_Name_page3_1a',
  'Beneficiary_Given_Name_page3_1b',
  'Beneficiary_Middle_Name_page3_1c',
  'Beneficiary_Other_1_Family_Name_page3_2a',
  'Beneficiary_Other_1_Given_Name_page3_2b',
  'Beneficiary_Other_1_Middle_Name_page3_2c',
  'Beneficiary_Other_2_Family_Name_page3_2d',
  'Beneficiary_Other_2_Given_Name_page3_2e',
  'Beneficiary_Other_2_Middle_Name_page3_2f',
  'Beneficiary_Date_Of_Birth_page3_3',
  'Beneficiary_Sex_Check_M_Or_F_page3_4',
  'Beneficiary_City_Or_Town_Of_Birth_page3_5',
  'Beneficiary_Country_Of_Birth_page3_6',
  'Beneficiary_Nationality_page3_7',
  'Beneficiary_Alien_Registration_Number_page3_8',
  'Beneficiary_USCIS_Online_Account_Num_page3_9',
  'Beneficiary_US_Social_Security_Number_page3_10',
  'Beneficiary_Current_Street_Number_Name_page3_11a',
  'Beneficiary_Current_AptSteFlr_Num_Question_Mark_page3_11b',
  'Beneficiary_Current_AptSteFlr_Num_page3_11b',
  'Beneficiary_Current_City_Town_page3_11c',
  'Beneficiary_Current_State_page3_11d',
  'Beneficiary_Current_Zip_Code_page3_11e',
  'Beneficiary_Current_Province_page3_11f',
  'Beneficiary_Current_Postal_Code_page3_11g',
  'Beneficiary_Current_Country_page3_11h',
  'Beneficiary_Prior_Address_1_Street_Number_Name_page3_12a',
  'Beneficiary_Prior_Address_1_Apt_Ste_Flr_Num_Question_Mark_page3_12b',
  'Beneficiary_Prior_Address_1_Apt_Ste_Flr_Num_page3_12b',
  'Beneficiary_Prior_Address_1_City_Or_Town_page3_12c',
  'Beneficiary_Prior_Address_1_State_page3_12d',
  'Beneficiary_Prior_Address_1_Zip_Code_page3_12e',
  'Beneficiary_Prior_Address_1_Province_page3_12f',
  'Beneficiary_Prior_Address_1_Postal_Code_page3_12g',
  'Beneficiary_Prior_Address_1_Country_page3_12h',
  'Beneficiary_Prior_Address_2_Street_Number_Name_page3_13a',
  'Beneficiary_Prior_Address_2_Apt_Ste_Flr_Num_Question_Mark_page3_13b',
  'Beneficiary_Prior_Address_2_Apt_Ste_Flr_Num_page3_13b',
  'Beneficiary_Prior_Address_2_City_Or_Town_page3_13c',
  'Beneficiary_Prior_Address_2_State_page3_13d',
  'Beneficiary_Prior_Address_2_Zip_Code_page3_13e',
  'Beneficiary_Prior_Address_2_Province_page3_13f',
  'Beneficiary_Prior_Address_2_Postal_Code_page3_13g',
  'Beneficiary_Prior_Address_2_Country_page3_13h',
  'Beneficiary_Employer_1_Address_NameOfEmployer_page5_16',
  'Beneficiary_Employer_1_Addres_StreetNumber_Name_page5_17.a.',
  'Beneficiary_Employer_1_Addres_Apt_Ste_Flr_num_Question_Mark_page5_17.b.',
  'Beneficiary_Employer_1_Addres_City_Town_page5_17.c.',
  'Beneficiary_Employer_1_Addres_State_page5_17.d.',
  'Beneficiary_Employer_1_Addres_ZipCode_page5_17.e.',
  'Beneficiary_Employer_1_Addres_Province_page5_17.f.',
  'Beneficiary_Employer_1_Addres_PostalCode_page5_17.g.',
  'Beneficiary_Employer_1_Addres_country_page5_17.h.',
  'Beneficiary_Employer_1_Addres_Occupation_page5_18',
  'Beneficiary_Employer_1_Addres_StartDate_page5_19.a.',
  'Beneficiary_Employer_1_Addres_EndDate_page5_19.b.',
  'Beneficiary_Employer_2_Address_NameOfEmployer_page5_20',
  'Beneficiary_Employer_2_Address_StreetNumber_Name_page5_21.a',
  'Beneficiary_Employer_2_Address_AptSte_Flr_num_Question_mark_page5_21.b',
  'Beneficiary_Employer_2_Address_City_Town_page5_21.c',
  'Beneficiary_Employer_2_Address_State_page5_21.d',
  'Beneficiary_Employer_2_Address_ZipCode_page5_21.e',
  'Beneficiary_Employer_2_Address_Province_page5_21.f',
  'Beneficiary_Employer_2_Address_PostalCode_page5_21.g',
  'Beneficiary_Employer_2_Address_Country_page5_21.h',
  'Beneficiary_Employer_2_Address_Occupation_page5_22',
  'Beneficiary_Employer_2_Address_StartDate_page5_23.a',
  'Beneficiary_Employer_2_Address_EndDate_page5_23.b',
  'Beneficiary_Prior_Marriage_1_FamilyName_page5_24a',
  'Beneficiary_Prior_Marriage_1_GivenName_page5_24b',
  'Beneficiary_Prior_Marriage_1_MiddleName_page5_24c',
  'Beneficiary_Prior_Marriage_1_StartDate_page5_25',
  'Beneficiary_Prior_Marriage_1_EndDate_page5_26',
  'Beneficiarry_Prior_Marriage_1_End_Reason_page5_27',
  'Have_You_Ever_Arrested_charged_convicted_page6_1__Yes        Have_You_Ever_Arrested_charged_convicted_page6_1__No',
  'Either_Perm_Jud_Or_investigain_Explain_page6_2__Yes        Either_Perm_Jud_Or_investigain_Explain_page6_2__No',
  'Have_You_Ever_Convicted_Domestic_violence_page6_3__Yes        Have_You_Ever_Convicted_Domestic_violence_page6_3__No',
  'Three_Stalking_Or_Child_abuse_page6_3__Yes        Three_Stalking_Or_Child_abuse_page6_3__No',
  'Any_Cruelty_or_involving_cruelty_page6_3__Yes        Any_Cruelty_or_involving_cruelty_page6_3__No',
  'Restraining_Or_Protection_order_page6__4__Yes        Restraining_Or_Protection_order_page6__4__No',
  'Have_You_Ever_Sexual_contact_Minor_page6__5__Yes        Have_You_Ever_Sexual_contact_Minor_page6__5__No',
  'Have_You_Ever_Release_without_permission_page6_6__Yes        Have_You_Ever_Release_without_permission_page6_6__No',
  'Have_You_Ever_Sexually_Explicit_img_minor_page6_7__Yes        Have_You_Ever_Sexually_Explicit_img_minor_page6_7__No',
  'Have_You_Ever_Types_criminal_activity_page6_8__Yes        Have_You_Ever_Types_criminal_activity_page6_8__No',
  'Explain_At_C_Explain_page6__9',
  'Petitioner_Daytime_telephone_Number_page8_1',
  'Petitioner_Mobile_Time_telephone_Number_page8_2',
  'Petitioner_Email_Address_page8_3',
  'did_you_use_an_interpreter_Yes        did_you_use_an_interpreter_No',
  'Interpreter_Family_Name_page9_1a',
  'Interpreter_Given_Name_page9_1b',
  'Interpreter_Business_Or_Org_Nam_page9_1c',
  'Interpreter_Day_Telephone_Num_page9_2',
  'Interpreter_Mobile_Telephone_Num_page9_3',
  'Interpreter_EmailAddress_page9_4',
  'Interpreter_Address_Street_Number_Name_page9_5a',
  'Interpreter_Address_AptSteFlr_question_mark_page9_5b',
  'Interpreter_Address_AptSteFlr__Number_page9_5b',
  'Interpreter_Address_City_or_Town_page9_5c',
  'Interpreter_Address_State_page9_5d',
  'Interpreter_Address_Zip_Code_page9_5e',
  'Interpreter_Address_Province_page9_5f',
  'Interpreter_Address_Postal_Code_page9_5g',
  'Interpreter_Address_Country_page9_5h',
  'Did_You_Use_Prepar_Yes        Did_You_Use_Prepar_No',
  'Preparers_Family_Name_page9_1.a',
  'Preparers_Given_Name_page9_1.b',
  'Preparers_Business_Or_Org_Name_page9_2',
  'Preparers_Street_Number_Name_page9_3a',
  'Preparers_AptSteFlr_Question_mark_page9_3b',
  'Preparers_AptSteFlr_nummber_page9_3b',
  'Preparers_City_Or_Town_page9_3c',
  'Preparers_State_page9_3d',
  'Preparers_Zip_Code_page9_3e',
  'Preparers_Province_page9_3f',
  'Preparers_Postal_Code_page9_3g',
  'Preparers_Country_page9_3h',
  'Preparer_Contact_Daytime_Tel_page10_4',
  'Preparer_Contact_Mobile_Tel__page10_5',
  'Preparer_Contact_Email_Address__page10_6',
  'Part_8_3d_pg_11',
  'Part_8_4d_page11',
  'Part_8_5d_page11',
  'Part_8_6d_page11'
];

export default buildI129FPdfFields;
