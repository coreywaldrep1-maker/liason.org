// lib/i129f-mapping.js
//
// One place to fill the I-129F AcroForm.
// Exports applyI129fMapping(data, form).
//
// Strategy
// - Try to map from your structured wizard JSON
// - If something isn't in your JSON yet, it will still fill if you put
//   a raw PDF field under data.other["PdfFieldName"].
// - Dates normalized to MM/DD/YYYY
//
// Return shape: { filled: string[], missing: string[], errors: string[] }

function get(obj, path) {
  if (!obj) return undefined;
  const parts = Array.isArray(path) ? path : String(path).split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function mmddyyyy(raw) {
  if (!raw) return '';
  // accept "YYYY-MM-DD", ISO, or already MM/DD/YYYY
  const s = String(raw).trim();
  if (!s) return '';
  // already has slash and looks fine
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(s)) return s;

  // YYYY-MM-DD
  const m1 = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m1) {
    const [, y, m, d] = m1;
    return `${m.padStart(2, '0')}/${d.padStart(2, '0')}/${y}`;
  }

  // Fallback: try Date()
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yy = String(d.getFullYear());
    return `${mm}/${dd}/${yy}`;
  }
  return s;
}

function setTextField(form, pdfName, value, filled, missing) {
  try {
    if (value == null || value === '') {
      missing.push(pdfName);
      return;
    }
    const f = form.getTextField(pdfName);
    f.setText(String(value));
    filled.push(pdfName);
  } catch {
    // not a text field, try checkbox/select via helpers instead (or mark missing)
    missing.push(pdfName);
  }
}

function checkBox(form, pdfName, checked, filled, missing) {
  try {
    const c = form.getCheckBox(pdfName);
    if (checked) {
      c.check();
    } else {
      c.uncheck?.();
    }
    filled.push(pdfName);
  } catch {
    missing.push(pdfName);
  }
}

function selectDropdown(form, pdfName, option, filled, missing) {
  try {
    if (option == null || option === '') {
      missing.push(pdfName);
      return;
    }
    const d = form.getDropdown(pdfName);
    d.select(String(option));
    filled.push(pdfName);
  } catch {
    missing.push(pdfName);
  }
}

function setFromOther(data, form, pdfName, filled, missing) {
  const val = data?.other?.[pdfName];
  if (val == null || val === '') {
    missing.push(pdfName);
    return;
  }
  setTextField(form, pdfName, val, filled, missing);
}

export function applyI129fMapping(data, form) {
  const filled = [];
  const missing = [];
  const errors = [];

  // ---------- PART 1: PETITIONER ----------
  try {
    // IDs / Numbers
    setTextField(form, 'Pt1Line1_AlienNumber', get(data, 'petitioner.aNumber'), filled, missing);
    setTextField(form, 'Pt1Line2_AcctIdentifier', get(data, 'petitioner.uscisOnlineAccount'), filled, missing);
    setTextField(form, 'Pt1Line3_SSN', get(data, 'petitioner.ssn'), filled, missing);

    // Names (corrected: Pt1Line6a–6c are the petitioner’s legal name)
    setTextField(form, 'Pt1Line6a_FamilyName', get(data, 'petitioner.lastName'), filled, missing);
    setTextField(form, 'Pt1Line6b_GivenName', get(data, 'petitioner.firstName'), filled, missing);
    setTextField(form, 'Pt1Line6c_MiddleName', get(data, 'petitioner.middleName'), filled, missing);

    // Other names used (first slot)
    const otherName0 = get(data, 'petitioner.otherNames.0') || {};
    setTextField(form, 'Pt1Line7a_FamilyName', otherName0.lastName, filled, missing);
    setTextField(form, 'Pt1Line7b_GivenName', otherName0.firstName, filled, missing);
    setTextField(form, 'Pt1Line7c_MiddleName', otherName0.middleName, filled, missing);

    // Mailing address (Line 8)
    const mail = get(data, 'mailing') || {};
    setTextField(form, 'Pt1Line8_InCareofName', mail.inCareOf, filled, missing);
    setTextField(form, 'Pt1Line8_StreetNumberName', mail.street, filled, missing);
    // Unit type/nr (PDF has odd fields; we write both text & checkbox/option where present)
    setTextField(form, 'Pt1Line8_AptSteFlrNumber', mail.unitNum, filled, missing);
    setTextField(form, 'Pt1Line8_CityOrTown', mail.city, filled, missing);
    setTextField(form, 'Pt1Line8_State', mail.state, filled, missing);
    setTextField(form, 'Pt1Line8_ZipCode', mail.zip, filled, missing);
    setTextField(form, 'Pt1Line8_Province', mail.province, filled, missing);
    setTextField(form, 'Pt1Line8_PostalCode', mail.postal, filled, missing);
    setTextField(form, 'Pt1Line8_Country', mail.country, filled, missing);

    // If your UI stores a unitType like "Apt/Ste/Flr", try both a dropdown/checkbox name and a text name
    setTextField(form, 'Pt1Line8_Unit_p0_ch3', mail.unitType, filled, missing);

    // Sometimes there’s a US/non-US toggle on 8j
    if (get(data, 'mailing.isUS') != null) {
      checkBox(form, 'Pt1Line8j_Checkboxes_p0_ch2', !!get(data, 'mailing.isUS'), filled, missing);
    }

    // Physical Address History (current + prior) — we map 0 → Line 9*, 1 → Line 14*
    const addr0 = get(data, 'physicalAddresses.0') || {};
    setTextField(form, 'Pt1Line9_StreetNumberName', addr0.street, filled, missing);
    setTextField(form, 'Pt1Line9_AptSteFlrNumber', addr0.unitNum, filled, missing);
    setTextField(form, 'Pt1Line9_CityOrTown', addr0.city, filled, missing);
    setTextField(form, 'Pt1Line9_State', addr0.state, filled, missing);
    setTextField(form, 'Pt1Line9_ZipCode', addr0.zip, filled, missing);
    setTextField(form, 'Pt1Line9_Province', addr0.province, filled, missing);
    setTextField(form, 'Pt1Line9_PostalCode', addr0.postal, filled, missing);
    setTextField(form, 'Pt1Line9_Country', addr0.country, filled, missing);

    // From/To dates for physical address 0 (Lines 10a/10b)
    setTextField(form, 'Pt1Line10a_DateFrom', mmddyyyy(addr0.from), filled, missing);
    setTextField(form, 'Pt1Line10b_DateFrom', mmddyyyy(addr0.to), filled, missing);

    // Prior physical address (Line 14*)
    const addr1 = get(data, 'physicalAddresses.1') || {};
    setTextField(form, 'Pt1Line14_StreetNumberName', addr1.street, filled, missing);
    setTextField(form, 'Pt1Line14_AptSteFlrNumber', addr1.unitNum, filled, missing);
    setTextField(form, 'Pt1Line14_CityOrTown', addr1.city, filled, missing);
    setTextField(form, 'Pt1Line14_State', addr1.state, filled, missing);
    setTextField(form, 'Pt1Line14_ZipCode', addr1.zip, filled, missing);
    setTextField(form, 'Pt1Line14_Province', addr1.province, filled, missing);
    setTextField(form, 'Pt1Line14_PostalCode', addr1.postal, filled, missing);
    setTextField(form, 'Pt1Line14_Country', addr1.country, filled, missing);

    // Employment history (Line 16–20 appear to be dates/occupation blocks around employers)
    const emp0 = get(data, 'employment.0') || {};
    setTextField(form, 'Pt1Line13_NameofEmployer', emp0.employer, filled, missing);
    setTextField(form, 'Pt1Line11_StreetNumberName', emp0.street, filled, missing);
    setTextField(form, 'Pt1Line11_AptSteFlrNumber', emp0.unitNum, filled, missing);
    setTextField(form, 'Pt1Line11_CityOrTown', emp0.city, filled, missing);
    setTextField(form, 'Pt1Line11_State', emp0.state, filled, missing);
    setTextField(form, 'Pt1Line11_ZipCode', emp0.zip, filled, missing);
    setTextField(form, 'Pt1Line11_Province', emp0.province, filled, missing);
    setTextField(form, 'Pt1Line11_PostalCode', emp0.postal, filled, missing);
    setTextField(form, 'Pt1Line11_Country', emp0.country, filled, missing);
    setTextField(form, 'Pt1Line15_Occupation', emp0.occupation, filled, missing);
    setTextField(form, 'Pt1Line16a_DateFrom', mmddyyyy(emp0.from), filled, missing);
    setTextField(form, 'Pt1Line16b_ToFrom', mmddyyyy(emp0.to), filled, missing);

    const emp1 = get(data, 'employment.1') || {};
    setTextField(form, 'Pt1Line17_NameofEmployer', emp1.employer, filled, missing);
    setTextField(form, 'Pt1Line18_StreetNumberName', emp1.street, filled, missing);
    setTextField(form, 'Pt1Line18_AptSteFlrNumber', emp1.unitNum, filled, missing);
    setTextField(form, 'Pt1Line18_CityOrTown', emp1.city, filled, missing);
    setTextField(form, 'Pt1Line18_State', emp1.state, filled, missing);
    setTextField(form, 'Pt1Line18_ZipCode', emp1.zip, filled, missing);
    setTextField(form, 'Pt1Line18_Province', emp1.province, filled, missing);
    setTextField(form, 'Pt1Line18_PostalCode', emp1.postal, filled, missing);
    setTextField(form, 'Pt1Line18_Country', emp1.country, filled, missing);
    setTextField(form, 'Pt1Line19_Occupation', emp1.occupation, filled, missing);
    setTextField(form, 'Pt1Line20a_DateFrom', mmddyyyy(emp1.from), filled, missing);
    setTextField(form, 'Pt1Line20b_ToFrom', mmddyyyy(emp1.to), filled, missing);

    // Parents (we’ll populate first parent into Lines 32–37; second parent into Lines 38–41-ish depending on your PDF)
    const par0 = get(data, 'petitioner.parents.0') || {};
    setTextField(form, 'Pt1Line32a_FamilyName', par0.lastName, filled, missing);
    setTextField(form, 'Pt1Line32b_GivenName', par0.firstName, filled, missing);
    setTextField(form, 'Pt1Line32c_MiddleName', par0.middleName, filled, missing);
    setTextField(form, 'Pt1Line33_DateofBirth', mmddyyyy(par0.dob), filled, missing);
    setTextField(form, 'Pt1Line35_CountryOfCitzOrNationality', par0.country, filled, missing);
    setTextField(form, 'Pt1Line36a_CityTownOfBirth', par0.cityBirth, filled, missing);
    setTextField(form, 'Pt1Line36b_CountryOfCitzOrNationality', par0.countryBirth, filled, missing);

    const par1 = get(data, 'petitioner.parents.1') || {};
    setTextField(form, 'Pt1Line38a_FamilyName', par1.lastName, filled, missing);
    setTextField(form, 'Pt1Line38b_GivenName', par1.firstName, filled, missing);
    setTextField(form, 'Pt1Line38c_MiddleName', par1.middleName, filled, missing);
    setTextField(form, 'Pt1Line39_DateMarriageEnded', mmddyyyy(par1.dob), filled, missing); // field name is odd; your PDF may use a different one for DOB here
    setTextField(form, 'Pt1Line31_CityTownOfBirth', par1.cityBirth, filled, missing);
    setTextField(form, 'Pt1Line31_CountryOfCitzOrNationality', par1.countryBirth, filled, missing);

    // Other petitioner items you already store
    setTextField(form, 'Pt1Line42a_NaturalizationNumber', get(data, 'petitioner.natzNumber'), filled, missing);
    setTextField(form, 'Pt1Line42b_NaturalizationPlaceOfIssuance', get(data, 'petitioner.natzPlace'), filled, missing);
    setTextField(form, 'Pt1Line42c_DateOfIssuance', mmddyyyy(get(data, 'petitioner.natzDate')), filled, missing);

  } catch (e) {
    errors.push(String(e));
  }

  // ---------- PART 2: BENEFICIARY ----------
  try {
    setTextField(form, 'Pt2Line1a_FamilyName', get(data, 'beneficiary.lastName'), filled, missing);
    setTextField(form, 'Pt2Line1b_GivenName', get(data, 'beneficiary.firstName'), filled, missing);
    setTextField(form, 'Pt2Line1c_MiddleName', get(data, 'beneficiary.middleName'), filled, missing);

    setTextField(form, 'Pt2Line2_AlienNumber', get(data, 'beneficiary.aNumber'), filled, missing);
    setTextField(form, 'Pt2Line3_SSN', get(data, 'beneficiary.ssn'), filled, missing);
    setTextField(form, 'Pt2Line4_DateOfBirth', mmddyyyy(get(data, 'beneficiary.dob')), filled, missing);

    setTextField(form, 'Pt2Line7_CityTownOfBirth', get(data, 'beneficiary.cityBirth'), filled, missing);
    setTextField(form, 'Pt2Line8_CountryOfBirth', get(data, 'beneficiary.countryBirth'), filled, missing);
    setTextField(form, 'Pt2Line9_CountryofCitzOrNationality', get(data, 'beneficiary.nationality'), filled, missing);

    // Beneficiary mailing/current address (Lines 11/14 blocks)
    const bMail = get(data, 'beneficiary.mailing') || {};
    setTextField(form, 'Pt2Line11_InCareOfName', bMail.inCareOf, filled, missing);
    setTextField(form, 'Pt2Line11_StreetNumberName', bMail.street, filled, missing);
    setTextField(form, 'Pt2Line11_AptSteFlrNumber', bMail.unitNum, filled, missing);
    setTextField(form, 'Pt2Line11_CityOrTown', bMail.city, filled, missing);
    setTextField(form, 'Pt2Line11_State', bMail.state, filled, missing);
    setTextField(form, 'Pt2Line11_ZipCode', bMail.zip, filled, missing);
    setTextField(form, 'Pt2Line11_Province', bMail.province, filled, missing);
    setTextField(form, 'Pt2Line11_PostalCode', bMail.postal, filled, missing);
    setTextField(form, 'Pt2Line11_Country', bMail.country, filled, missing);

    const bPhys = get(data, 'beneficiary.physicalAddress') || {};
    setTextField(form, 'Pt2Line14_StreetNumberName', bPhys.street, filled, missing);
    setTextField(form, 'Pt2Line14_AptSteFlrNumber', bPhys.unitNum, filled, missing);
    setTextField(form, 'Pt2Line14_CityOrTown', bPhys.city, filled, missing);
    setTextField(form, 'Pt2Line14_State', bPhys.state, filled, missing);
    setTextField(form, 'Pt2Line14_ZipCode', bPhys.zip, filled, missing);
    setTextField(form, 'Pt2Line14_Province', bPhys.province, filled, missing);
    setTextField(form, 'Pt2Line14_PostalCode', bPhys.postal, filled, missing);
    setTextField(form, 'Pt2Line14_Country', bPhys.country, filled, missing);

    // Beneficiary employment history (Line 15/16/18/19, then 20/21/22/23 set)
    const be0 = get(data, 'beneficiary.employment.0') || {};
    setTextField(form, 'Pt2Line16_NameofEmployer', be0.employer, filled, missing);
    setTextField(form, 'Pt2Line12_StreetNumberName', be0.street, filled, missing);
    setTextField(form, 'Pt2Line12_AptSteFlrNumber', be0.unitNum, filled, missing);
    setTextField(form, 'Pt2Line12_CityOrTown', be0.city, filled, missing);
    setTextField(form, 'Pt2Line12_State', be0.state, filled, missing);
    setTextField(form, 'Pt2Line12_ZipCode', be0.zip, filled, missing);
    setTextField(form, 'Pt2Line12_Province', be0.province, filled, missing);
    setTextField(form, 'Pt2Line12_PostalCode', be0.postal, filled, missing);
    setTextField(form, 'Pt2Line12_Country', be0.country, filled, missing);
    setTextField(form, 'Pt2Line18_Occupation', be0.occupation, filled, missing);
    setTextField(form, 'Pt2Line15a_DateFrom', mmddyyyy(be0.from), filled, missing);
    setTextField(form, 'Pt2Line15b_ToFrom', mmddyyyy(be0.to), filled, missing);

    const be1 = get(data, 'beneficiary.employment.1') || {};
    setTextField(form, 'Pt2Line20_NameofEmployer', be1.employer, filled, missing);
    setTextField(form, 'Pt2Line21_StreetNumberName', be1.street, filled, missing);
    setTextField(form, 'Pt2Line21_AptSteFlrNumber', be1.unitNum, filled, missing);
    setTextField(form, 'Pt2Line21_CityOrTown', be1.city, filled, missing);
    setTextField(form, 'Pt2Line21_State', be1.state, filled, missing);
    setTextField(form, 'Pt2Line21_ZipCode', be1.zip, filled, missing);
    setTextField(form, 'Pt2Line21_Province', be1.province, filled, missing);
    setTextField(form, 'Pt2Line21_PostalCode', be1.postal, filled, missing);
    setTextField(form, 'Pt2Line21_Country', be1.country, filled, missing);
    setTextField(form, 'Pt2Line22_Occupation', be1.occupation, filled, missing);
    setTextField(form, 'Pt2Line23a_DateFrom', mmddyyyy(be1.from), filled, missing);
    setTextField(form, 'Pt2Line23b_ToFrom', mmddyyyy(be1.to), filled, missing);

    // Parents of beneficiary (Pt2Line29–33 / 34 etc.)
    const bp0 = get(data, 'beneficiary.parents.0') || {};
    setTextField(form, 'Pt2Line29a_FamilyName', bp0.lastName, filled, missing);
    setTextField(form, 'Pt2Line29b_GivenName', bp0.firstName, filled, missing);
    setTextField(form, 'Pt2Line29c_MiddleName', bp0.middleName, filled, missing);
    setTextField(form, 'Pt2Line30_DateofBirth', mmddyyyy(bp0.dob), filled, missing);
    setTextField(form, 'Pt2Line32_CountryOfCitzOrNationality', bp0.nationality, filled, missing);
    setTextField(form, 'Pt2Line33a_CityTownOfBirth', bp0.cityBirth, filled, missing);
    setTextField(form, 'Pt2Line33b_CountryOfCitzOrNationality', bp0.countryBirth, filled, missing);

    const bp1 = get(data, 'beneficiary.parents.1') || {};
    // Depending on your PDF, the second parent may be elsewhere (49–51 etc.)
    setTextField(form, 'Pt2Line49a_FamilyName', bp1.lastName, filled, missing);
    setTextField(form, 'Pt2Line49b_GivenName', bp1.firstName, filled, missing);
    setTextField(form, 'Pt2Line49c_MiddleName', bp1.middleName, filled, missing);
    setTextField(form, 'Pt2Line41_CountryOfBirth', bp1.countryBirth, filled, missing);
    setTextField(form, 'Pt2Line42_DateofBirth', mmddyyyy(bp1.dob), filled, missing);

  } catch (e) {
    errors.push(String(e));
  }

  // ---------- PART 3, 4, 5, 6, 7, 8 ----------
  // We’ll map common & critical fields here; everything else can still be filled via data.other["PdfFieldName"]

  try {
    // Phones/Emails (Part 5 & 6 often)
    setTextField(form, 'Pt5Line1_DaytimePhoneNumber1', get(data, 'petitioner.phone'), filled, missing);
    setTextField(form, 'Pt5Line2_MobileNumber1', get(data, 'petitioner.mobile'), filled, missing);
    setTextField(form, 'Pt5Line3_Email', get(data, 'petitioner.email'), filled, missing);

    // Signatures dates (you won’t sign electronically here; still add date if you capture it)
    setTextField(form, 'Pt5Line4_DateOfSignature', mmddyyyy(get(data, 'petitioner.signDate')), filled, missing);

    // Interpreter / Preparer blocks
    setTextField(form, 'Pt6_NameOfLanguage', get(data, 'interpreter.language'), filled, missing);
    setTextField(form, 'Pt6Line5_Email', get(data, 'interpreter.email'), filled, missing);
    setTextField(form, 'Pt6Line6_DateofSignature', mmddyyyy(get(data, 'interpreter.signDate')), filled, missing);
    setTextField(form, 'Pt6Line1_InterpreterFamilyName', get(data, 'interpreter.lastName'), filled, missing);
    setTextField(form, 'Pt6Line1_InterpreterGivenName', get(data, 'interpreter.firstName'), filled, missing);
    setTextField(form, 'Pt6Line2_NameofBusinessorOrgName', get(data, 'interpreter.business'), filled, missing);
    setTextField(form, 'Pt6Line4_InterpreterDaytimeTelephone_p9_n1', get(data, 'interpreter.phone1'), filled, missing);
    setTextField(form, 'Pt6Line4_InterpreterDaytimeTelephone_p9_n2', get(data, 'interpreter.phone2'), filled, missing);

    setTextField(form, 'Pt7Line1_PreparerFamilyName', get(data, 'preparer.lastName'), filled, missing);
    setTextField(form, 'Pt7Line1b_PreparerGivenName', get(data, 'preparer.firstName'), filled, missing);
    setTextField(form, 'Pt7Line2_NameofBusinessorOrgName', get(data, 'preparer.business'), filled, missing);
    setTextField(form, 'Pt7Line3_DaytimePhoneNumber1', get(data, 'preparer.phone'), filled, missing);
    setTextField(form, 'Pt7Line4_PreparerMobileNumber', get(data, 'preparer.mobile'), filled, missing);
    setTextField(form, 'Pt7Line5_Email', get(data, 'preparer.email'), filled, missing);
    setTextField(form, 'Pt7Line6_DateofSignature', mmddyyyy(get(data, 'preparer.signDate')), filled, missing);

    // Part 8 Additional Information (free text blocks)
    // If you aggregate overflows into data.part8, map them to the Additional Info lines:
    setTextField(form, 'Line3d_AdditionalInfo', get(data, 'part8.line3d'), filled, missing);
    setTextField(form, 'Line4d_AdditionalInfo', get(data, 'part8.line4d'), filled, missing);
    setTextField(form, 'Line5d_AdditionalInfo', get(data, 'part8.line5d'), filled, missing);
    setTextField(form, 'Line6d_AdditionalInfo', get(data, 'part8.line6d'), filled, missing);
    setTextField(form, 'Line7d_AdditionalInfo', get(data, 'part8.line7d'), filled, missing);
  } catch (e) {
    errors.push(String(e));
  }

  // ---------- FALLBACK: raw PDF field passthrough ----------
  // Anything in data.other["PdfFieldName"] gets filled as text.
  try {
    const other = data?.other || {};
    Object.keys(other).forEach(pdfName => {
      // skip if we already filled this name successfully
      if (filled.includes(pdfName)) return;
      setFromOther(data, form, pdfName, filled, missing);
    });
  } catch (e) {
    errors.push(String(e));
  }

  return { filled, missing, errors };
}
