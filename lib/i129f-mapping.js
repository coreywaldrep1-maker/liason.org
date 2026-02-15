/**
 * I‑129F wizard → PDF field mapping
 *
 * Notes:
 * - This mapper is intentionally defensive: it will silently skip fields that
 *   don't exist in the current PDF template.
 * - Direct PDF overrides (saved.pdf / saved.pdfOverrides / saved.pdfFieldValues)
 *   are applied *after* this mapping by the API route.
 */

// -----------------------------
// Small helpers
// -----------------------------

function isBlank(v) {
  return v === undefined || v === null || (typeof v === "string" && v.trim() === "");
}

function toStr(v) {
  if (v === undefined || v === null) return "";
  return String(v);
}

function pad2(n) {
  const s = String(n);
  return s.length === 1 ? `0${s}` : s;
}

/**
 * Convert a date-ish value into MM/DD/YYYY.
 * Accepts:
 * - YYYY-MM-DD (HTML date input)
 * - MM/DD/YYYY
 * - Date
 */
function fmtDate(v) {
  if (isBlank(v)) return "";
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    const mm = pad2(v.getMonth() + 1);
    const dd = pad2(v.getDate());
    const yyyy = String(v.getFullYear());
    return `${mm}/${dd}/${yyyy}`;
  }

  const s = toStr(v).trim();
  if (!s) return "";

  // Already looks like MM/DD/YYYY
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (mdy) {
    const mm = pad2(Number(mdy[1]));
    const dd = pad2(Number(mdy[2]));
    const yyyy = mdy[3].length === 2 ? `20${mdy[3]}` : mdy[3];
    return `${mm}/${dd}/${yyyy}`;
  }

  // YYYY-MM-DD
  const ymd = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymd) {
    const yyyy = ymd[1];
    const mm = pad2(Number(ymd[2]));
    const dd = pad2(Number(ymd[3]));
    return `${mm}/${dd}/${yyyy}`;
  }

  // YYYY/MM/DD
  const ymd2 = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (ymd2) {
    const yyyy = ymd2[1];
    const mm = pad2(Number(ymd2[2]));
    const dd = pad2(Number(ymd2[3]));
    return `${mm}/${dd}/${yyyy}`;
  }

  return s;
}

function yesNoToBool(v) {
  if (v === true) return true;
  if (v === false) return false;
  const s = toStr(v).trim().toLowerCase();
  if (!s) return null;
  if (["yes", "y", "true", "1"].includes(s)) return true;
  if (["no", "n", "false", "0"].includes(s)) return false;
  return null;
}

function splitCityCountry(v) {
  const s = toStr(v).trim();
  if (!s) return { city: "", country: "" };
  if (!s.includes(",")) return { city: s, country: "" };
  const parts = s
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 1) return { city: parts[0], country: "" };
  return { city: parts[0], country: parts[parts.length - 1] };
}

// -----------------------------
// PDF setters (safe)
// -----------------------------

function safeSetText(form, name, value) {
  const s = toStr(value).trim();
  if (s === "") return;
  try {
    form.getTextField(name).setText(s);
  } catch (_) {
    // ignore
  }
}

function safeSetDate(form, name, value) {
  const s = fmtDate(value);
  if (!s) return;
  safeSetText(form, name, s);
}

function safeSetCheckbox(form, name, value) {
  const b = yesNoToBool(value);
  if (b === null) return;
  try {
    const cb = form.getCheckBox(name);
    if (b) cb.check();
    else cb.uncheck();
  } catch (_) {
    // ignore
  }
}

function safeSelectRadioByMatch(form, groupName, matcher) {
  try {
    const rg = form.getRadioGroup(groupName);
    const opts = rg.getOptions();
    const pick = opts.find((o) => matcher(o));
    if (pick) rg.select(pick);
  } catch (_) {
    // ignore
  }
}

function safeSelectYesNoRadio(form, groupName, value) {
  const b = yesNoToBool(value);
  if (b === null) return;
  safeSelectRadioByMatch(form, groupName, (o) => (b ? /Yes/i.test(o) : /No/i.test(o)));
}

function safeSelectSexRadio(form, groupName, value) {
  const s = toStr(value).trim().toLowerCase();
  if (!s) return;
  if (s.startsWith("m")) safeSelectRadioByMatch(form, groupName, (o) => /Male/i.test(o));
  else if (s.startsWith("f")) safeSelectRadioByMatch(form, groupName, (o) => /Female/i.test(o));
}

function normalizeUnitType(v) {
  const s = toStr(v).trim().toLowerCase();
  if (!s) return "";
  if (s.includes("apt")) return "apt";
  if (s.includes("ste") || s.includes("suite")) return "ste";
  if (s.includes("flr") || s.includes("floor")) return "flr";
  return "";
}

function safeSetUnit(form, typeGroupName, numberFieldName, unitType, unitNumber) {
  const t = normalizeUnitType(unitType);
  if (t) {
    safeSelectRadioByMatch(form, typeGroupName, (o) => {
      if (t === "apt") return /Apt/i.test(o);
      if (t === "ste") return /(Ste|Suite)/i.test(o);
      if (t === "flr") return /(Flr|Floor)/i.test(o);
      return false;
    });
  }
  safeSetText(form, numberFieldName, unitNumber);
}

function safeUncheckAll(form, checkboxNames) {
  checkboxNames.forEach((name) => safeSetCheckbox(form, name, false));
}

// -----------------------------
// Field name constants (current PDF)
// -----------------------------

const F = {
  // Petitioner (Part 1)
  P_A_NUMBER: "Petitioner_Alien_Registration_page_1_Num_1",
  P_SSN: "Petitioner_Social_Security_Num_page_1_Num_3",
  P_CLASSIFICATION: "Petitioner_Select_One_box_Classification_of_Beneficiary",
  P_FILED_I130: "Petitioner_Filing_K3_Visa_Check_Yes_No_page_1_number5",

  P_LAST: "Petitioner_Family_Name_Last_Name_page1_6a",
  P_FIRST: "Petitioner_Given_Name_First_Name_page1_6b",
  P_MIDDLE: "Petitioner_MiddleName_page1_6.c",

  // Other names used (Item 7)
  P_OTHER_LAST: "Petitioner_Other_Names_Used_Family_Name_page_1_Num_7a",
  P_OTHER_FIRST: "Petitioner_Other_Names_Used_Given_Name_page_1_Num_7.b",
  P_OTHER_MIDDLE: "Petitioner_Other_Names_Used_Middle_Name_page_1_Num_7.c",

  // Continuation for Item 7 on Page 12
  P_OTHER2_LAST: "Petitioner_Other_Names_Used_From_7.a.-7.c._Last_Name_page12_1.a",
  P_OTHER2_FIRST: "Petitioner_Other_Names_Used_From_7.a.-7.c._Given_Name_page12_1.b",
  P_OTHER2_MIDDLE: "Petitioner_Other_Names_Used_From_7.a.-7.c._Middle_Name_page12_1.c",

  // Mailing address (Item 8)
  P_MAIL_INCARE: "Petitioner_In_Care_of_Name_page1_8.a",
  P_MAIL_STREET: "Petitioner_Street_Number_and_Name_Page1_8.b",
  P_MAIL_UNITTYPE: "Petitioner_ In_Care_of_Apt_Ste_Flr_Num_Question_page1_8.c",
  P_MAIL_UNITNUM: "Petitioner_in_care_of_APt_Ste_Flr_number_Page1_8.c",
  P_MAIL_CITY: "Petitioner_in_Care_of_City_or_Town_page1_8.d",
  P_MAIL_STATE: "Petitioner_in_Care_of_State_page1_8.e",
  P_MAIL_ZIP: "Petitioner_in_Care_of_ZipCode_page1_8.f",
  P_MAIL_PROVINCE: "Petitioner_in_Care_of_Province_page1_8.g",
  P_MAIL_POSTAL: "Petitioner_in_Care_of_Postal_Code_page1_8.h",
  P_MAIL_COUNTRY: "Petitioner_in_Care_of_Country_page1_8.i",
  P_MAIL_SAME_AS_PHYS: "Petitioner_is_mailing_address_same_as_physical_address_check_yes_or_no_page1_8.j",

  // Address history 1 (Items 9-10)
  P_ADDR1_STREET: "Petitioner_Address_1_History_Street_Numb_and_name_page2_9.a",
  P_ADDR1_UNITTYPE: "Petitioner_Address_1_History_Apt_Suite_Floor_Number_Page2_9.b",
  P_ADDR1_UNITNUM: "Petitioner_Address_1_History_Apt_Ste_Floor_Checkbox_Page2_9.b",
  P_ADDR1_CITY: "Petitioner_Address_1_History_City_or_town_page2_9.c",
  P_ADDR1_STATE: "Petitioner_Address_1_History_State_page2_9.d",
  P_ADDR1_ZIP: "Petitioner_Address_1_History_ZipCode_page2_9.e",
  P_ADDR1_PROVINCE: "Petitioner_Address_1_History_Province_page2_9.f",
  P_ADDR1_POSTAL: "Petitioner_Address_1_History_PostalCode_page2_9.g",
  P_ADDR1_COUNTRY: "Petitioner_Address_1_History_Country_page2_9.h",
  P_ADDR1_FROM: "Petitioner_Address_1_History_DateFrom_page2_10.a",
  P_ADDR1_TO: "Petitioner_Address_1_History_DateTo_page2_10.b",

  // Address history 2 (Items 11-12)
  P_ADDR2_STREET: "Petitioner_Address_2_History_Street_Numb_and_name_page2_11.a",
  P_ADDR2_UNITTYPE: "Petitioner_Address_2_History_Apt_Suite_Floor_Number_Page2_11.b",
  P_ADDR2_UNITNUM: "Petitioner_Address_2_History_Apt_Ste_Floor_Checkbox_Page2_11.b",
  P_ADDR2_CITY: "Petitioner_Address_2_History_City_or_town_page2_11.c",
  P_ADDR2_STATE: "Petitioner_Address_2_History_State_page2_11.d",
  P_ADDR2_ZIP: "Petitioner_Address_2_History_ZipCode_page2_11.e",
  P_ADDR2_PROVINCE: "Petitioner_Address_2_History_Province_page2_11.f",
  P_ADDR2_POSTAL: "Petitioner_Address_2_History_PostalCode_page2_11.g",
  P_ADDR2_COUNTRY: "Petitioner_Address_2_History_Country_page2_11.h",
  P_ADDR2_FROM: "Petitioner_Address_2_History_DateFrom_page2_12.a",
  P_ADDR2_TO: "Petitioner_Address_2_History_DateTo_page2_12.b",

  // Petitioner other information
  P_SEX: "Petitioner_Other_Information_Sex_page3_21",
  P_DOB: "Petitioner_Other_Information_Date_of_birth_page3_22",
  P_CITY_BIRTH: "Petitioner_Other_Information_City_Town_Village_Birth_page3_24",
  P_COUNTRY_BIRTH: "Petitioner_Other_Information_Country_of_Birth_page3_26",
  P_CITIZENSHIP_ACQ: "Petitioner_Citizenship_Information_page3_40",

  // Petitioner parents
  P_PAR1_LAST: "Petitioner_Parent_1_Family Name_page3_27.a",
  P_PAR1_FIRST: "Petitioner_Parent_1_GivenName_page3_27.b",
  P_PAR1_MIDDLE: "Petitioner_Parent_1_MiddleName_page3_27.c",
  P_PAR1_DOB: "Petitioner_Parent_1_DateOfBirth_page3_28",
  P_PAR1_SEX: "Petitioner_Parent_1_Sex_Check_Male_Female_page3_29",
  P_PAR1_COUNTRY_BIRTH: "Petitioner_Parent_1_CountryOfBirth_page3_30",
  P_PAR1_CITY_RES: "Petitioner_Parent_1_CityTownVillage_Residence_page3_31.a",
  P_PAR1_COUNTRY_RES: "Petitioner_Parent_1_Country_Residence_page3_31.b",

  P_PAR2_LAST: "Petitioner_Parent_2_Family Name_page3_32.a",
  P_PAR2_FIRST: "Petitioner_Parent_2_GivenName_page3_32.b",
  P_PAR2_MIDDLE: "Petitioner_Parent_2_MiddleName_page3_32.c",
  P_PAR2_DOB: "Petitioner_Parent_2_DateOfBirth_page3_33",
  P_PAR2_SEX: "Petitioner_Parent_2_Sex_Check_Male_Female_page3_34",
  P_PAR2_COUNTRY_BIRTH: "Petitioner_Parent_2_CountryOfBirth_page3_35",
  P_PAR2_CITY_RES: "Petitioner_Parent_2_CityTownVillage_Residence_page3_36.a",
  P_PAR2_COUNTRY_RES: "Petitioner_Parent_2_Country_Residence_page3_36.b",

  // Criminal history section (Petitioner)
  C_RESTRAINING:
    "Beneficiary_Information_Criminal_Ever_Subject_Temporary_Permanent_Protection_Or_Restraining_Order_Yes_No_Checkboxes_page8_1",
  C_2A: "Beneficiary_Information_Criminal_Ever_Arreted_Convicted_Yes_No_Checkboxes_page8_2.a",
  C_2B: "Beneficiary_Information_Criminal_Ever_Arreted_Convicted_Yes_No_Checkboxes_page9_2.b",
  C_2C:
    "Beneficiary_Information_Criminal_Ever_Arreted_Three_Or_More_arrets_Convictions_Yes_No_Checkboxes_page9_2.c",
  C_REASON_SELFDEF:
    "Beneficiary_Information_Criminal_Reasons_For_Arrest_Conviction_Self-defense_page9_3.a",
  C_REASON_VIOLATED_PO:
    "Beneficiary_Information_Criminal_Reasons_For_Arrest_Conviction_Violated_Protection_Order_page9_3.b",
  C_REASON_BATTERED:
    "Beneficiary_Information_Criminal_Reasons_For_Arrest_Conviction_Violated_Commited_Arrested_Convicted_Guilty_Connection_Battered_Cruelty_page9_3.c",
  C_4A_FINE500_YN: "Beneficiary_Information_Criminal_Fine_$500_Or_More_Yes_No_Checkboxes_page9_4.a",
  C_4B_DETAILS:
    "Beneficiary_Information_Criminal_Checked_Yes_To_4.a._Provide_Information_page9_4.b",
  C_WAIVER_GENERAL: "Beneficiary_Information_Criminal_Waiver_Request_General_Waiver_page9_5.a",
  C_WAIVER_EXTRA:
    "Beneficiary_Information_Criminal_Waiver_Request_Extraordinary_Circumstances_Waiver_page9_5.b",
  C_WAIVER_MANDATORY:
    "Beneficiary_Information_Criminal_Waiver_Request_Mandatory_Waiver_page9_5.c",
  C_WAIVER_NA: "Beneficiary_Information_Criminal_Waiver_Not_applicable_page9_5.d",

  // Petitioner contact info (Part 4 in this PDF)
  CONTACT_DAY: "Petitioners_Contact_Information_daytime_Phone_Number_page10_1",
  CONTACT_MOBILE: "Petitioners_Contact_Information_Mobile_Phone_Number_page10_2",
  CONTACT_EMAIL: "Petitioners_Contact_Information_Email_Address_page10_3",

  // Interpreter
  I_LAST: "Interpreter_Contact_Information_Family_Name_page10_1",
  I_FIRST: "Interpreter_Contact_Information_Given_Name_page10_1",
  I_BUSINESS: "Interpreter_Contact_Information_Business_Organization_Name_page10_2",
  I_PHONE: "Interpreter_Contact_Information_Daytime_Phone_page10_3",
  I_EMAIL: "Interpreter_Contact_Information_Email_Address_page10_5",
  I_SIGNDATE: "Interpreter_Certification_Date_Of_Signature_page10_6",

  // Preparer
  PR_LAST: "Prepare_Full_Name_Family_Name_page10_1",
  PR_FIRST: "Prepare_Full_Name_First_Name_page10_1",
  PR_BUSINESS: "Prepare_Full_Name_Business_Organization_page10_2",
  PR_PHONE: "Prepare_Contact_Information_Daytime_Phone_Number_page10_3",
  PR_EMAIL: "Prepare_Contact_Information_Email_Address_page10_5",
  PR_SIGNDATE: "Prepare_Date_Of_Signature_page11_6",

  // Beneficiary (Part 2)
  B_LAST: "Beneficiary_Family_Name_Last_Name_page4_1.a",
  B_FIRST: "Beneficiary_Given_Name_First_Name_page4_1.b",
  B_MIDDLE: "Beneficiary_Middle_Name_page4_1.c",
  B_A_NUMBER: "Beneficiary_A_Number_if_any_page4_2",
  B_SSN: "Beneficiary_Social_Security_if_any_page4_3",
  B_DOB: "Beneficiary_Date_Of_Birth_page4_4",
  B_CITY_BIRTH: "Beneficiary_City_Town_Village_Birth_page4_7",
  B_COUNTRY_BIRTH: "Beneficiary_Country_Birth_page4_8",
  B_NATIONALITY: "Beneficiary_Citizenship_Country_page4_9",
  B_OTHER_LAST: "Beneficiary_Other_Names_Used_Family_Name_page4_10.a",
  B_OTHER_FIRST: "Beneficiary_Other_Names_Used_Given_Name_page4_10.b",
  B_OTHER_MIDDLE: "Beneficiary_Other_Names_Used_Middle_Name_page4_10.c",

  // Beneficiary mailing address (Item 11)
  B_MAIL_INCARE: "Beneficiary_Mailing_Address_In_Care_of_Name_page5_11.a",
  B_MAIL_STREET: "Beneficiary_Mailing_Address_In_Care_of_StreetNumber_Name_page5_11.b",
  B_MAIL_UNITTYPE: "Beneficiary_Mailing_Address_In_Care_of_Apt_Ste_Flr_Number_page5_11.c",
  B_MAIL_UNITNUM:
    "Beneficiary_Mailing_Address_In_Care_of__Apt_Ste_Flr_Number_of_Type_page5_11.c",
  B_MAIL_CITY: "Beneficiary_Mailing_Address_In_Care_of_City_Or_town_page5_11.d",
  B_MAIL_STATE: "Beneficiary_Mailing_Address_In_Care_of_State_page5_11.e",
  B_MAIL_ZIP: "Beneficiary_Mailing_Address_In_Care_of_Zipcode_page5_11.f",
  B_MAIL_PROVINCE: "Beneficiary_Mailing_Address_In_Care_of_Province_page5_11.g",
  B_MAIL_POSTAL: "Beneficiary_Mailing_Address_In_Care_of_PostalCode_page5_11.h",
  B_MAIL_COUNTRY: "Beneficiary_Mailing_Address_In_Care_of_Country_page5_11.i",

  // Beneficiary address history 1 (Items 12-13)
  B_ADDR1_STREET: "Beneficiary_Mailing_Address_2_Street_page5_12.a",
  B_ADDR1_UNITTYPE: "Beneficiary_Mailing_Adress_2_Apt_Ste_Flr_Num_page5_12.b",
  B_ADDR1_UNITNUM: "Beneficiary_Mailing_Adress_2_Apt_Ste_Flr_Num_Field_page5_12.b",
  B_ADDR1_CITY: "Beneficiary_Mailing_Adress_2_City_or_town_page5_12.c",
  B_ADDR1_STATE: "Beneficiary_Mailing_Adress_2_State_page5_12.d",
  B_ADDR1_ZIP: "Beneficiary_Mailing_Adress_2_ZipCode_page5_12.e",
  B_ADDR1_PROVINCE: "Beneficiary_Mailing_Adress_2_Province_page5_12.f",
  B_ADDR1_POSTAL: "Beneficiary_Mailing_Adress_2_PostalCode_page5_12.g",
  B_ADDR1_COUNTRY: "Beneficiary_Mailing_Adress_2_Country_page5_12.h",
  B_ADDR1_FROM: "Beneficiary_Mailing_Adress_2_DateFrom_page5_13.a",
  B_ADDR1_TO: "Beneficiary_Mailing_Adress_2_DateTo_page5_13.b",

  // Beneficiary address history 2 (Items 14-15)
  B_ADDR2_STREET: "Beneficiary_Mailing_Adress_3_StreetNumber_Name_page5_14.a",
  B_ADDR2_UNITTYPE: "Beneficiary_Mailing_Adress_3_Apt_Ste_Flr_Num_page5_14.b",
  B_ADDR2_UNITNUM: "Beneficiary_Mailing_Adress_3_Num_Field_page5_14.b",
  B_ADDR2_CITY: "Beneficiary_Mailing_Adress_3_City_Or_town_page5_14.c",
  B_ADDR2_STATE: "Beneficiary_Mailing_Adress_3_State_page5_14.d",
  B_ADDR2_ZIP: "Beneficiary_Mailing_Adress_3_ZipCode_page5_14.e",
  B_ADDR2_PROVINCE: "Beneficiary_Mailing_Adress_3_Province_page5_14.f",
  B_ADDR2_POSTAL: "Beneficiary_Mailing_Adress_3_PostalCode_page5_14.g",
  B_ADDR2_COUNTRY: "Beneficiary_Mailing_Adress_3_Country_page5_14.h",
  B_ADDR2_FROM: "Beneficiary_Mailing_Adress_3_DateFrom_page5_15.a",
  B_ADDR2_TO: "Beneficiary_Mailing_Adress_3_DateTo_page5_15.b",

  // Beneficiary in US section
  B_INUS_YN: "Beneficiary_Other_Information_Beneficiary_Been_In_US_Previously_checkboxes_Yes_No_page6_37",
  B_INUS_CLASS: "Beneficiary_Other_Information_Beneficiary_Currently_In_US_EnteredAS_page6_38.a",
  B_INUS_I94: "Beneficiary_Other_Information_Beneficiary_Currently_In_US_I94_Arrival_Departure_Num_page6_38.b",
  B_INUS_ARRIVAL: "Beneficiary_Other_Information_Beneficiary_Currently_In_US_Date_Of_Arrival_page6_38.c",
  B_INUS_EXPIRES: "Beneficiary_Other_Information_Beneficiary_Currently_In_US_Date_Of_Expiration_Shown_I94_I95_page7_38.d",
  B_INUS_PASSPORT: "Beneficiary_Other_Information_Beneficiary_Currently_In_US_Passport_Number_page7_38.e",
  B_INUS_TRAVELDOC: "Beneficiary_Other_Information_Beneficiary_Currently_In_US_Travel_Doucment_Number_page7_38.f",
  B_INUS_PASSPORT_COUNTRY:
    "Beneficiary_Other_Information_Beneficiary_Currently_In_US_Travel_Country_Issuance_Passport_or_travel_Document_page7_38.g",
  B_INUS_PASSPORT_EXP:
    "Beneficiary_Other_Information_Beneficiary_Currently_In_US_Travel_EExpiration_Date_Issuance_Passport_or_travel_Document_page7_38.h",

  // Beneficiary biographic
  B_ETHNICITY: "Beneficiary_Information_Biographic_Information_Ethnicity_Hispanic_Not_Hispanic_Checkboxes_page9_1",
  B_RACE_ASIAN: "Beneficiary_Information_Biographic_Information_Race_Asian_Checkbox_page9_2",
  B_RACE_BLACK: "Beneficiary_Information_Biographic_Information_Race_Black_AfricanAmerican_Checkbox_page9_2",
  B_RACE_NHPI: "Beneficiary_Information_Biographic_Information_Race_NativeHawaiian_OtherPacificIslander_Checkbox_page9_2",
  B_RACE_WHITE: "Beneficiary_Information_Biographic_Information_Race_White_Checkbox_page9_2",
  B_HEIGHT_FT: "Beneficiary_Information_Biographic_Information_Height_Feet_Checkbox_page9_3",
  B_HEIGHT_IN: "Beneficiary_Information_Biographic_Information_Height_Inches_Checkbox_page9_3",
  B_WEIGHT_100: "Beneficiary_Information_Biographic_Information_Weight_100_Pound_Digit_Checkbox_page9_4",
  B_WEIGHT_10: "Beneficiary_Information_Biographic_Information_Weight_10_Digit_Holder_Checkbox_page9_4",
  B_WEIGHT_1: "Beneficiary_Information_Biographic_Information_Weight_Single_Pound_Digit_Checkbox_page9_4",
  B_EYE: "Beneficiary_Information_Biographic_Information_Eye_Color_Checkboxes_page9_5",
  B_HAIR: "Beneficiary_Information_Biographic_Information_Hair_Color_Checkboxes_page9_6",
};

const CONTINUED_INFO_LINES = [
  {
    page: "Continued_Information_1_Page_Number_Page12_3.a",
    part: "Continued_Information_1_Part_Number_Page12_3.b",
    item: "Continued_Information_1_Item_Number_Page12_3.c",
    expl: "Continued_Information_1_Explanation_Area_Page12_3.d",
  },
  {
    page: "Continued_Information_2_Page_Number_Page12_4.a",
    part: "Continued_Information_2_Part_Number_Page12_4.b",
    item: "Continued_Information_2_Item_Number_Page12_4.c",
    expl: "Continued_Information_2_Explanation_Area_Page12_4.d",
  },
  {
    page: "Continued_Information_3_Page_Number_Page12_5.a",
    part: "Continued_Information_3_Part_Number_Page12_5.b",
    item: "Continued_Information_3_Item_Number_Page12_5.c",
    expl: "Continued_Information_3_Explanation_Area_Page12_5.d",
  },
  {
    page: "Continued_Information_4_Page_Number_Page12_6.a",
    part: "Continued_Information_4_Part_Number_Page12_6.b",
    item: "Continued_Information_4_Item_Number_Page12_6.c",
    expl: "Continued_Information_4_Explanation_Area_Page12_6.d",
  },
  {
    page: "Continued_Information_5_Page_Number_Page12_7.a",
    part: "Continued_Information_5_Part_Number_Page12_7.b",
    item: "Continued_Information_5_Item_Number_Page12_7.c",
    expl: "Continued_Information_5_Explanation_Area_Page12_7.d",
  },
];

// -----------------------------
// Mapping helpers for repeated structures
// -----------------------------

function setName(form, fields, nameObj) {
  if (!nameObj) return;
  safeSetText(form, fields.last, nameObj.lastName);
  safeSetText(form, fields.first, nameObj.firstName);
  safeSetText(form, fields.middle, nameObj.middleName);
}

function setAddressBlock(form, addr, map) {
  if (!addr) return;
  if (map.inCareOf) safeSetText(form, map.inCareOf, addr.inCareOf);
  safeSetText(form, map.street, addr.street);
  if (map.unitType && map.unitNumber) {
    safeSetUnit(form, map.unitType, map.unitNumber, addr.unitType, addr.unitNumber);
  }
  safeSetText(form, map.city, addr.city);
  safeSetText(form, map.state, addr.state);
  safeSetText(form, map.zip, addr.zip);
  if (map.province) safeSetText(form, map.province, addr.province);
  if (map.postal) safeSetText(form, map.postal, addr.postal);
  safeSetText(form, map.country, addr.country);
  if (map.from) safeSetDate(form, map.from, addr.from);
  if (map.to) safeSetDate(form, map.to, addr.to);
}

function setWeightDigits(form, weightValue) {
  const s = toStr(weightValue).trim();
  if (!s) return;
  const n = Number.parseInt(s, 10);
  if (!Number.isFinite(n) || n < 0) return;

  const clamped = Math.min(n, 999);
  const hundreds = Math.floor(clamped / 100);
  const tens = Math.floor((clamped % 100) / 10);
  const ones = clamped % 10;

  safeSetText(form, F.B_WEIGHT_100, hundreds ? String(hundreds) : "");
  safeSetText(form, F.B_WEIGHT_10, clamped >= 10 ? String(tens) : "");
  safeSetText(form, F.B_WEIGHT_1, String(ones));
}

function setRaceCheckboxes(form, raceValue) {
  safeUncheckAll(form, [F.B_RACE_ASIAN, F.B_RACE_BLACK, F.B_RACE_NHPI, F.B_RACE_WHITE]);

  const raw = raceValue;
  const tokens = Array.isArray(raw)
    ? raw.map((x) => toStr(x))
    : toStr(raw)
        .split(/[,;]+/)
        .map((x) => x.trim());

  const norm = tokens
    .map((t) => t.toLowerCase())
    .filter((t) => t && t !== "n/a" && t !== "na");

  const has = (re) => norm.some((t) => re.test(t));
  if (has(/asian/)) safeSetCheckbox(form, F.B_RACE_ASIAN, true);
  if (has(/black|african/)) safeSetCheckbox(form, F.B_RACE_BLACK, true);
  if (has(/hawaiian|pacific|nhopi/)) safeSetCheckbox(form, F.B_RACE_NHPI, true);
  if (has(/white/)) safeSetCheckbox(form, F.B_RACE_WHITE, true);
}

function selectEyeColor(form, value) {
  const s = toStr(value).trim().toLowerCase();
  if (!s) return;
  safeSelectRadioByMatch(form, F.B_EYE, (o) => o.toLowerCase().includes(s));
}

function selectHairColor(form, value) {
  const s = toStr(value).trim().toLowerCase();
  if (!s) return;
  safeSelectRadioByMatch(form, F.B_HAIR, (o) => o.toLowerCase().includes(s));
}

function selectEthnicity(form, value) {
  const b = yesNoToBool(value);
  if (b === null) return;
  safeSelectRadioByMatch(form, F.B_ETHNICITY, (o) =>
    b ? /Hispanic/i.test(o) : /Not_Hispanic|Not Hispanic/i.test(o)
  );
}

function selectPetitionerClassification(form, value) {
  const s = toStr(value).trim().toLowerCase();
  if (!s) return;
  if (s.includes("k3")) safeSelectRadioByMatch(form, F.P_CLASSIFICATION, (o) => /K3/i.test(o));
  else if (s.includes("k1")) safeSelectRadioByMatch(form, F.P_CLASSIFICATION, (o) => /K1/i.test(o));
}

function selectCitizenshipAcquisition(form, value) {
  const s = toStr(value).trim().toLowerCase();
  if (!s) return;
  if (s.includes("birth")) safeSelectRadioByMatch(form, F.P_CITIZENSHIP_ACQ, (o) => /Birth/i.test(o));
  else if (s.includes("natural")) safeSelectRadioByMatch(form, F.P_CITIZENSHIP_ACQ, (o) => /Natural/i.test(o));
  else if (s.includes("parent")) safeSelectRadioByMatch(form, F.P_CITIZENSHIP_ACQ, (o) => /Parents/i.test(o));
}

// -----------------------------
// Part 8 (continued information) builder
// -----------------------------

function nameInline(n) {
  if (!n) return "";
  const last = toStr(n.lastName).trim();
  const first = toStr(n.firstName).trim();
  const mid = toStr(n.middleName).trim();
  const parts = [last, first, mid].filter(Boolean);
  return parts.join(", ").replace(/,\s*,/g, ", ");
}

function addrInline(a) {
  if (!a) return "";
  const bits = [];
  if (!isBlank(a.street)) bits.push(toStr(a.street).trim());
  const unitType = toStr(a.unitType).trim();
  const unitNum = toStr(a.unitNumber).trim();
  if (unitType || unitNum) bits.push([unitType, unitNum].filter(Boolean).join(" "));
  const cityStateZip = [toStr(a.city).trim(), toStr(a.state).trim(), toStr(a.zip).trim()]
    .filter(Boolean)
    .join(" ");
  if (cityStateZip) bits.push(cityStateZip);
  const country = toStr(a.country).trim();
  if (country) bits.push(country);
  const from = fmtDate(a.from);
  const to = fmtDate(a.to);
  if (from || to) bits.push(`From ${from || "—"} To ${to || "—"}`);
  return bits.join("; ");
}

function buildContinuedEntries(root) {
  const entries = [];
  const p = root?.petitioner || {};
  const b = root?.beneficiary || {};

  if (!isBlank(root?.additionalInfo)) {
    entries.push({ page: "", part: "", item: "", text: toStr(root.additionalInfo).trim() });
  }

  const pOther = Array.isArray(p.otherNamesUsed) ? p.otherNamesUsed : [];
  if (pOther.length > 2) {
    for (let i = 2; i < pOther.length; i++) {
      const t = nameInline(pOther[i]);
      if (!t) continue;
      entries.push({ page: "1", part: "1", item: "7", text: `Petitioner other name used: ${t}` });
    }
  }

  const pPhys = Array.isArray(p.physicalAddresses) ? p.physicalAddresses : [];
  if (pPhys.length > 2) {
    for (let i = 2; i < pPhys.length; i++) {
      const t = addrInline(pPhys[i]);
      if (!t) continue;
      entries.push({ page: "2", part: "1", item: "9", text: `Petitioner address history (additional): ${t}` });
    }
  }

  const bOther = Array.isArray(b.otherNames) ? b.otherNames : [];
  if (bOther.length > 1) {
    for (let i = 1; i < bOther.length; i++) {
      const t = nameInline(bOther[i]);
      if (!t) continue;
      entries.push({ page: "4", part: "2", item: "10", text: `Beneficiary other name used: ${t}` });
    }
  }

  const bPhys = Array.isArray(b.physicalAddresses) ? b.physicalAddresses : [];
  if (bPhys.length > 2) {
    for (let i = 2; i < bPhys.length; i++) {
      const t = addrInline(bPhys[i]);
      if (!t) continue;
      entries.push({ page: "5", part: "2", item: "12", text: `Beneficiary address history (additional): ${t}` });
    }
  }

  const max = CONTINUED_INFO_LINES.length;
  if (entries.length <= max) return entries;
  const head = entries.slice(0, max);
  const tail = entries.slice(max);
  const tailText = tail
    .map((e) => {
      const prefix = e.page || e.part || e.item ? `[p${e.page || ""} part${e.part || ""} item${e.item || ""}] ` : "";
      return `${prefix}${e.text}`.trim();
    })
    .filter(Boolean)
    .join("\n");
  head[max - 1] = {
    ...head[max - 1],
    text: [head[max - 1].text, tailText].filter(Boolean).join("\n"),
  };
  return head;
}

function applyContinuedInformation(form, root) {
  const entries = buildContinuedEntries(root);
  if (!entries.length) return;
  for (let i = 0; i < CONTINUED_INFO_LINES.length; i++) {
    const line = CONTINUED_INFO_LINES[i];
    const e = entries[i];
    if (!e) break;
    safeSetText(form, line.page, e.page);
    safeSetText(form, line.part, e.part);
    safeSetText(form, line.item, e.item);
    safeSetText(form, line.expl, e.text);
  }
}

// -----------------------------
// Public API
// -----------------------------

export function applyI129fMapping(root, form) {
  if (!root || !form) return;

  const petitioner = root.petitioner || {};
  const beneficiary = root.beneficiary || {};
  const contact = root.contact || {};
  const interpreter = root.interpreter || {};
  const preparer = root.preparer || {};

  // -----------------------------
  // Petitioner
  // -----------------------------
  safeSetText(form, F.P_A_NUMBER, petitioner.aNumber);
  safeSetText(form, F.P_SSN, petitioner.ssn);

  safeSetText(form, F.P_LAST, petitioner.lastName);
  safeSetText(form, F.P_FIRST, petitioner.firstName);
  safeSetText(form, F.P_MIDDLE, petitioner.middleName);

  selectPetitionerClassification(form, petitioner.classification);
  safeSelectYesNoRadio(form, F.P_FILED_I130, petitioner.filedI130);

  const pOther = Array.isArray(petitioner.otherNamesUsed) ? petitioner.otherNamesUsed : [];
  setName(form, { last: F.P_OTHER_LAST, first: F.P_OTHER_FIRST, middle: F.P_OTHER_MIDDLE }, pOther[0] || {});
  setName(form, { last: F.P_OTHER2_LAST, first: F.P_OTHER2_FIRST, middle: F.P_OTHER2_MIDDLE }, pOther[1] || {});

  const pMail = petitioner.mailing || {};
  setAddressBlock(form, pMail, {
    inCareOf: F.P_MAIL_INCARE,
    street: F.P_MAIL_STREET,
    unitType: F.P_MAIL_UNITTYPE,
    unitNumber: F.P_MAIL_UNITNUM,
    city: F.P_MAIL_CITY,
    state: F.P_MAIL_STATE,
    zip: F.P_MAIL_ZIP,
    province: F.P_MAIL_PROVINCE,
    postal: F.P_MAIL_POSTAL,
    country: F.P_MAIL_COUNTRY,
  });
  safeSelectYesNoRadio(form, F.P_MAIL_SAME_AS_PHYS, pMail.sameAsPhysical);

  const pPhys = Array.isArray(petitioner.physicalAddresses) ? petitioner.physicalAddresses : [];
  setAddressBlock(form, pPhys[0] || {}, {
    street: F.P_ADDR1_STREET,
    unitType: F.P_ADDR1_UNITTYPE,
    unitNumber: F.P_ADDR1_UNITNUM,
    city: F.P_ADDR1_CITY,
    state: F.P_ADDR1_STATE,
    zip: F.P_ADDR1_ZIP,
    province: F.P_ADDR1_PROVINCE,
    postal: F.P_ADDR1_POSTAL,
    country: F.P_ADDR1_COUNTRY,
    from: F.P_ADDR1_FROM,
    to: F.P_ADDR1_TO,
  });
  setAddressBlock(form, pPhys[1] || {}, {
    street: F.P_ADDR2_STREET,
    unitType: F.P_ADDR2_UNITTYPE,
    unitNumber: F.P_ADDR2_UNITNUM,
    city: F.P_ADDR2_CITY,
    state: F.P_ADDR2_STATE,
    zip: F.P_ADDR2_ZIP,
    province: F.P_ADDR2_PROVINCE,
    postal: F.P_ADDR2_POSTAL,
    country: F.P_ADDR2_COUNTRY,
    from: F.P_ADDR2_FROM,
    to: F.P_ADDR2_TO,
  });

  safeSelectSexRadio(form, F.P_SEX, petitioner.sex);
  safeSetDate(form, F.P_DOB, petitioner.dob);
  safeSetText(form, F.P_CITY_BIRTH, petitioner.cityBirth);
  safeSetText(form, F.P_COUNTRY_BIRTH, petitioner.countryBirth);
  selectCitizenshipAcquisition(form, petitioner?.citizenship?.acquisition);

  const pParents = Array.isArray(petitioner.parents) ? petitioner.parents : [];
  const p1 = pParents[0] || {};
  const p2 = pParents[1] || {};
  const p1Res = splitCityCountry(p1.currentCityCountry);
  const p2Res = splitCityCountry(p2.currentCityCountry);

  safeSetText(form, F.P_PAR1_LAST, p1.lastName);
  safeSetText(form, F.P_PAR1_FIRST, p1.firstName);
  safeSetText(form, F.P_PAR1_MIDDLE, p1.middleName);
  safeSetDate(form, F.P_PAR1_DOB, p1.dob);
  safeSelectSexRadio(form, F.P_PAR1_SEX, p1.sex);
  safeSetText(form, F.P_PAR1_COUNTRY_BIRTH, p1.countryBirth);
  safeSetText(form, F.P_PAR1_CITY_RES, p1Res.city);
  safeSetText(form, F.P_PAR1_COUNTRY_RES, p1Res.country);

  safeSetText(form, F.P_PAR2_LAST, p2.lastName);
  safeSetText(form, F.P_PAR2_FIRST, p2.firstName);
  safeSetText(form, F.P_PAR2_MIDDLE, p2.middleName);
  safeSetDate(form, F.P_PAR2_DOB, p2.dob);
  safeSelectSexRadio(form, F.P_PAR2_SEX, p2.sex);
  safeSetText(form, F.P_PAR2_COUNTRY_BIRTH, p2.countryBirth);
  safeSetText(form, F.P_PAR2_CITY_RES, p2Res.city);
  safeSetText(form, F.P_PAR2_COUNTRY_RES, p2Res.country);

  const crim = petitioner.criminal || {};
  safeSelectYesNoRadio(form, F.C_RESTRAINING, crim.restrainingOrder);
  safeSelectYesNoRadio(form, F.C_2A, crim.arrestedOrConvicted2a);
  safeSelectYesNoRadio(form, F.C_2B, crim.arrestedOrConvicted2b);
  safeSelectYesNoRadio(form, F.C_2C, crim.arrestedOrConvicted2c);

  safeSetCheckbox(form, F.C_REASON_SELFDEF, crim.reasonSelfDefense);
  safeSetCheckbox(form, F.C_REASON_VIOLATED_PO, crim.reasonViolatedProtectionOrder);
  safeSetCheckbox(form, F.C_REASON_BATTERED, crim.reasonBatteredCruelty);

  safeSelectYesNoRadio(form, F.C_4A_FINE500_YN, crim.everArrestedCitedCharged);
  safeSetText(form, F.C_4B_DETAILS, crim.everArrestedDetails);

  safeUncheckAll(form, [F.C_WAIVER_GENERAL, F.C_WAIVER_EXTRA, F.C_WAIVER_MANDATORY, F.C_WAIVER_NA]);
  const waiver = toStr(crim.waiverType).trim().toLowerCase();
  if (waiver) {
    if (waiver.includes("general")) safeSetCheckbox(form, F.C_WAIVER_GENERAL, true);
    else if (waiver.includes("extra")) safeSetCheckbox(form, F.C_WAIVER_EXTRA, true);
    else if (waiver.includes("mandatory")) safeSetCheckbox(form, F.C_WAIVER_MANDATORY, true);
    else if (waiver.includes("not") || waiver.includes("n/a") || waiver === "na") safeSetCheckbox(form, F.C_WAIVER_NA, true);
  }

  // -----------------------------
  // Beneficiary
  // -----------------------------
  safeSetText(form, F.B_LAST, beneficiary.lastName);
  safeSetText(form, F.B_FIRST, beneficiary.firstName);
  safeSetText(form, F.B_MIDDLE, beneficiary.middleName);
  safeSetText(form, F.B_A_NUMBER, beneficiary.aNumber);
  safeSetText(form, F.B_SSN, beneficiary.ssn);
  safeSetDate(form, F.B_DOB, beneficiary.dob);
  safeSetText(form, F.B_CITY_BIRTH, beneficiary.cityBirth);
  safeSetText(form, F.B_COUNTRY_BIRTH, beneficiary.countryBirth);
  safeSetText(form, F.B_NATIONALITY, beneficiary.nationality);

  const bOther = Array.isArray(beneficiary.otherNames) ? beneficiary.otherNames : [];
  setName(form, { last: F.B_OTHER_LAST, first: F.B_OTHER_FIRST, middle: F.B_OTHER_MIDDLE }, bOther[0] || {});

  const bMail = beneficiary.mailing || {};
  setAddressBlock(form, bMail, {
    inCareOf: F.B_MAIL_INCARE,
    street: F.B_MAIL_STREET,
    unitType: F.B_MAIL_UNITTYPE,
    unitNumber: F.B_MAIL_UNITNUM,
    city: F.B_MAIL_CITY,
    state: F.B_MAIL_STATE,
    zip: F.B_MAIL_ZIP,
    province: F.B_MAIL_PROVINCE,
    postal: F.B_MAIL_POSTAL,
    country: F.B_MAIL_COUNTRY,
  });

  const bPhys = Array.isArray(beneficiary.physicalAddresses) ? beneficiary.physicalAddresses : [];
  setAddressBlock(form, bPhys[0] || {}, {
    street: F.B_ADDR1_STREET,
    unitType: F.B_ADDR1_UNITTYPE,
    unitNumber: F.B_ADDR1_UNITNUM,
    city: F.B_ADDR1_CITY,
    state: F.B_ADDR1_STATE,
    zip: F.B_ADDR1_ZIP,
    province: F.B_ADDR1_PROVINCE,
    postal: F.B_ADDR1_POSTAL,
    country: F.B_ADDR1_COUNTRY,
    from: F.B_ADDR1_FROM,
    to: F.B_ADDR1_TO,
  });
  setAddressBlock(form, bPhys[1] || {}, {
    street: F.B_ADDR2_STREET,
    unitType: F.B_ADDR2_UNITTYPE,
    unitNumber: F.B_ADDR2_UNITNUM,
    city: F.B_ADDR2_CITY,
    state: F.B_ADDR2_STATE,
    zip: F.B_ADDR2_ZIP,
    province: F.B_ADDR2_PROVINCE,
    postal: F.B_ADDR2_POSTAL,
    country: F.B_ADDR2_COUNTRY,
    from: F.B_ADDR2_FROM,
    to: F.B_ADDR2_TO,
  });

  safeSelectYesNoRadio(form, F.B_INUS_YN, beneficiary.inUS);
  safeSetText(form, F.B_INUS_I94, beneficiary.i94);
  safeSetText(form, F.B_INUS_CLASS, beneficiary.classOfAdmission);
  safeSetDate(form, F.B_INUS_ARRIVAL, beneficiary.arrivalDate);
  safeSetDate(form, F.B_INUS_EXPIRES, beneficiary.statusExpires);
  safeSetText(form, F.B_INUS_PASSPORT, beneficiary.passportNumber);
  safeSetText(form, F.B_INUS_TRAVELDOC, beneficiary.travelDocNumber);
  safeSetText(form, F.B_INUS_PASSPORT_COUNTRY, beneficiary.passportCountry);
  safeSetDate(form, F.B_INUS_PASSPORT_EXP, beneficiary.passportExpiration);

  selectEthnicity(form, beneficiary.ethnicityHispanic);
  setRaceCheckboxes(form, beneficiary.race);
  safeSetText(form, F.B_HEIGHT_FT, beneficiary.heightFeet);
  safeSetText(form, F.B_HEIGHT_IN, beneficiary.heightInches);
  setWeightDigits(form, beneficiary.weight);
  selectEyeColor(form, beneficiary.eyeColor);
  selectHairColor(form, beneficiary.hairColor);

  // -----------------------------
  // Contact / Interpreter / Preparer
  // -----------------------------
  safeSetText(form, F.CONTACT_DAY, contact.daytimePhone);
  safeSetText(form, F.CONTACT_MOBILE, contact.mobile);
  safeSetText(form, F.CONTACT_EMAIL, contact.email);

  safeSetText(form, F.I_LAST, interpreter.lastName);
  safeSetText(form, F.I_FIRST, interpreter.firstName);
  safeSetText(form, F.I_BUSINESS, interpreter.business);
  safeSetText(form, F.I_PHONE, interpreter.phone);
  safeSetText(form, F.I_EMAIL, interpreter.email);
  safeSetDate(form, F.I_SIGNDATE, interpreter.signDate);

  safeSetText(form, F.PR_LAST, preparer.lastName);
  safeSetText(form, F.PR_FIRST, preparer.firstName);
  safeSetText(form, F.PR_BUSINESS, preparer.business);
  safeSetText(form, F.PR_PHONE, preparer.phone);
  safeSetText(form, F.PR_EMAIL, preparer.email);
  safeSetDate(form, F.PR_SIGNDATE, preparer.signDate);

  // Part 8: continued information
  applyContinuedInformation(form, root);
}

/**
 * Apply a direct PDF field-value map stored on the saved object.
 *
 * Supported shapes:
 * - saved.pdf
 * - saved.pdfOverrides
 * - saved.pdfFieldValues
 *
 * Values:
 * - text fields: any string/number
 * - checkbox: boolean / yes/no
 * - radio group: export value (exact option value)
 */
export function applyDirectPdfMap(form, root) {
  if (!form || !root) return;
  const map = root?.pdf || root?.pdfOverrides || root?.pdfFieldValues || {};
  if (!map || typeof map !== "object") return;

  for (const [name, raw] of Object.entries(map)) {
    if (raw === undefined || raw === null) continue;

    // 1) Try text field
    try {
      form.getTextField(name).setText(toStr(raw));
      continue;
    } catch (_) {}

    // 2) Try checkbox
    try {
      const cb = form.getCheckBox(name);
      const b = yesNoToBool(raw);
      if (b === null) continue;
      if (b) cb.check();
      else cb.uncheck();
      continue;
    } catch (_) {}

    // 3) Try radio group
    try {
      form.getRadioGroup(name).select(toStr(raw));
      continue;
    } catch (_) {}

    // 4) Try dropdown
    try {
      form.getDropdown(name).select(toStr(raw));
    } catch (_) {
      // ignore unknown field
    }
  }
}

// Backwards-compatible alias (some older routes used this name)
export function applyPdfOverrides(form, overrides) {
  applyDirectPdfMap(form, { pdf: overrides || {} });
}
