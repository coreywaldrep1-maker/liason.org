// lib/i129f-mapping.js
// Map I-129F Wizard saved JSON -> renamed AcroForm field names (your renamed template)

export const I129F_DEBUG_FIELD_LIST = [
  'Petitioner_Request_Beneficiary_K1_page_1_Num_4a',
  'Petitioner_Request_Beneficiary_K3_page_1_Num_4b',
  'Petitioner_Filing_K3_Filed_I130__Yes',
  'Petitioner_Filing_K3_Filed_I130__No',
  'Petitioner_in_care_of_APt_Ste_Flr_number_Page1_8.c',
  'Petitioner_in_Care_of_State_page1_8.e',
  'Petitioner_in_Care_of_ZipCode_page1_8.f',
  'Petitioner_in_Care_of_Province_page1_8.g',
  'Petitioner_in_Care_of_Postal_Code_page1_8.h',
  'Petitioner_Mailing_Adress_Same_as_physical_checkbox_Yes_page1_8.j',
  'Petitioner_Mailing_Adress_Same_as_physical_checkbox_No_page1_8.j',

  'Beneficiary_Information_Biographic_Information_Ethnicity_Hispanic_Checkbox_page9_1',
  'Beneficiary_Information_Biographic_Information_Ethnicity_Not_Hispanic_Checkbox_page9_1',
  'Beneficiary_Information_Biographic_Information_Race_White_Checkbox_page9_2',
  'Beneficiary_Information_Biographic_Information_Race_Asian_Checkbox_page9_2',
  'Beneficiary_Information_Biographic_Information_Race_Black_AfricanAmerican_Checkbox_page9_2',
  'Beneficiary_Information_Biographic_Information_Race_NativeHawaiian_OtherPacificIslander_Checkbox_page9_2',
  'Beneficiary_Information_Biographic_Information_Height_Feet_Checkbox_page9_3',
  'Beneficiary_Information_Biographic_Information_Height_Inches_Checkbox_page9_3',
  'Beneficiary_Information_Biographic_Information_Eye_Color_Checkboxes_page9_5',
  'Beneficiary_Information_Biographic_Information_Hair_Color_Checkboxes_page9_6',
];

function norm(v) {
  if (v === null || v === undefined) return '';
  return String(v);
}

function pad2(x) {
  return String(x).padStart(2, '0');
}

function fmtDate(v) {
  if (!v) return '';
  const s = String(v).trim();

  // yyyy-mm-dd -> MM/DD/YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-');
    return `${m}/${d}/${y}`;
  }

  // m/d/yyyy or mm/dd/yyyy -> MM/DD/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [m, d, y] = s.split('/');
    return `${pad2(m)}/${pad2(d)}/${y}`;
  }

  return s;
}

function firstNonEmpty(...vals) {
  for (const v of vals) {
    const s = norm(v).trim();
    if (s) return v;
  }
  return '';
}

function splitCityCountry(v) {
  const s = norm(v).trim();
  if (!s) return { city: '', country: '' };
  if (!s.includes(',')) return { city: s, country: '' };
  const [city, ...rest] = s.split(',');
  return { city: city.trim(), country: rest.join(',').trim() };
}

function pickUnitType(v) {
  if (!v) return '';
  const s = String(v).trim().toLowerCase();
  if (s.startsWith('apt')) return 'Apt';
  if (s.startsWith('ste') || s.startsWith('sui')) return 'Ste';
  if (s.startsWith('fl')) return 'Flr';
  return '';
}

function yesNoToBool(v) {
  if (v === true) return true;
  if (v === false) return false;
  const s = String(v || '').trim().toLowerCase();
  if (['y', 'yes', 'true', '1'].includes(s)) return true;
  if (['n', 'no', 'false', '0'].includes(s)) return false;
  return null;
}

function safeSetText(form, name, value) {
  const s = norm(value).trim();
  if (!s) return;
  try {
    form.getTextField(name).setText(s);
  } catch {}
}

function safeCheckBox(form, name, checked) {
  try {
    const cb = form.getCheckBox(name);
    if (checked) cb.check();
    else cb.uncheck();
  } catch {}
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

// -----------------------------
// Direct PDF overrides (optional)
// -----------------------------
function fmtDateMaybe(v) {
  if (!v) return '';
  const s = String(v).trim();
  // YYYY-MM-DD -> MM/DD/YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-');
    return `${m}/${d}/${y}`;
  }
  return s;
}

function trySetText(form, name, value) {
  try {
    form.getTextField(name).setText(String(value ?? ''));
    return true;
  } catch {
    return false;
  }
}

function trySetCheckbox(form, name, checked) {
  try {
    const cb = form.getCheckBox(name);
    if (checked) cb.check();
    else cb.uncheck();
    return true;
  } catch {
    return false;
  }
}

function trySetRadio(form, groupName, exportValue) {
  try {
    const rg = form.getRadioGroup(groupName);
    if (exportValue) rg.select(String(exportValue));
    return true;
  } catch {
    return false;
  }
}

function trySetDropdown(form, name, optionValue) {
  try {
    const dd = form.getDropdown(name);
    if (optionValue) dd.select(String(optionValue));
    return true;
  } catch {
    return false;
  }
}

function applyPdfOverrides(form, overrides, onMissing) {
  if (!overrides || typeof overrides !== 'object') return;

  for (const [pdfName, raw] of Object.entries(overrides)) {
    if (!pdfName) continue;
    if (raw === undefined || raw === null) continue;

    // Boolean -> checkbox
    if (typeof raw === 'boolean') {
      const ok = trySetCheckbox(form, pdfName, raw);
      if (!ok && onMissing) onMissing({ source: 'pdf', pdfName, value: raw });
      continue;
    }

    if (Array.isArray(raw)) continue; // not used

    const value = fmtDateMaybe(raw);
    const s = String(value ?? '').trim();
    if (!s) continue;

    // Try common widget types in a safe order
    if (trySetRadio(form, pdfName, s)) continue; // radio group name
    if (trySetDropdown(form, pdfName, s)) continue; // dropdown name
    if (trySetText(form, pdfName, s)) continue; // text field name

    // Some PDFs represent "checkboxes" as text/radio exports; attempt to treat common true/false strings
    const lower = s.toLowerCase();
    if (['y', 'yes', 'true', '1', 'on'].includes(lower)) {
      if (trySetCheckbox(form, pdfName, true)) continue;
    }
    if (['n', 'no', 'false', '0', 'off'].includes(lower)) {
      if (trySetCheckbox(form, pdfName, false)) continue;
    }

    if (onMissing) onMissing({ source: 'pdf', pdfName, value: raw });
  }
}

export function applyI129fMapping(saved = {}, form, opts = {}) {
  // Accept either {data:{...}} or {...}
  const root =
    saved && typeof saved === 'object' && saved.data && typeof saved.data === 'object'
      ? saved.data
      : saved;

  const petitioner = root.petitioner || {};
  const beneficiary = root.beneficiary || {};
  const contact = root.contact || {};
  const interpreter = root.interpreter || {};
  const preparer = root.preparer || {};

  // -----------------------------
  // Part 1 — Petitioner basics
  // -----------------------------
  safeSetText(form, 'Petitioner_Family_Name_Last_Name_page1_1.a', petitioner.lastName);
  safeSetText(form, 'Petitioner_Given_Name_First_Name_page1_1.b', petitioner.firstName);
  safeSetText(form, 'Petitioner_Middle_Name_page1_1.c', petitioner.middleName);

  safeSetText(form, 'Petitioner_A_Number_if_any_page1_2', petitioner.aNumber);
  safeSetText(form, 'Petitioner_Social_Security_Number_page1_3', petitioner.ssn);

  safeSetText(form, 'Petitioner_Date_Of_Birth_page1_4', fmtDate(petitioner.dob));
  safeSetText(form, 'Petitioner_Sex_page1_5', petitioner.sex);
  safeSetText(form, 'Petitioner_City_Town_Village_Birth_page1_6', petitioner.cityBirth);
  safeSetText(form, 'Petitioner_Country_Of_Birth_page1_7', petitioner.countryBirth);

  // Classification requested (K1 vs K3)
  safeCheckBox(form, 'Petitioner_Request_Beneficiary_K1_page_1_Num_4a', false);
  safeCheckBox(form, 'Petitioner_Request_Beneficiary_K3_page_1_Num_4b', false);
  if ((petitioner.classification || '').toLowerCase() === 'k3') {
    safeCheckBox(form, 'Petitioner_Request_Beneficiary_K3_page_1_Num_4b', true);
  } else {
    safeCheckBox(form, 'Petitioner_Request_Beneficiary_K1_page_1_Num_4a', true);
  }

  // If K-3: Filed I-130? (yes/no checkboxes)
  safeCheckBox(form, 'Petitioner_Filing_K3_Filed_I130__Yes', false);
  safeCheckBox(form, 'Petitioner_Filing_K3_Filed_I130__No', false);
  if ((petitioner.classification || '').toLowerCase() === 'k3') {
    const yn = yesNoToBool(petitioner.filedI130);
    if (yn === true) safeCheckBox(form, 'Petitioner_Filing_K3_Filed_I130__Yes', true);
    if (yn === false) safeCheckBox(form, 'Petitioner_Filing_K3_Filed_I130__No', true);
  }

  // Other names used (PDF has ONE row): map first non-empty row from wizard
  {
    const list = Array.isArray(petitioner.otherNamesUsed)
      ? petitioner.otherNamesUsed
      : Array.isArray(petitioner.otherNames)
        ? petitioner.otherNames
        : [];
    const o =
      list.find((x) => {
        const a = String(x?.lastName || '').trim();
        const b = String(x?.firstName || '').trim();
        const c = String(x?.middleName || '').trim();
        return !!(a || b || c);
      }) || {};
    safeSetText(form, 'Other_Names_Last_Name_page1_5.a', o.lastName);
    safeSetText(form, 'Other_Names_First_Name_page1_5.b', o.firstName);
    safeSetText(form, 'Other_Names_Middle_Name_page1_5.c', o.middleName);
  }

  // -----------------------------
  // Petitioner Mailing Address (Page 1)
  // -----------------------------
  {
    const m = petitioner.mailing || {};
    safeSetText(form, 'Petitioner_in_care_of_page1_8.a', m.inCareOf);
    safeSetText(form, 'Petitioner_Mailing_Street_Number_Name_page1_8.b', m.street);

    const unitType = pickUnitType(m.unitType);
    const unitNo = firstNonEmpty(m.unitNumber, m.aptNumber, m.steNumber, m.flrNumber);

    safeCheckBox(form, 'Petitioner_in_care_of_APt_Ste_Flr_number_Page1_8.c', false);
    safeCheckBox(form, 'Petitioner_in_care_of_APt_Ste_Flr_number_Page1_8.c.Apt', false);
    safeCheckBox(form, 'Petitioner_in_care_of_APt_Ste_Flr_number_Page1_8.c.Ste', false);
    safeCheckBox(form, 'Petitioner_in_care_of_APt_Ste_Flr_number_Page1_8.c.Flr', false);

    if (unitType === 'Apt') safeCheckBox(form, 'Petitioner_in_care_of_APt_Ste_Flr_number_Page1_8.c.Apt', true);
    if (unitType === 'Ste') safeCheckBox(form, 'Petitioner_in_care_of_APt_Ste_Flr_number_Page1_8.c.Ste', true);
    if (unitType === 'Flr') safeCheckBox(form, 'Petitioner_in_care_of_APt_Ste_Flr_number_Page1_8.c.Flr', true);

    safeSetText(form, 'Petitioner_in_care_of_Apt_Ste_Flr_number_page1_8.d', unitNo);

    safeSetText(form, 'Petitioner_in_Care_of_City_page1_8.c', m.city);
    safeSetText(form, 'Petitioner_in_Care_of_State_page1_8.e', m.state);
    safeSetText(form, 'Petitioner_in_Care_of_ZipCode_page1_8.f', m.zip);
    safeSetText(form, 'Petitioner_in_Care_of_Province_page1_8.g', m.province);
    safeSetText(form, 'Petitioner_in_Care_of_Postal_Code_page1_8.h', m.postal);
    safeSetText(form, 'Petitioner_in_Care_of_Country_page1_8.i', m.country);

    // Mailing same as physical (8.j yes/no)
    const same = !!m.sameAsPhysical;
    safeCheckBox(form, 'Petitioner_Mailing_Adress_Same_as_physical_checkbox_Yes_page1_8.j', same);
    safeCheckBox(form, 'Petitioner_Mailing_Adress_Same_as_physical_checkbox_No_page1_8.j', !same);
  }

  // -----------------------------
  // Petitioner Physical Address History (Page 2) — 2 rows
  // -----------------------------
  {
    const list = Array.isArray(petitioner.physicalAddresses) ? petitioner.physicalAddresses : [];
    const a1 = list[0] || {};
    const a2 = list[1] || {};

    // Row 1
    safeSetText(form, 'Petitioner_Address_1_History_Street_page2_10.a', a1.street);
    safeSetText(form, 'Petitioner_Address_1_History_City_page2_10.c', a1.city);
    safeSetText(form, 'Petitioner_Address_1_History_State_page2_10.d', a1.state);
    safeSetText(form, 'Petitioner_Address_1_History_ZipCode_page2_10.e', a1.zip);
    safeSetText(form, 'Petitioner_Address_1_History_Country_page2_10.h', a1.country);

    safeSetText(form, 'Petitioner_Address_1_History_DateFrom_page2_11.a', fmtDate(a1.from));
    safeSetText(form, 'Petitioner_Address_1_History_DateTo_page2_11.b', fmtDate(a1.to));

    // Row 2
    safeSetText(form, 'Petitioner_Address_2_History_Street_page2_11.c', a2.street);
    safeSetText(form, 'Petitioner_Address_2_History_City_page2_11.g', a2.city);
    safeSetText(form, 'Petitioner_Address_2_History_State_page2_11.d', a2.state);
    safeSetText(form, 'Petitioner_Address_2_History_ZipCode_page2_11.e', a2.zip);
    safeSetText(form, 'Petitioner_Address_2_History_Country_page2_11.h', a2.country);

    safeSetText(form, 'Petitioner_Address_2_History_DateFrom_page2_12.a', fmtDate(a2.from));
    safeSetText(form, 'Petitioner_Address_2_History_DateTo_page2_12.b', fmtDate(a2.to));
  }

  // -----------------------------
  // Beneficiary basics (Page 4)
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

  // -----------------------------
  // Beneficiary Employment (Pages 5-6) — Items 16-23
  // -----------------------------
  {
    const emp = Array.isArray(beneficiary.employment) ? beneficiary.employment : [];
    const emp1 = emp[0] || {};
    const emp2 = emp[1] || {};

    // Employer 1
    safeSetText(form, 'Beneficiary_Employer_1_Address_NameOfEmployer_page5_16', emp1.employer);
    safeSetText(form, 'Beneficiary_Employer_1_Addres_StreetNumber_Name_page5_17.a', emp1.street);
    safeSetText(form, 'Beneficiary_Employer_1_Addres_Apt_Ste_Flr_Num_Field_page5_17.b', emp1.unitNumber);
    {
      const ut = String(firstNonEmpty(emp1.unitType, emp1.unit) || '').trim().toLowerCase();
      if (ut.startsWith('apt')) {
        safeSelectRadio(form, 'Beneficiary_Employer_1_Addres_Apt_Ste_Flr_num_page5_17.b', 'Beneficiary_Employer_1_Addres_Apt_CheckBox_page5_17.b');
      } else if (ut.startsWith('ste') || ut.startsWith('suite')) {
        safeSelectRadio(form, 'Beneficiary_Employer_1_Addres_Apt_Ste_Flr_num_page5_17.b', 'Beneficiary_Employer_1_Addres_Ste_CheckBox_page5_17.b');
      } else if (ut.startsWith('flr') || ut.startsWith('floor')) {
        safeSelectRadio(form, 'Beneficiary_Employer_1_Addres_Apt_Ste_Flr_num_page5_17.b', 'Beneficiary_Employer_1_Addres_Floor_CheckBox_page5_17.b');
      }
    }
    safeSetText(form, 'Beneficiary_Employer_1_Addres_City_Town_page5_17.c', emp1.city);
    safeSetText(form, 'Beneficiary_Employer_1_Addres_State_page5_17.d', emp1.state);
    safeSetText(form, 'Beneficiary_Employer_1_Addres_ZipCode_page5_17.e', emp1.zip);
    safeSetText(form, 'Beneficiary_Employer_1_Addres_Province_page5_17.f', emp1.province);
    safeSetText(form, 'Beneficiary_Employer_1_Addres_PostalCode_page5_17.g', emp1.postal);
    safeSetText(form, 'Beneficiary_Employer_1_Addres_country_page5_17.h', emp1.country);
    safeSetText(form, 'Beneficiary_Employer_1_Addres_Occupation_page5_18', emp1.occupation);
    safeSetText(form, 'Beneficiary_Employer_1_Addres_StartDate_page5_19.a', fmtDate(emp1.from));
    safeSetText(form, 'Beneficiary_Employer_1_Addres_EndDate_page5_19.b', fmtDate(emp1.to));

    // Employer 2
    safeSetText(form, 'Beneficiary_Employer_2_Address_NameOfEmployer_page6_20', emp2.employer);
    safeSetText(form, 'Beneficiary_Employer_2_Addres_StreetNumber_Name_page6_21.a', emp2.street);
    safeSetText(form, 'Beneficiary_Employer_2_Addres_Apt_Ste_Flr_Num_Field_page6_21.b', emp2.unitNumber);
    {
      const ut = String(firstNonEmpty(emp2.unitType, emp2.unit) || '').trim().toLowerCase();
      if (ut.startsWith('apt')) {
        safeSelectRadio(form, 'Beneficiary_Employer_2_Addres_Apt_Ste_Flr_num_page6_21.b', 'Beneficiary_Employer_2_Addres_Apt_CheckBox_page6_21.b');
      } else if (ut.startsWith('ste') || ut.startsWith('suite')) {
        safeSelectRadio(form, 'Beneficiary_Employer_2_Addres_Apt_Ste_Flr_num_page6_21.b', 'Beneficiary_Employer_2_Addres_Ste_CheckBox_page6_21.b');
      } else if (ut.startsWith('flr') || ut.startsWith('floor')) {
        safeSelectRadio(form, 'Beneficiary_Employer_2_Addres_Apt_Ste_Flr_num_page6_21.b', 'Beneficiary_Employer_2_Addres_Flr_CheckBox_page6_21.b');
      }
    }
    safeSetText(form, 'Beneficiary_Employer_2_Addres_City_Town_page6_21.c', emp2.city);
    safeSetText(form, 'Beneficiary_Employer_2_State_page6_21.d', emp2.state);
    safeSetText(form, 'Beneficiary_Employer_2_ZipCode_page6_21.e', emp2.zip);
    safeSetText(form, 'Beneficiary_Employer_2_Province_page6_21.f', emp2.province);
    safeSetText(form, 'Beneficiary_Employer_2_PostalCode_page6_21.g', emp2.postal);
    safeSetText(form, 'Beneficiary_Employer_2_Country_page6_21.h', emp2.country);
    safeSetText(form, 'Beneficiary_Employer_2_Occupation_page6_22', emp2.occupation);
    safeSetText(form, 'Beneficiary_Employer_2_StartDate_page6_23.a', fmtDate(emp2.from));
    safeSetText(form, 'Beneficiary_Employer_2_EndDate_page6_23.b', fmtDate(emp2.to));
  }

  // -----------------------------
  // Beneficiary Parents (Page 6) — Items 24-33
  // -----------------------------
  {
    const parents = Array.isArray(beneficiary.parents) ? beneficiary.parents : [];
    const p1 = parents[0] || {};
    const p2 = parents[1] || {};

    // Parent 1
    safeSetText(form, 'Beneficiary_Parent_1_Information_LastName_page6_24.a', p1.lastName);
    safeSetText(form, 'Beneficiary_Parent_1_Information_FirstName_page6_24.b', p1.firstName);
    safeSetText(form, 'Beneficiary_Parent_1_Information_MiddleName_page6_24.c', p1.middleName);
    safeSetText(form, 'Beneficiary_Parent_1_Information_Date_Of_Birth_page6_25', fmtDate(p1.dob));
    {
      const sex = String(p1.sex || '').trim().toLowerCase();
      if (sex.startsWith('m')) {
        safeSelectRadio(form, 'Beneficiary_Parent_1_Information_Sex_Male_Female_Checkboxes_page6_26', 'Beneficiary_Parent_1_Information_Sex_Male_Checkbox_page6_26');
      } else if (sex.startsWith('f')) {
        safeSelectRadio(form, 'Beneficiary_Parent_1_Information_Sex_Male_Female_Checkboxes_page6_26', 'Beneficiary_Parent_1_Information_Sex_FeMale_Checkbox_page6_26');
      }
    }
    safeSetText(form, 'Beneficiary_Parent_1_Information_Country_Of_birth_page6_27', p1.countryBirth);
    {
      const fb = splitCityCountry(p1.currentCityCountry);
      safeSetText(form, 'Beneficiary_Parent_1_Information_City_Ton_Village_Residence_page6_28.a', firstNonEmpty(p1.residenceCity, fb.city));
      safeSetText(form, 'Beneficiary_Parent_1_Information_Country_of__Residence_page6_28.b', firstNonEmpty(p1.residenceCountry, fb.country));
    }

    // Parent 2
    safeSetText(form, 'Beneficiary_Parent_2_Information_LastName_page6_29.a', p2.lastName);
    safeSetText(form, 'Beneficiary_Parent_2_Information_FirstName_page6_29.b', p2.firstName);
    safeSetText(form, 'Beneficiary_Parent_2_Information_MiddleName_page6_29.c', p2.middleName);
    safeSetText(form, 'Beneficiary_Parent_2_Information_DateOfBirth_page6_30', fmtDate(p2.dob));
    {
      const sex = String(p2.sex || '').trim().toLowerCase();
      if (sex.startsWith('m')) {
        safeSelectRadio(form, 'Beneficiary_Parent_2_Information_Sex_Male_Female_Checkboxes_page6_31', 'Beneficiary_Parent_2_Information_Sex_Male_Checkbox_page6_31');
      } else if (sex.startsWith('f')) {
        safeSelectRadio(form, 'Beneficiary_Parent_2_Information_Sex_Male_Female_Checkboxes_page6_31', 'Beneficiary_Parent_2_Information_Sex_Female_Checkbox_page6_31');
      }
    }
    safeSetText(form, 'Beneficiary_Parent_2_Information_Country_Of_Birth_page6_32', p2.countryBirth);
    {
      const fb = splitCityCountry(p2.currentCityCountry);
      safeSetText(form, 'Beneficiary_Parent_2_Information_City_Town_Village_residence_page6_33.a', firstNonEmpty(p2.residenceCity, fb.city));
      safeSetText(form, 'Beneficiary_Parent_2_Information_Country_residence_page6_33.b', firstNonEmpty(p2.residenceCountry, fb.country));
    }
  }

  // -----------------------------
  // Beneficiary Biographic (Page 9) — FIXES Hispanic / Race / Height / Eye / Hair
  // -----------------------------
  {
    // Ethnicity (yes/no -> check only ONE)
    const yn = yesNoToBool(beneficiary.ethnicityHispanic);
    const HISP = 'Beneficiary_Information_Biographic_Information_Ethnicity_Hispanic_Checkbox_page9_1';
    const NOTH = 'Beneficiary_Information_Biographic_Information_Ethnicity_Not_Hispanic_Checkbox_page9_1';

    safeCheckBox(form, HISP, false);
    safeCheckBox(form, NOTH, false);

    // If your PDF also uses a radio group, this is the group name:
    const group = 'Beneficiary_Information_Biographic_Information_Ethnicity_Hispanic_Not_Hispanic_Checkboxes_page9_1';

    if (yn === true) {
      const ok = safeSelectRadio(form, group, HISP);
      if (!ok) safeCheckBox(form, HISP, true);
    } else if (yn === false) {
      const ok = safeSelectRadio(form, group, NOTH);
      if (!ok) safeCheckBox(form, NOTH, true);
    }

    // Race (single select -> check exactly one)
    const race = String(beneficiary.race || '').trim().toLowerCase();
    const RACE = {
      white: 'Beneficiary_Information_Biographic_Information_Race_White_Checkbox_page9_2',
      asian: 'Beneficiary_Information_Biographic_Information_Race_Asian_Checkbox_page9_2',
      black: 'Beneficiary_Information_Biographic_Information_Race_Black_AfricanAmerican_Checkbox_page9_2',
      nhopi: 'Beneficiary_Information_Biographic_Information_Race_NativeHawaiian_OtherPacificIslander_Checkbox_page9_2',
    };

    Object.values(RACE).forEach((n) => safeCheckBox(form, n, false));
    if (RACE[race]) safeCheckBox(form, RACE[race], true);

    // Height
    safeSetText(form, 'Beneficiary_Information_Biographic_Information_Height_Feet_Checkbox_page9_3', beneficiary.heightFeet);
    safeSetText(form, 'Beneficiary_Information_Biographic_Information_Height_Inches_Checkbox_page9_3', beneficiary.heightInches);

    // Weight (lbs) -> 3 separate digit boxes on the PDF
    // Wizard stores a single number/string in beneficiary.weight (e.g., "175").
    {
      const raw = String(beneficiary.weight || '').replace(/[^0-9]/g, '').trim();
      let h = '',
        t = '',
        o = '';
      if (raw.length === 1) {
        o = raw;
      } else if (raw.length === 2) {
        t = raw[0];
        o = raw[1];
      } else if (raw.length >= 3) {
        const last3 = raw.slice(-3);
        h = last3[0];
        t = last3[1];
        o = last3[2];
      }

      safeSetText(form, 'Beneficiary_Information_Biographic_Information_Weight_100_Pound_Digit_Checkbox_page9_4', h);
      safeSetText(form, 'Beneficiary_Information_Biographic_Information_Weight_10_Digit_Holder_Checkbox_page9_4', t);
      safeSetText(form, 'Beneficiary_Information_Biographic_Information_Weight_Single_Pound_Digit_Checkbox_page9_4', o);
    }

    // Eye Color (radio group + fallback checkboxes)
    const eye = String(beneficiary.eyeColor || '').trim().toLowerCase();
    const EYE = {
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

    Object.values(EYE).forEach((n) => safeCheckBox(form, n, false));
    if (EYE[eye]) {
      const ok = safeSelectRadio(form, 'Beneficiary_Information_Biographic_Information_Eye_Color_Checkboxes_page9_5', EYE[eye]);
      if (!ok) safeCheckBox(form, EYE[eye], true);
    }

    // Hair Color (radio group + fallback checkboxes)
    const hair = String(beneficiary.hairColor || '').trim().toLowerCase();
    const HAIR = {
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

    Object.values(HAIR).forEach((n) => safeCheckBox(form, n, false));
    if (HAIR[hair]) {
      const ok = safeSelectRadio(form, 'Beneficiary_Information_Biographic_Information_Hair_Color_Checkboxes_page9_6', HAIR[hair]);
      if (!ok) safeCheckBox(form, HAIR[hair], true);
    }
  }

  // -----------------------------
  // Parts 5–7
  // -----------------------------
  safeSetText(form, 'Petitioners_Contact_Information_daytime_Phone_Number_page10_1', contact.daytimePhone);
  safeSetText(form, 'Petitioners_Contact_Information_Mobile_Phone_Number_page10_2', contact.mobile);
  safeSetText(form, 'Petitioners_Contact_Information_Email_Address_page10_3', contact.email);

  safeSetText(form, 'Interpreter_Last_Name_page10_1.a', interpreter.lastName);
  safeSetText(form, 'Interpreter_First_Name_page10_1.b', interpreter.firstName);
  safeSetText(form, 'Interpreter_Business_Org_page10_2', interpreter.business);
  safeSetText(form, 'Interpreter_Daytime_Phone_page10_3', interpreter.phone);
  safeSetText(form, 'Interpreter_Email_page10_5', interpreter.email);
  safeSetText(form, 'Interpreter_Certification_Date_Of_Birth_page10_6', fmtDate(interpreter.signDate));

  safeSetText(form, 'Prepare_Last_Name_page11_1.a', preparer.lastName);
  safeSetText(form, 'Prepare_First_Name_page11_1.b', preparer.firstName);
  safeSetText(form, 'Prepare_Business_Org_page11_2', preparer.business);
  safeSetText(form, 'Prepare_Daytime_Phone_page11_3', preparer.phone);
  safeSetText(form, 'Prepare_Email_page11_5', preparer.email);
  safeSetText(form, 'Preparer_Certification_Date_Of_Signature_page11_8', fmtDate(preparer.signDate));

  // -----------------------------
  // Direct PDF field overrides (from the wizard "All PDF Fields" section)
  // -----------------------------
  try {
    applyPdfOverrides(form, root.pdf || {}, opts?.onMissingPdfField);
  } catch {}

  return true;
}
