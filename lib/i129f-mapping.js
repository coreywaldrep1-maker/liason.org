/**
 * I-129F (Petition for Alien Fiancé(e)) PDF mapping
 *
 * IMPORTANT:
 * - This mapping targets the PDF shipped with the app: /public/i-129f.pdf
 * - It fills ONLY existing AcroForm fields using pdf-lib.
 * - Part 8 (page 12) “Continued Information” blocks are used ONLY for:
 *     • overflow “Other Names Used”
 *     • overflow Address History entries
 *     • overflow Employment entries
 *     • the user-entered `additionalInfo` text
 *
 * If you change the PDF, field names will change—re-export field names and
 * update this mapping accordingly.
 */

// NOTE: This file is intentionally dependency-free; it runs in the Next.js
// route handler that already has a pdf-lib `form` instance.

/** @param {unknown} v */
function str(v) {
  return v === undefined || v === null ? "" : String(v);
}

/**
 * Normalize date input to MM/DD/YYYY when possible.
 * Accepts YYYY-MM-DD (HTML date input), YYYY/MM/DD, MM/DD/YYYY.
 * Returns the original trimmed string if it cannot be parsed.
 */
function normalizeDate(value) {
  const s = str(value).trim();
  if (!s) return "";

  // YYYY-MM-DD or YYYY/MM/DD
  let m = s.match(/^([0-9]{4})[-/]([0-9]{1,2})[-/]([0-9]{1,2})$/);
  if (m) {
    const yyyy = m[1];
    const mm = m[2].padStart(2, "0");
    const dd = m[3].padStart(2, "0");
    return `${mm}/${dd}/${yyyy}`;
  }

  // MM/DD/YYYY or M/D/YYYY
  m = s.match(/^([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{4})$/);
  if (m) {
    const mm = m[1].padStart(2, "0");
    const dd = m[2].padStart(2, "0");
    const yyyy = m[3];
    return `${mm}/${dd}/${yyyy}`;
  }

  return s;
}

/** @param {unknown} v */
function parseYesNoNa(v) {
  if (typeof v === "boolean") return v ? "yes" : "no";
  const s = str(v).trim().toLowerCase();
  if (!s) return "";
  if (["y", "yes", "true", "1"].includes(s)) return "yes";
  if (["n", "no", "false", "0"].includes(s)) return "no";
  if (["na", "n/a", "not applicable"].includes(s)) return "na";
  return "";
}

/** @param {unknown} v */
function cleanDigits(v) {
  return str(v).replace(/\D+/g, "");
}

function formatName(n = {}) {
  const last = str(n.lastName).trim();
  const first = str(n.firstName).trim();
  const middle = str(n.middleName).trim();
  const parts = [];
  if (last) parts.push(last);
  if (first || middle) parts.push([first, middle].filter(Boolean).join(" "));
  return parts.join(", ").trim();
}

function formatAddress(a = {}) {
  const street = str(a.street).trim();
  const unitType = str(a.unitType).trim();
  const unitNumber = str(a.unitNumber).trim();
  const city = str(a.city).trim();
  const state = str(a.state).trim();
  const zip = str(a.zip).trim();
  const province = str(a.province).trim();
  const postal = str(a.postal).trim();
  const country = str(a.country).trim();
  const from = normalizeDate(a.from);
  const to = normalizeDate(a.to);

  const line1 = [street, [unitType, unitNumber].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(" ")
    .trim();

  const line2 = [city, state, zip].filter(Boolean).join(", ");
  const line3 = [province, postal].filter(Boolean).join(" ");
  const line4 = country;
  const dateLine = from || to ? `From ${from || ""} To ${to || ""}`.trim() : "";

  return [line1, line2, line3, line4, dateLine].filter(Boolean).join(" | ");
}

function formatEmployment(e = {}) {
  const employer = str(e.employerName).trim();
  const occupation = str(e.occupation).trim();
  const start = normalizeDate(e.start);
  const end = normalizeDate(e.end);
  const addr = formatAddress(e.address || {});
  const dateLine = start || end ? `From ${start || ""} To ${end || ""}`.trim() : "";
  return [
    employer ? `Employer: ${employer}` : "",
    occupation ? `Occupation: ${occupation}` : "",
    addr ? `Address: ${addr}` : "",
    dateLine ? `Dates: ${dateLine}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

/**
 * @param {Record<string, any>} saved
 * @param {import('pdf-lib').PDFForm} form
 * @param {{ debug?: boolean }} opts
 */
export function applyI129fMapping(saved = {}, form, opts = {}) {
  const data = saved || {};
  const petitioner = data.petitioner || {};
  const beneficiary = data.beneficiary || {};
  const relationship = data.relationship || {};
  const consular = data.consular || {};
  const contact = data.contact || {};
  const signatures = data.signatures || {};

  const debug = !!opts.debug;

  /** @type {Map<string, any>} */
  const fieldMap = new Map();
  for (const f of form.getFields()) {
    try {
      fieldMap.set(f.getName(), f);
    } catch {
      // ignore
    }
  }

  /** @param {string} name */
  function getField(name) {
    return fieldMap.get(name);
  }

  /** @param {string} name */
  function warnMissing(name) {
    if (!debug) return;
    // eslint-disable-next-line no-console
    console.warn(`[i129f-mapping] Missing PDF field: ${name}`);
  }

  /** @param {string} name @param {unknown} value */
  function setText(name, value) {
    const v = str(value);
    if (!v.trim()) return;
    const field = getField(name);
    if (!field) return warnMissing(name);
    try {
      if (typeof field.setText === "function") {
        field.setText(v);
      } else if (typeof field.select === "function") {
        // dropdowns/option lists
        field.select(v);
      }
    } catch {
      // ignore
    }
  }

  /** @param {string} name @param {unknown} value */
  function setDate(name, value) {
    const d = normalizeDate(value);
    if (!d) return;
    setText(name, d);
  }

  /** @param {string} name @param {boolean} checked */
  function setCheckbox(name, checked) {
    const field = getField(name);
    if (!field) return warnMissing(name);
    try {
      if (typeof field.check === "function" && typeof field.uncheck === "function") {
        checked ? field.check() : field.uncheck();
      }
    } catch {
      // ignore
    }
  }

  /**
   * Select a radio option by matching keywords against the group options.
   * @param {string} name
   * @param {string[]} keywords - lowercased keywords
   */
  function selectRadioByKeywords(name, keywords) {
    const field = getField(name);
    if (!field) {
      warnMissing(name);
      return;
    }
    if (typeof field.select !== "function") return;

    try {
      const opts = typeof field.getOptions === "function" ? field.getOptions() : [];
      if (!Array.isArray(opts) || opts.length === 0) return;
      const pick = opts.find((o) => {
        const ol = str(o).toLowerCase();
        return keywords.every((k) => ol.includes(k));
      });
      if (pick) field.select(pick);
    } catch {
      // ignore
    }
  }

  /** @param {string} name @param {unknown} v */
  function setYesNoRadio(name, v) {
    const yn = parseYesNoNa(v);
    if (!yn) return;
    if (yn === "yes") return selectRadioByKeywords(name, ["yes"]);
    if (yn === "no") return selectRadioByKeywords(name, ["no"]);
    if (yn === "na") return selectRadioByKeywords(name, ["na"]);
  }

  /**
   * Unit type radios vary across the PDF (Apt/Ste/Flr vs Apt/Suite/Floor).
   * @param {string} name
   * @param {unknown} v
   */
  function setUnitTypeRadio(name, v) {
    const ut = str(v).trim().toLowerCase();
    if (!ut) return;
    if (ut === "apt" || ut === "apartment") return selectRadioByKeywords(name, ["apt"]);
    if (ut === "ste" || ut === "suite") {
      // some option values use "ste" and others use "suite"
      selectRadioByKeywords(name, ["ste"]);
      selectRadioByKeywords(name, ["suite"]);
      return;
    }
    if (ut === "flr" || ut === "floor") {
      selectRadioByKeywords(name, ["flr"]);
      selectRadioByKeywords(name, ["floor"]);
    }
  }

  /** @param {string} name @param {unknown} v */
  function setSexRadio(name, v) {
    const s = str(v).trim().toLowerCase();
    if (!s) return;
    if (s.startsWith("m")) return selectRadioByKeywords(name, ["male"]);
    if (s.startsWith("f")) return selectRadioByKeywords(name, ["female"]);
  }

  // ---------------------------
  // Part 1 — Petitioner
  // ---------------------------
  setText("Petitioner_Family_Name_Last_Name_page1_6a", petitioner.lastName);
  setText("Petitioner_Given_Name_First_Name_page1_6b", petitioner.firstName);
  setText("Petitioner_MiddleName_page1_6.c", petitioner.middleName);

  setText("Petitioner_Alien_Registration_page_1_Num_1", petitioner.aNumber);
  setText("Petitioner_Social_Security_Num_page_1_Num_3", petitioner.ssn);

  // Classification of beneficiary (K-1 / K-3)
  {
    const c = str(petitioner.classification).trim().toLowerCase();
    if (c.includes("k3")) selectRadioByKeywords("Petitioner_Select_One_box_Classification_of_Beneficiary", ["k3"]);
    else if (c.includes("k1"))
      selectRadioByKeywords("Petitioner_Select_One_box_Classification_of_Beneficiary", ["k1"]);
  }

  // Filed I-130? (for K-3)
  setYesNoRadio("Petitioner_Filing_K3_Visa_Check_Yes_No_page_1_number5", petitioner.filedI130);

  // Other Names Used (primary)
  const petOtherNames = Array.isArray(petitioner.otherNamesUsed) ? petitioner.otherNamesUsed : [];
  const petOther1 = petOtherNames[0] || {};
  setText("Petitioner_Other_Names_Used_Family_Name_page_1_Num_7a", petOther1.lastName);
  setText("Petitioner_Other_Names_Used_Given_Name_page_1_Num_7.b", petOther1.firstName);
  setText("Petitioner_Other_Names_Used_Middle_Name_page_1_Num_7.c", petOther1.middleName);

  // Mailing Address
  const mail = petitioner.mailing || {};
  setText("Petitioner_Mailing_Address_In_Care_Of_Name_page1_8a", mail.inCareOf);
  setText("Petitioner_Mailing_Address_Street_Number_Name_page1_8b", mail.street);
  setUnitTypeRadio("Petitioner_ In_Care_of_Apt_Ste_Flr_Num_Question_page1_8.c", mail.unitType);
  setText("Petitioner_in_care_of_APt_Ste_Flr_number_Page1_8.c", mail.unitNumber);
  setText("Petitioner_Mailing_Address_City_Town_page1_8d", mail.city);
  setText("Petitioner_Mailing_Address_State_page1_8e", mail.state);
  setText("Petitioner_Mailing_Address_Zip_Code_page1_8f", mail.zip);
  setText("Petitioner_Mailing_Address_Province_page1_8g", mail.province);
  setText("Petitioner_Mailing_Address_Postal_Code_page1_8h", mail.postal);
  setText("Petitioner_Mailing_Address_Country_page1_8i", mail.country);
  setYesNoRadio("Petitioner_is_mailing_address_same_as_physical_address_check_yes_or_no_page1_8.j", mail.sameAsPhysical);

  // Physical Address History (2 entries)
  const petPhys = Array.isArray(petitioner.physicalAddresses) ? petitioner.physicalAddresses : [];
  const petPhys1 = petPhys[0] || {};
  const petPhys2 = petPhys[1] || {};

  setText("Petitioner_Address_History_1_Street_Number_Name_page2_9a", petPhys1.street);
  setUnitTypeRadio("Petitioner_Address_1_History_Apt_Suite_Floor_Number_Page2_9.b", petPhys1.unitType);
  setText("Petitioner_Address_1_History_Apt_Ste_Floor_Checkbox_Page2_9.b", petPhys1.unitNumber);
  setText("Petitioner_Address_History_1_City_page2_9c", petPhys1.city);
  setText("Petitioner_Address_History_1_State_page2_9d", petPhys1.state);
  setText("Petitioner_Address_History_1_Zip_Code_page2_9e", petPhys1.zip);
  setText("Petitioner_Address_History_1_Country_page2_9h", petPhys1.country);
  setDate("Petitioner_Address_History_1_Date_From_page2_10a", petPhys1.from);
  setDate("Petitioner_Address_History_1_Date_To_page2_10b", petPhys1.to);

  setText("Petitioner_Address_History_2_Street_Number_Name_page2_11a", petPhys2.street);
  setUnitTypeRadio("Petitioner_Address_2_History_Apt_Suite_Floor_Number_Page2_11.b", petPhys2.unitType);
  setText("Petitioner_Address_2_History_Apt_Ste_Floor_Checkbox_Page2_11.b", petPhys2.unitNumber);
  setText("Petitioner_Address_History_2_City_page2_11c", petPhys2.city);
  setText("Petitioner_Address_History_2_State_page2_11d", petPhys2.state);
  setText("Petitioner_Address_History_2_Zip_Code_page2_11e", petPhys2.zip);
  setText("Petitioner_Address_History_2_Country_page2_11h", petPhys2.country);
  setDate("Petitioner_Address_History_2_Date_From_page2_12a", petPhys2.from);
  setDate("Petitioner_Address_History_2_Date_To_page2_12b", petPhys2.to);

  // Petitioner Other Information
  setSexRadio("Petitioner_Other_Information_Sex_page3_21", petitioner.sex);
  setDate("Petitioner_Other_Information_Date_of_birth_page3_22", petitioner.dob);
  setText("Petitioner_Other_Information_City_Town_Village_of_Birth_page3_24", petitioner.cityBirth);
  setText("Petitioner_Other_Information_Country_of_Birth_page3_26", petitioner.countryBirth);

  // Citizenship acquisition (Birth / Naturalization / Parents)
  {
    const acq = str(petitioner?.citizenship?.acquisition).trim().toLowerCase();
    if (acq.includes("birth") || acq.includes("born")) {
      selectRadioByKeywords("Petitioner_Citizenship_Information_page3_40", ["birth"]);
    } else if (acq.includes("natural")) {
      selectRadioByKeywords("Petitioner_Citizenship_Information_page3_40", ["natural"]);
    } else if (acq.includes("parent")) {
      selectRadioByKeywords("Petitioner_Citizenship_Information_page3_40", ["parent"]);
    }
  }

  // Petitioner Parents (names only; wizard does not currently collect the rest)
  const petParents = Array.isArray(petitioner.parents) ? petitioner.parents : [];
  const petP1 = petParents[0] || {};
  const petP2 = petParents[1] || {};
  setText("Petitioner_Parent_1_Family_Name_Last_Name_page3_27.a", petP1.lastName);
  setText("Petitioner_Parent_1_Given_Name_First_name_page3_27.b", petP1.firstName);
  setText("Petitioner_Parent_1_Middle_Name_page3_27.c", petP1.middleName);
  setText("Petitioner_Parent_2_Family_Name_Last_Name_page3_32.a", petP2.lastName);
  setText("Petitioner_Parent_2_Given_Name_First_name_page3_32.b", petP2.firstName);
  setText("Petitioner_Parent_2_Middle_Name_page3_32.c", petP2.middleName);

  // ---------------------------
  // Part 3 — Criminal Information (wizard stores under petitioner.criminal)
  // ---------------------------
  const crim = petitioner.criminal || {};
  setYesNoRadio(
    "Beneficiary_Information_Criminal_Ever_Subject_Temporary_Permanent_Protection_Or_Restraining_Order_Yes_No_Checkboxes_page8_1",
    crim.restrainingOrder
  );
  setYesNoRadio(
    "Beneficiary_Information_Criminal_Ever_Arreted_Convicted_Yes_No_Checkboxes_page8_2.a",
    crim.arrestedOrConvicted2a
  );
  setYesNoRadio(
    "Beneficiary_Information_Criminal_Ever_Arreted_Convicted_Yes_No_Checkboxes_page9_2.b",
    crim.arrestedOrConvicted2b
  );
  setYesNoRadio(
    "Beneficiary_Information_Criminal_Ever_Arreted_Three_Or_More_arrets_Convictions_Yes_No_Checkboxes_page9_2.c",
    crim.arrestedOrConvicted2c
  );
  setYesNoRadio(
    "Beneficiary_Information_Criminal_Fine_$500_Or_More_Yes_No_Checkboxes_page9_4.a",
    crim.everArrestedCitedCharged
  );
  setText("Beneficiary_Information_Criminal_Checked_Yes_To_4.a._Provide_Information_page9_4.b", crim.explanation);

  // ---------------------------
  // Part 2 — Beneficiary
  // ---------------------------
  setText("Beneficiary_Family_Name_Last_Name_page4_1.a", beneficiary.lastName);
  setText("Beneficiary_Given_Name_First_Name_page4_1.b", beneficiary.firstName);
  setText("Beneficiary_Middle_Name_page4_1.c", beneficiary.middleName);

  setText("Beneficiary_Line_4_Alien_Number_page4_2", beneficiary.aNumber);
  setText("Beneficiary_Social_Security_Number_page4_3", beneficiary.ssn);
  setDate("Beneficiary_Date_Of_Birth_page4_4", beneficiary.dob);
  setSexRadio("Beneficiary_Sex_page4_5", beneficiary.sex);
  setText("Beneficiary_City_Of_Birth_page4_7", beneficiary.cityBirth);
  setText("Beneficiary_Country_Birth_page4_8", beneficiary.countryBirth);
  setText("Beneficiary_Country_Of_Citizenship_page4_9", beneficiary.citizenshipCountry);

  // Beneficiary Other Names Used (1 entry on main pages)
  const benOtherNames = Array.isArray(beneficiary.otherNamesUsed) ? beneficiary.otherNamesUsed : [];
  const benOther1 = benOtherNames[0] || {};
  setText("Beneficiary_Other_Names_Used_Last_Name_page4_10.a", benOther1.lastName);
  setText("Beneficiary_Other_Names_Used_First_Name_page4_10.b", benOther1.firstName);
  setText("Beneficiary_Other_Names_Used_Middle_Name_page4_10.c", benOther1.middleName);

  // Beneficiary Mailing Address
  const benMail = beneficiary.mailing || {};
  setText("Beneficiary_Mailing_Address_In_Care_of_Name_page5_11.a", benMail.inCareOf);
  setText("Beneficiary_Mailing_Address_Street_page5_11.b", benMail.street);
  setUnitTypeRadio("Beneficiary_Mailing_Address_In_Care_of_Apt_Ste_Flr_Number_page5_11.c", benMail.unitType);
  setText("Beneficiary_Mailing_Address_In_Care_of__Apt_Ste_Flr_Number_of_Type_page5_11.c", benMail.unitNumber);
  setText("Beneficiary_Mailing_Address_City_page5_11.d", benMail.city);
  setText("Beneficiary_Mailing_Address_State_page5_11.e", benMail.state);
  setText("Beneficiary_Mailing_Address_Zip_Code_page5_11.f", benMail.zip);
  setText("Beneficiary_Mailing_Address_Province_page5_11.g", benMail.province);
  setText("Beneficiary_Mailing_Address_Postal_Code_page5_11.h", benMail.postal);
  setText("Beneficiary_Mailing_Address_Country_page5_11.i", benMail.country);

  // Beneficiary Physical Address History (2 entries)
  const benPhys = Array.isArray(beneficiary.physicalAddresses) ? beneficiary.physicalAddresses : [];
  const benPhys1 = benPhys[0] || {};
  const benPhys2 = benPhys[1] || {};

  // Address #1 (items 12/13) — field names in the PDF are "Mailing_Address_2"
  setText("Beneficiary_Mailing_Address_2_Street_page5_12.a", benPhys1.street);
  setUnitTypeRadio("Beneficiary_Mailing_Adress_2_Apt_Ste_Flr_Num_page5_12.b", benPhys1.unitType);
  setText("Beneficiary_Mailing_Adress_2_Apt_Ste_Flr_Num_Field_page5_12.b", benPhys1.unitNumber);
  setText("Beneficiary_Mailing_Address_2_City_page5_12.c", benPhys1.city);
  setText("Beneficiary_Mailing_Address_2_State_page5_12.d", benPhys1.state);
  setText("Beneficiary_Mailing_Address_2_Zip_Code_page5_12.e", benPhys1.zip);
  setText("Beneficiary_Mailing_Address_2_Country_page5_12.h", benPhys1.country);
  setDate("Beneficiary_Mailing_Address_2_From_date_page5_13.a", benPhys1.from);
  setDate("Beneficiary_Mailing_Address_2_To_date_page5_13.b", benPhys1.to);

  // Address #2 (items 14/15) — field names in the PDF are "Mailing_Address_3"
  setText("Beneficiary_Mailing_Address_3_Street_page5_14.a", benPhys2.street);
  setUnitTypeRadio("Beneficiary_Mailing_Adress_3_Apt_Ste_Flr_Num_page5_14.b", benPhys2.unitType);
  setText("Beneficiary_Mailing_Adress_3_Num_Field_page5_14.b", benPhys2.unitNumber);
  setText("Beneficiary_Mailing_Address_3_City_page5_14.c", benPhys2.city);
  setText("Beneficiary_Mailing_Address_3_State_page5_14.d", benPhys2.state);
  setText("Beneficiary_Mailing_Address_3_Zip_Code_page5_14.e", benPhys2.zip);
  setText("Beneficiary_Mailing_Address_3_Country_page5_14.h", benPhys2.country);
  setDate("Beneficiary_Mailing_Address_3_From_date_page5_15.a", benPhys2.from);
  setDate("Beneficiary_Mailing_Address_3_To_date_page5_15.b", benPhys2.to);

  // Beneficiary Employment History (2 entries)
  const benEmp = Array.isArray(beneficiary.employment) ? beneficiary.employment : [];
  const benEmp1 = benEmp[0] || {};
  const benEmp2 = benEmp[1] || {};

  // Employer #1
  setText("Beneficiary_Employer_1_Address_NameOfEmployer_page5_16", benEmp1.employerName);
  setText("Beneficiary_Employer_1_Addres_Street_page5_17.a", benEmp1?.address?.street);
  setUnitTypeRadio("Beneficiary_Employer_1_Addres_Apt_Ste_Flr_num_page5_17.b", benEmp1?.address?.unitType);
  setText("Beneficiary_Employer_1_Addres_Apt_Ste_Flr_Num_Field_page5_17.b", benEmp1?.address?.unitNumber);
  setText("Beneficiary_Employer_1_Addres_City_page5_17.c", benEmp1?.address?.city);
  setText("Beneficiary_Employer_1_Addres_State_page5_17.d", benEmp1?.address?.state);
  setText("Beneficiary_Employer_1_Addres_Zip_code_page5_17.e", benEmp1?.address?.zip);
  setText("Beneficiary_Employer_1_Addres_Country_page5_17.h", benEmp1?.address?.country);
  setText("Beneficiary_Employer_1_Addres_Occupation_page5_18", benEmp1.occupation);
  setDate("Beneficiary_Employer_1_Addres_StartDate_page5_19.a", benEmp1.start);
  setDate("Beneficiary_Employer_1_Addres_EndDate_page5_19.b", benEmp1.end);

  // Employer #2
  setText("Beneficiary_Employer_2_Address_NameOfEmployer_page6_20", benEmp2.employerName);
  setText("Beneficiary_Employer_2_Addres_Street_page6_21.a", benEmp2?.address?.street);
  setUnitTypeRadio("Beneficiary_Employer_2_Addres_Apt_Ste_Flr_num_page6_21.b", benEmp2?.address?.unitType);
  setText("Beneficiary_Employer_2_Addres_Apt_Ste_Flr_Num_Field_page6_21.b", benEmp2?.address?.unitNumber);
  setText("Beneficiary_Employer_2_Addres_City_page6_21.c", benEmp2?.address?.city);
  setText("Beneficiary_Employer_2_Addres_State_page6_21.d", benEmp2?.address?.state);
  setText("Beneficiary_Employer_2_Addres_Zip_code_page6_21.e", benEmp2?.address?.zip);
  setText("Beneficiary_Employer_2_Addres_Country_page6_21.h", benEmp2?.address?.country);
  setText("Beneficiary_Employer_2_Addres_Occupation_page6_22", benEmp2.occupation);
  setDate("Beneficiary_Employer_2_Addres_StartDate_page6_23.a", benEmp2.start);
  setDate("Beneficiary_Employer_2_Addres_EndDate_page6_23.b", benEmp2.end);

  // Beneficiary Parents (names only)
  const benParents = Array.isArray(beneficiary.parents) ? beneficiary.parents : [];
  const benP1 = benParents[0] || {};
  const benP2 = benParents[1] || {};
  setText("Beneficiary_Parent_1_Family_Name_Last_Name_page6_24.a", benP1.lastName);
  setText("Beneficiary_Parent_1_Given_Name_First_name_page6_24.b", benP1.firstName);
  setText("Beneficiary_Parent_1_Middle_Name_page6_24.c", benP1.middleName);
  setText("Beneficiary_Parent_2_Family_Name_Last_Name_page6_29.a", benP2.lastName);
  setText("Beneficiary_Parent_2_Given_Name_First_name_page6_29.b", benP2.firstName);
  setText("Beneficiary_Parent_2_Middle_Name_page6_29.c", benP2.middleName);

  // Beneficiary in US + travel document section
  setYesNoRadio("Beneficiary_Other_Information_Beneficiary_Been_In_US_Previously_checkboxes_Yes_No_page6_37", beneficiary.inUS);
  setText("Beneficiary_Other_Information_Beneficiary_Currently_In_US_I94_Number_page6_38.a", beneficiary.i94Number);
  setDate("Beneficiary_Other_Information_Beneficiary_Currently_In_US_Date_Of_last_Arrival_page6_38.b", beneficiary.arrivalDate);
  setText("Beneficiary_Other_Information_Beneficiary_Currently_In_US_Status_at_last_arrival_page6_38.c", beneficiary.statusAtArrival);
  setText("Beneficiary_Other_Information_Beneficiary_Currently_In_US_Passport_Number_page7_38.e", beneficiary.passportNumber);
  setText("Beneficiary_Other_Information_Beneficiary_Currently_In_US_Travel_Document_Number_page7_38.f", beneficiary.travelDocNumber);
  setText("Beneficiary_Other_Information_Beneficiary_Currently_In_US_Country_Issued_Passport_page7_38.g", beneficiary.passportCountry);
  setDate("Beneficiary_Other_Information_Beneficiary_Currently_In_US_Passport_Expiration_Date_page7_38.h", beneficiary.passportExpiration);

  // ---------------------------
  // Part 4 — Biographic Information (wizard stores under beneficiary)
  // ---------------------------
  {
    // Ethnicity (Yes -> Hispanic, No -> Not Hispanic)
    const yn = parseYesNoNa(beneficiary.ethnicityHispanic);
    if (yn === "yes") {
      selectRadioByKeywords("Beneficiary_Information_Biographic_Information_Ethnicity_Hispanic_Not_Hispanic_Checkboxes_page9_1", ["hispanic"]);
    } else if (yn === "no") {
      selectRadioByKeywords("Beneficiary_Information_Biographic_Information_Ethnicity_Hispanic_Not_Hispanic_Checkboxes_page9_1", ["not", "hispanic"]);
    }

    // Race (single-select in the wizard; PDF uses checkboxes)
    const race = str(beneficiary.race).trim().toLowerCase();
    const raceBoxes = {
      asian: "Beneficiary_Information_Biographic_Information_Race_Asian_checkbox_page9_2",
      black: "Beneficiary_Information_Biographic_Information_Race_Black_African_checkbox_page9_2",
      "black/african": "Beneficiary_Information_Biographic_Information_Race_Black_African_checkbox_page9_2",
      african: "Beneficiary_Information_Biographic_Information_Race_Black_African_checkbox_page9_2",
      white: "Beneficiary_Information_Biographic_Information_Race_White_checkbox_page9_2",
      native: "Beneficiary_Information_Biographic_Information_Race_Native_Hawaiian_Pacific_Islander_checkbox_page9_2",
      hawaiian: "Beneficiary_Information_Biographic_Information_Race_Native_Hawaiian_Pacific_Islander_checkbox_page9_2",
      pacific: "Beneficiary_Information_Biographic_Information_Race_Native_Hawaiian_Pacific_Islander_checkbox_page9_2",
    };
    // Uncheck all, then check the selected one (if any)
    for (const k of Object.keys(raceBoxes)) setCheckbox(raceBoxes[k], false);
    if (race) {
      const matchKey = Object.keys(raceBoxes).find((k) => race.includes(k));
      if (matchKey) setCheckbox(raceBoxes[matchKey], true);
    }

    // Height (Feet/Inches)
    setText("Beneficiary_Information_Biographic_Information_Height_Feet_Checkbox_page9_3", beneficiary.heightFeet);
    setText("Beneficiary_Information_Biographic_Information_Height_Inches_Checkbox_page9_3", beneficiary.heightInches);

    // Weight (3 digit boxes)
    {
      const w = cleanDigits(beneficiary.weight);
      if (w) {
        const digits = w.slice(-3).padStart(3, " ");
        const d1 = digits[0] === " " ? "" : digits[0];
        const d2 = digits[1] === " " ? "" : digits[1];
        const d3 = digits[2] === " " ? "" : digits[2];
        setText("Beneficiary_Information_Biographic_Information_Weight_1_page9_4", d1);
        setText("Beneficiary_Information_Biographic_Information_Weight_2_page9_4", d2);
        setText("Beneficiary_Information_Biographic_Information_Weight_3_page9_4", d3);
      }
    }

    // Eye Color (radio)
    {
      const eye = str(beneficiary.eyeColor).trim().toLowerCase();
      if (eye) {
        const key = eye === "unknown" ? "unk" : eye;
        selectRadioByKeywords("Beneficiary_Information_Biographic_Information_Eye_Color_Checkboxes_page9_5", [key]);
      }
    }

    // Hair Color (radio)
    {
      const hair = str(beneficiary.hairColor).trim().toLowerCase();
      if (hair) {
        const key = hair === "unknown" ? "unk" : hair;
        selectRadioByKeywords("Beneficiary_Information_Biographic_Information_Hair_Color_Checkboxes_page9_6", [key]);
      }
    }
  }

  // ---------------------------
  // Relationship + Consular Processing
  // ---------------------------
  setYesNoRadio("Question_53", relationship.inPersonMet);
  {
    const parts = [];
    const d = normalizeDate(relationship.meetingDate);
    const loc = str(relationship.meetingLocation).trim();
    const nat = str(relationship.relationshipNature).trim();
    if (d) parts.push(`Meeting date: ${d}`);
    if (loc) parts.push(`Meeting location: ${loc}`);
    if (nat) parts.push(`Nature of relationship: ${nat}`);
    if (parts.length) setText("Answered_Yes_To_Q53_Explain_page8_54", parts.join("\n"));
  }
  setText("City_Town_of_U_S_Consulate_page8_62.a", consular.consulateCity);
  setText("Country_of_U_S_Consulate_page8_62.b", consular.consulateCountry);

  // ---------------------------
  // Part 5/6/7 — Contact info + signature dates
  // ---------------------------
  setText("Petitioners_Contact_Information_daytime_Phone_Number_page10_1", contact.petitionerPhone);
  // If the wizard only collects one phone number, use it for mobile too.
  setText("Petitioners_Contact_Information_Mobile_Phone_Number_page10_2", contact.petitionerPhone);
  setText("Petitioners_Contact_Information_Email_Address_page10_3", contact.petitionerEmail);
  setDate("Petitioners_Date_Of_Signature_page10_4", signatures.petitionerSignatureDate);

  // Interpreter
  const intr = contact.interpreter || {};
  setText("Interpreter_Contact_Information_Family_Name_page10_1", intr.lastName);
  setText("Interpreter_Contact_Information_Given_Name_page10_1", intr.firstName);
  setText("Interpreter_Contact_Information_Business_Organization_Name_page10_2", intr.business);
  setText("Interpreter_Contact_Information_Daytime_Phone_page10_3", intr.phone);
  setText("Interpreter_Contact_Information_Mobile_Phone_page10_4", intr.phone);
  setText("Interpreter_Contact_Information_Email_Address_page10_5", intr.email);
  setText("Interpreter_Certification_Signature_Language_Field_page10", intr.languages);
  setDate("Interpreter_Certification_Date_Of_Signature_page10_6", signatures.interpreterSignatureDate);

  // Preparer
  const prep = contact.preparer || {};
  setText("Prepare_Full_Name_Family_Name_page10_1", prep.lastName);
  setText("Prepare_Full_Name_First_Name_page10_1", prep.firstName);
  setText("Prepare_Full_Name_Business_Organization_page10_2", prep.business);
  setText("Prepare_Contact_Information_Daytime_Phone_Number_page10_3", prep.phone);
  setText("Prepare_Contact_Information_Mobile_Phone_Number_page10_4", prep.phone);
  setText("Prepare_Contact_Information_Email_Address_page10_5", prep.email);
  setDate("Prepare_Date_Of_Signature_page11_6", signatures.preparerSignatureDate);

  // ---------------------------
  // Part 8 — Additional Information / Continuations
  // ---------------------------

  // Part 8 A-Number header field (single field; use petitioner first, else beneficiary)
  setText("Additional_A_Number_From_Petitioner_Or-Beneficiary_Page12_2", petitioner.aNumber || beneficiary.aNumber);

  // Petitioner “Other Names Used” continuation fields (one extra name on page 12)
  const petOther2 = petOtherNames[1] || {};
  setText("Petitioner_Other_Names_Used_From_7.a.-7.c._Last_Name_page12_1.a", petOther2.lastName);
  setText("Petitioner_Other_Names_Used_From_7.a.-7.c._First_Name_page12_1.b", petOther2.firstName);
  setText("Petitioner_Other_Names_Used_From_7.a.-7.c._Middle_Name_page12_1.c", petOther2.middleName);

  // Continued Information blocks (5 available)
  const continuedBlocks = [
    {
      page: "Continued_Information_1_Page_Number_Page12_3.a",
      part: "Continued_Information_1_Part_Number_Page12_3.b",
      item: "Continued_Information_1_Item_Number_Page12_3.c",
      exp: "Continued_Information_1_Explanation_Area_Page12_3.d",
    },
    {
      page: "Continued_Information_2_Page_Number_Page12_4.a",
      part: "Continued_Information_2_Part_Number_Page12_4.b",
      item: "Continued_Information_2_Item_Number_Page12_4.c",
      exp: "Continued_Information_2_Explanation_Area_Page12_4.d",
    },
    {
      page: "Continued_Information_3_Page_Number_Page12_5.a",
      part: "Continued_Information_3_Part_Number_Page12_5.b",
      item: "Continued_Information_3_Item_Number_Page12_5.c",
      exp: "Continued_Information_3_Explanation_Area_Page12_5.d",
    },
    {
      page: "Continued_Information_4_Page_Number_Page12_6.a",
      part: "Continued_Information_4_Part_Number_Page12_6.b",
      item: "Continued_Information_4_Item_Number_Page12_6.c",
      exp: "Continued_Information_4_Explanation_Area_Page12_6.d",
    },
    {
      page: "Continued_Information_5_Page_Number_Page12_7.a",
      part: "Continued_Information_5_Part_Number_Page12_7.b",
      item: "Continued_Information_5_Item_Number_Page12_7.c",
      exp: "Continued_Information_5_Explanation_Area_Page12_7.d",
    },
  ];

  /** @type {{page: string, part: string, item: string, exp: string}[]} */
  const continuedEntries = [];

  function pushContinued(page, part, item, explanation) {
    const exp = str(explanation).trim();
    if (!exp) return;
    continuedEntries.push({ page: str(page), part: str(part), item: str(item), exp });
  }

  // Petitioner other names used beyond the 2 provided slots
  for (let i = 2; i < petOtherNames.length; i++) {
    const n = petOtherNames[i] || {};
    pushContinued("1", "1", "7", `Additional Petitioner Other Name Used: ${formatName(n)}`);
  }

  // Beneficiary other names used beyond the 1 provided slot
  for (let i = 1; i < benOtherNames.length; i++) {
    const n = benOtherNames[i] || {};
    pushContinued("4", "2", "10", `Additional Beneficiary Other Name Used: ${formatName(n)}`);
  }

  // Petitioner physical addresses beyond the 2 provided slots
  for (let i = 2; i < petPhys.length; i++) {
    pushContinued("2", "1", "9-12", `Additional Petitioner Address History: ${formatAddress(petPhys[i])}`);
  }

  // Beneficiary physical addresses beyond the 2 provided slots
  for (let i = 2; i < benPhys.length; i++) {
    pushContinued("5", "2", "12-15", `Additional Beneficiary Address History: ${formatAddress(benPhys[i])}`);
  }

  // Beneficiary employment beyond the 2 provided slots
  for (let i = 2; i < benEmp.length; i++) {
    pushContinued("5", "2", "16-23", `Additional Beneficiary Employment: ${formatEmployment(benEmp[i])}`);
  }

  // User-entered Part 8 text (if any)
  if (str(data.additionalInfo).trim()) {
    pushContinued("", "8", "", str(data.additionalInfo));
  }

  // Fill up to 5 blocks; if more, append overflow into the last block.
  const maxBlocks = continuedBlocks.length;
  const entries = continuedEntries.slice(0, maxBlocks);
  const overflow = continuedEntries.slice(maxBlocks);
  if (overflow.length && entries.length) {
    entries[entries.length - 1].exp = [
      entries[entries.length - 1].exp,
      "",
      "--- Overflow ---",
      ...overflow.map((e) => e.exp),
    ].join("\n");
  }

  for (let i = 0; i < entries.length; i++) {
    const b = continuedBlocks[i];
    const e = entries[i];
    setText(b.page, e.page);
    setText(b.part, e.part);
    setText(b.item, e.item);
    setText(b.exp, e.exp);
  }
}
