// lib/i129f-mapping.js

/** Small helpers */
function get(obj, path, dflt = '') {
  try {
    const parts = Array.isArray(path) ? path : String(path).split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur == null) return dflt;
      if (p.endsWith(']')) {
        // e.g. "physicalAddresses[0].city"
        const m = p.match(/^([^[\]]+)\[(\d+)\]$/);
        if (!m) return dflt;
        cur = cur[m[1]][Number(m[2])];
      } else {
        cur = cur[p];
      }
    }
    return cur ?? dflt;
  } catch {
    return dflt;
  }
}

function fmtDate(v) {
  if (!v) return '';
  try {
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
      const [y, m, d] = v.split('-');
      return `${m}/${d}/${y}`;
    }
    const d = new Date(v);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yy = d.getFullYear();
    return `${mm}/${dd}/${yy}`;
  } catch {
    return String(v);
  }
}

/** Robustly set a text field if it exists (ignore missing) */
function setText(form, pdfFieldName, value) {
  if (!pdfFieldName) return;
  try {
    const tf = form.getTextField(pdfFieldName);
    tf.setText(value ?? '');
  } catch {
    // field not present or not a text field — ignore
  }
}

/** Checkbox helper (safe no-op if absent) */
function checkBox(form, name, on = true) {
  try {
    const cb = form.getCheckBox(name);
    on ? cb.check() : cb.uncheck();
  } catch {}
}

/** Try many candidate text field names; returns true if any succeeded */
function setTextOneOf(form, names = [], value) {
  for (const n of names) {
    try {
      const tf = form.getTextField(n);
      tf.setText(value ?? '');
      return true;
    } catch {}
  }
  return false;
}

/** Try many candidate checkbox names; returns true if any succeeded */
function checkOneOf(form, names = [], on = true) {
  for (const n of names) {
    try {
      const cb = form.getCheckBox(n);
      on ? cb.check() : cb.uncheck();
      return true;
    } catch {}
  }
  return false;
}

/** Shallow copy selected address-like keys from src -> dst object */
function pickAddress(src = {}) {
  return {
    inCareOf: src.inCareOf ?? '',
    street: src.street ?? '',
    unitNum: src.unitNum ?? '',
    unitType: src.unitType ?? '', // "Apt", "Ste", "Flr" etc — UI can drive this
    city: src.city ?? '',
    state: src.state ?? '',
    zip: src.zip ?? '',
    province: src.province ?? '',
    postal: src.postal ?? '',
    country: src.country ?? '',
    from: src.from ?? '',
    to: src.to ?? '',
  };
}

/**
 * Main mapper: write from saved JSON -> PDF AcroForm
 */
export function applyI129fMapping(saved, form) {
  if (!saved) return;

  // Normalize data we will use
  const pet = saved.petitioner ?? {};
  const ben = saved.beneficiary ?? {};

  // Consolidation flags (use any that your UI might set)
  const petSameAsMailing =
    !!(pet.currentSameAsMailing || pet.physicalSameAsMailing || pet.sameAsMailing);

  const benSameAsMailing =
    !!(ben.currentSameAsMailing || ben.physicalSameAsMailing || ben.sameAsMailing);

  // -------- PART 1 — PETITIONER --------

  // === Lines 1–3 (you requested these explicitly)
  setTextOneOf(form, ['Pt1Line1_AlienNumber', 'Pt1_Line1_AlienNumber', 'Pt1_A_Number'], pet.aNumber);
  setTextOneOf(form, ['Pt1Line2_AcctIdentifier', 'Pt1_Line2_AcctIdentifier', 'Pt1_OnlineAcct'], pet.uscisOnlineAccount);
  setTextOneOf(form, ['Pt1Line3_SSN', 'Pt1_Line3_SSN', 'Pt1_SSN'], pet.ssn);

  // === Line 4 — Classification (K-1 / K-3)
  const cls = (saved.classification || '').toLowerCase();
  if (cls === 'k1') {
    checkOneOf(form,
      ['Pt1Line4a_K1', 'Pt1Line4a_Checkboxes_p0_ch1', 'Pt1_Line4a_K1', 'Pt1_Line4a_Fiance', 'Line4_K1'],
      true
    );
    checkOneOf(form,
      ['Pt1Line4a_K3', 'Pt1Line4a_Checkboxes_p0_ch2', 'Pt1_Line4a_K3', 'Pt1_Line4a_Spouse', 'Line4_K3'],
      false
    );
  } else if (cls === 'k3') {
    checkOneOf(form,
      ['Pt1Line4a_K3', 'Pt1Line4a_Checkboxes_p0_ch2', 'Pt1_Line4a_K3', 'Pt1_Line4a_Spouse', 'Line4_K3'],
      true
    );
    checkOneOf(form,
      ['Pt1Line4a_K1', 'Pt1Line4a_Checkboxes_p0_ch1', 'Pt1_Line4a_K1', 'Pt1_Line4a_Fiance', 'Line4_K1'],
      false
    );
  } else {
    // clear both if neither selected
    checkOneOf(form, ['Pt1Line4a_K1','Pt1Line4a_Checkboxes_p0_ch1','Pt1_Line4a_K1','Pt1_Line4a_Fiance','Line4_K1'], false);
    checkOneOf(form, ['Pt1Line4a_K3','Pt1Line4a_Checkboxes_p0_ch2','Pt1_Line4a_K3','Pt1_Line4a_Spouse','Line4_K3'], false);
  }

  // === Line 5 — If K-3: Filed I-130?
  if (cls === 'k3') {
    const filed = saved.k3FiledI130;
    if (filed === true) {
      checkOneOf(form, ['Pt1Line5_Yes','Pt1_Line5_Yes','Line5_I130_Yes','Line5_Checkboxes_p0_ch1'], true);
      checkOneOf(form, ['Pt1Line5_No', 'Pt1_Line5_No', 'Line5_I130_No', 'Line5_Checkboxes_p0_ch2'], false);
    } else if (filed === false) {
      checkOneOf(form, ['Pt1Line5_No', 'Pt1_Line5_No', 'Line5_I130_No', 'Line5_Checkboxes_p0_ch2'], true);
      checkOneOf(form, ['Pt1Line5_Yes','Pt1_Line5_Yes','Line5_I130_Yes','Line5_Checkboxes_p0_ch1'], false);
    }
  } else {
    // clear both if not K-3
    checkOneOf(form, ['Pt1Line5_Yes','Pt1_Line5_Yes','Line5_I130_Yes','Line5_Checkboxes_p0_ch1'], false);
    checkOneOf(form, ['Pt1Line5_No', 'Pt1_Line5_No', 'Line5_I130_No', 'Line5_Checkboxes_p0_ch2'], false);
  }

  // Legal name (Pt1 Line 6a–6c)
  setText(form, 'Pt1Line6a_FamilyName',  get(pet, 'lastName'));
  setText(form, 'Pt1Line6b_GivenName',   get(pet, 'firstName'));
  setText(form, 'Pt1Line6c_MiddleName',  get(pet, 'middleName'));

  // Other Names (first alias) (Pt1 Line 7a–7c)
  setText(form, 'Pt1Line7a_FamilyName',  get(pet, 'otherNames[0].lastName'));
  setText(form, 'Pt1Line7b_GivenName',   get(pet, 'otherNames[0].firstName'));
  setText(form, 'Pt1Line7c_MiddleName',  get(pet, 'otherNames[0].middleName'));

  // Mailing Address (Pt1 Line 8)
  const petMail = pickAddress(saved.mailing ?? pet.mailing);
  setText(form, 'Pt1Line8_InCareofName',      petMail.inCareOf);
  setText(form, 'Pt1Line8_StreetNumberName',  petMail.street);
  setText(form, 'Pt1Line8_AptSteFlrNumber',   petMail.unitNum);
  setText(form, 'Pt1Line8_CityOrTown',        petMail.city);
  setText(form, 'Pt1Line8_State',             petMail.state);
  setText(form, 'Pt1Line8_ZipCode',           petMail.zip);
  setText(form, 'Pt1Line8_Province',          petMail.province);
  setText(form, 'Pt1Line8_PostalCode',        petMail.postal);
  setText(form, 'Pt1Line8_Country',           petMail.country);
  setText(form, 'Pt1Line8_Unit_p0_ch3',       petMail.unitType);

  // Physical address history (Lines 9–12) – use "same as mailing" if flagged
  const petPhys0 = petSameAsMailing
    ? { ...petMail }
    : pickAddress(get(saved, 'physicalAddresses[0]'));

  setText(form, 'Pt1Line9_StreetNumberName',  petPhys0.street);
  setText(form, 'Pt1Line9_AptSteFlrNumber',   petPhys0.unitNum);
  setText(form, 'Pt1Line9_CityOrTown',        petPhys0.city);
  setText(form, 'Pt1Line9_State',             petPhys0.state);
  setText(form, 'Pt1Line9_ZipCode',           petPhys0.zip);
  setText(form, 'Pt1Line9_Province',          petPhys0.province);
  setText(form, 'Pt1Line9_PostalCode',        petPhys0.postal);
  setText(form, 'Pt1Line9_Country',           petPhys0.country);
  setText(form, 'Pt1Line10a_DateFrom',        fmtDate(petPhys0.from));
  setText(form, 'Pt1Line10b_DateFrom',        fmtDate(petPhys0.to)); // some PDFs label this oddly

  const petPhys1 = pickAddress(get(saved, 'physicalAddresses[1]'));
  setText(form, 'Pt1Line11_StreetNumberName', petPhys1.street);
  setText(form, 'Pt1Line11_AptSteFlrNumber',  petPhys1.unitNum);
  setText(form, 'Pt1Line11_CityOrTown',       petPhys1.city);
  setText(form, 'Pt1Line11_State',            petPhys1.state);
  setText(form, 'Pt1Line11_ZipCode',          petPhys1.zip);
  setText(form, 'Pt1Line11_Province',         petPhys1.province);
  setText(form, 'Pt1Line11_PostalCode',       petPhys1.postal);
  setText(form, 'Pt1Line11_Country',          petPhys1.country);
  setText(form, 'Pt1Line12a_DateFrom',        fmtDate(petPhys1.from));
  setText(form, 'Pt1Line12b_ToFrom',          fmtDate(petPhys1.to));

  // Employment #1 (Lines 13–16)
  setText(form, 'Pt1Line13_NameofEmployer',   get(saved, 'employment[0].employer'));
  setText(form, 'Pt1Line14_StreetNumberName', get(saved, 'employment[0].street'));
  setText(form, 'Pt1Line14_AptSteFlrNumber',  get(saved, 'employment[0].unitNum'));
  setText(form, 'Pt1Line14_CityOrTown',       get(saved, 'employment[0].city'));
  setText(form, 'Pt1Line14_State',            get(saved, 'employment[0].state'));
  setText(form, 'Pt1Line14_ZipCode',          get(saved, 'employment[0].zip'));
  setText(form, 'Pt1Line14_Province',         get(saved, 'employment[0].province'));
  setText(form, 'Pt1Line14_PostalCode',       get(saved, 'employment[0].postal'));
  setText(form, 'Pt1Line14_Country',          get(saved, 'employment[0].country'));
  setText(form, 'Pt1Line15_Occupation',       get(saved, 'employment[0].occupation'));
  setText(form, 'Pt1Line16a_DateFrom',        fmtDate(get(saved, 'employment[0].from')));
  setText(form, 'Pt1Line16b_ToFrom',          fmtDate(get(saved, 'employment[0].to')));

  // Employment #2 (Lines 17–20)
  setText(form, 'Pt1Line17_NameofEmployer',   get(saved, 'employment[1].employer'));
  setText(form, 'Pt1Line18_StreetNumberName', get(saved, 'employment[1].street'));
  setText(form, 'Pt1Line18_AptSteFlrNumber',  get(saved, 'employment[1].unitNum'));
  setText(form, 'Pt1Line18_CityOrTown',       get(saved, 'employment[1].city'));
  setText(form, 'Pt1Line18_State',            get(saved, 'employment[1].state'));
  setText(form, 'Pt1Line18_ZipCode',          get(saved, 'employment[1].zip'));
  setText(form, 'Pt1Line18_Province',         get(saved, 'employment[1].province'));
  setText(form, 'Pt1Line18_PostalCode',       get(saved, 'employment[1].postal'));
  setText(form, 'Pt1Line18_Country',          get(saved, 'employment[1].country'));
  setText(form, 'Pt1Line19_Occupation',       get(saved, 'employment[1].occupation'));
  setText(form, 'Pt1Line20a_DateFrom',        fmtDate(get(saved, 'employment[1].from')));
  setText(form, 'Pt1Line20b_ToFrom',          fmtDate(get(saved, 'employment[1].to')));

  // === Lines 21–26 — Petitioner Other Information
  // Sex (21)
  const sex = (pet.sex || '').toLowerCase();
  if (sex === 'male') {
    checkOneOf(form, ['Pt1Line21_Male','Pt1Line21_Checkboxes_p0_ch1','Pt1_Line21_Male','Line21_Male'], true);
    checkOneOf(form, ['Pt1Line21_Female','Pt1Line21_Checkboxes_p0_ch2','Pt1_Line21_Female','Line21_Female'], false);
  } else if (sex === 'female') {
    checkOneOf(form, ['Pt1Line21_Female','Pt1Line21_Checkboxes_p0_ch2','Pt1_Line21_Female','Line21_Female'], true);
    checkOneOf(form, ['Pt1Line21_Male','Pt1Line21_Checkboxes_p0_ch1','Pt1_Line21_Male','Line21_Male'], false);
  } else {
    checkOneOf(form, ['Pt1Line21_Male','Pt1Line21_Checkboxes_p0_ch1','Pt1_Line21_Male','Line21_Male'], false);
    checkOneOf(form, ['Pt1Line21_Female','Pt1Line21_Checkboxes_p0_ch2','Pt1_Line21_Female','Line21_Female'], false);
  }

  // DOB (22)
  setTextOneOf(form, ['Pt1Line22_DateOfBirth','Pt1Line22_Date of Birth','Line22_DOB'], fmtDate(pet.dob));

  // Marital Status (23)
  const ms = (pet.maritalStatus || '').toLowerCase();
  checkOneOf(form, ['Pt1Line23_Single','Pt1_Line23_Single','Line23_Single','Pt1Line23_Checkboxes_p0_ch1'], ms === 'single');
  checkOneOf(form, ['Pt1Line23_Married','Pt1_Line23_Married','Line23_Married','Pt1Line23_Checkboxes_p0_ch2'], ms === 'married');
  checkOneOf(form, ['Pt1Line23_Divorced','Pt1_Line23_Divorced','Line23_Divorced','Pt1Line23_Checkboxes_p0_ch3'], ms === 'divorced');
  checkOneOf(form, ['Pt1Line23_Widowed','Pt1_Line23_Widowed','Line23_Widowed','Pt1Line23_Checkboxes_p0_ch4'], ms === 'widowed');

  // Birth City/Province/State/Country (24–26)
  setTextOneOf(form, ['Pt1Line24_CityTownOfBirth','Line24_City'], pet.birthCity);
  setTextOneOf(form, ['Pt1Line25_ProvinceOrStateOfBirth','Line25_ProvinceState'], pet.birthProvinceState);
  setTextOneOf(form, ['Pt1Line26_CountryOfBirth','Line26_Country'], pet.birthCountry);

  // -------- PART 2 — BENEFICIARY --------

  // Legal name
  setText(form, 'Pt2Line1a_FamilyName',       get(ben, 'lastName'));
  setText(form, 'Pt2Line1b_GivenName',        get(ben, 'firstName'));
  setText(form, 'Pt2Line1c_MiddleName',       get(ben, 'middleName'));

  setText(form, 'Pt2Line2_AlienNumber',       get(ben, 'aNumber'));
  setText(form, 'Pt2Line3_SSN',               get(ben, 'ssn'));
  setText(form, 'Pt2Line4_DateOfBirth',       fmtDate(get(ben, 'dob')));

  setText(form, 'Pt2Line7_CityTownOfBirth',   get(ben, 'birthCity'));
  setText(form, 'Pt2Line8_CountryOfBirth',    get(ben, 'birthCountry'));
  setText(form, 'Pt2Line9_CountryofCitzOrNationality', get(ben, 'citizenship'));

  // Other names used (first alias)
  setText(form, 'Pt2Line10a_FamilyName',      get(ben, 'otherNames[0].lastName'));
  setText(form, 'Pt2Line10b_GivenName',       get(ben, 'otherNames[0].firstName'));
  setText(form, 'Pt2Line10c_MiddleName',      get(ben, 'otherNames[0].middleName'));

  // Beneficiary mailing address (Pt2 Line 11)
  const benMail = pickAddress(ben.mailing);
  // note: you asked NOT to set In Care Of for beneficiary
  setText(form, 'Pt2Line11_StreetNumberName', benMail.street);
  setText(form, 'Pt2Line11_AptSteFlrNumber',  benMail.unitNum);
  setText(form, 'Pt2Line11_CityOrTown',       benMail.city);
  setText(form, 'Pt2Line11_State',            benMail.state);
  setText(form, 'Pt2Line11_ZipCode',          benMail.zip);
  setText(form, 'Pt2Line11_Province',         benMail.province);
  setText(form, 'Pt2Line11_PostalCode',       benMail.postal);
  setText(form, 'Pt2Line11_Country',          benMail.country);

  // Beneficiary CURRENT/physical address (Pt2 Line 14 + dates 15)
  const benPhys0 = benSameAsMailing
    ? { ...benMail }
    : pickAddress(get(ben, 'physical[0]')) || pickAddress(get(ben, 'physicalAddress'));

  setText(form, 'Pt2Line14_StreetNumberName', benPhys0.street);
  setText(form, 'Pt2Line14_AptSteFlrNumber',  benPhys0.unitNum);
  setText(form, 'Pt2Line14_CityOrTown',       benPhys0.city);
  setText(form, 'Pt2Line14_State',            benPhys0.state);
  setText(form, 'Pt2Line14_ZipCode',          benPhys0.zip);
  setText(form, 'Pt2Line14_Province',         benPhys0.province);
  setText(form, 'Pt2Line14_PostalCode',       benPhys0.postal);
  setText(form, 'Pt2Line14_Country',          benPhys0.country);

  setText(form, 'Pt2Line15a_DateFrom',        fmtDate(benPhys0.from));
  setText(form, 'Pt2Line15b_ToFrom',          fmtDate(benPhys0.to));

  // Beneficiary employment #1
  setText(form, 'Pt2Line16_NameofEmployer',   get(ben, 'employment[0].employer'));
  setText(form, 'Pt2Line17_StreetNumberName', get(ben, 'employment[0].street'));
  setText(form, 'Pt2Line17_AptSteFlrNumber',  get(ben, 'employment[0].unitNum'));
  setText(form, 'Pt2Line17_CityOrTown',       get(ben, 'employment[0].city'));
  setText(form, 'Pt2Line17_State',            get(ben, 'employment[0].state'));
  setText(form, 'Pt2Line17_ZipCode',          get(ben, 'employment[0].zip'));
  setText(form, 'Pt2Line17_Province',         get(ben, 'employment[0].province'));
  setText(form, 'Pt2Line17_PostalCode',       get(ben, 'employment[0].postal'));
  setText(form, 'Pt2Line17_Country',          get(ben, 'employment[0].country'));
  setText(form, 'Pt2Line18_Occupation',       get(ben, 'employment[0].occupation'));
  setText(form, 'Pt2Line19a_DateFrom',        fmtDate(get(ben, 'employment[0].from')));
  setText(form, 'Pt2Line19b_ToFrom',          fmtDate(get(ben, 'employment[0].to')));

  // -------- PARENTS (best-effort names; add exact IDs if your overlay shows different) --------
  // Petitioner Parent #1
  const p1 = (pet.parents && pet.parents[0]) ? pet.parents[0] : {};
  const p2 = (pet.parents && pet.parents[1]) ? pet.parents[1] : {};

  // Names (if your PDF has them; many do under Part 1 parents)
  setTextOneOf(form, ['Pt1Parent1_Family','Pt1P1_Family','Parent1_Family'], p1.lastName);
  setTextOneOf(form, ['Pt1Parent1_Given','Pt1P1_Given','Parent1_Given'], p1.firstName);
  setTextOneOf(form, ['Pt1Parent1_Middle','Pt1P1_Middle','Parent1_Middle'], p1.middleName);
  setTextOneOf(form, ['Pt1Parent1_DOB','Pt1P1_DOB','Parent1_DOB'], fmtDate(p1.dob));

  // NEW: Parent #1 Sex
  const p1sex = (p1.sex || '').toLowerCase();
  if (p1sex === 'male') {
    checkOneOf(form, ['Pt1Parent1_Sex_Male','P1_Sex_Male','Parent1_Sex_Male'], true);
    checkOneOf(form, ['Pt1Parent1_Sex_Female','P1_Sex_Female','Parent1_Sex_Female'], false);
  } else if (p1sex === 'female') {
    checkOneOf(form, ['Pt1Parent1_Sex_Female','P1_Sex_Female','Parent1_Sex_Female'], true);
    checkOneOf(form, ['Pt1Parent1_Sex_Male','P1_Sex_Male','Parent1_Sex_Male'], false);
  }

  setTextOneOf(form, ['Pt1Parent1_CityOfBirth','P1_CityOfBirth','Parent1_City'], p1.cityBirth);
  setTextOneOf(form, ['Pt1Parent1_CountryOfBirth','P1_CountryOfBirth','Parent1_Country'], p1.countryBirth);

  setTextOneOf(form, ['Pt1Parent1_Nationality','P1_Nationality','Parent1_Nationality'], p1.nationality);

  // Petitioner Parent #2
  setTextOneOf(form, ['Pt1Parent2_Family','Pt1P2_Family','Parent2_Family'], p2.lastName);
  setTextOneOf(form, ['Pt1Parent2_Given','Pt1P2_Given','Parent2_Given'], p2.firstName);
  setTextOneOf(form, ['Pt1Parent2_Middle','Pt1P2_Middle','Parent2_Middle'], p2.middleName);
  setTextOneOf(form, ['Pt1Parent2_DOB','Pt1P2_DOB','Parent2_DOB'], fmtDate(p2.dob));

  const p2sex = (p2.sex || '').toLowerCase();
  if (p2sex === 'male') {
    checkOneOf(form, ['Pt1Parent2_Sex_Male','P2_Sex_Male','Parent2_Sex_Male'], true);
    checkOneOf(form, ['Pt1Parent2_Sex_Female','P2_Sex_Female','Parent2_Sex_Female'], false);
  } else if (p2sex === 'female') {
    checkOneOf(form, ['Pt1Parent2_Sex_Female','P2_Sex_Female','Parent2_Sex_Female'], true);
    checkOneOf(form, ['Pt1Parent2_Sex_Male','P2_Sex_Male','Parent2_Sex_Male'], false);
  }

  setTextOneOf(form, ['Pt1Parent2_CityOfBirth','P2_CityOfBirth','Parent2_City'], p2.cityBirth);
  setTextOneOf(form, ['Pt1Parent2_CountryOfBirth','P2_CountryOfBirth','Parent2_Country'], p2.countryBirth);

  setTextOneOf(form, ['Pt1Parent2_Nationality','P2_Nationality','Parent2_Nationality'], p2.nationality);

  // -------- DEBUG LIST (unchanged) --------
  // (keep your existing debug export at bottom)
}

/** Optional list the /all-fields page can display */
export const I129F_DEBUG_FIELD_LIST = [
  // A light predictable subset to confirm wiring
  'Pt1Line6a_FamilyName','Pt1Line6b_GivenName','Pt1Line6c_MiddleName',
  'Pt1Line7a_FamilyName','Pt1Line7b_GivenName','Pt1Line7c_MiddleName',
  'Pt1Line8_StreetNumberName','Pt1Line8_AptSteFlrNumber','Pt1Line8_CityOrTown',
  'Pt1Line8_State','Pt1Line8_ZipCode',

  'Pt1Line9_StreetNumberName','Pt1Line10a_DateFrom','Pt1Line10b_DateFrom',

  'Pt1Line13_NameofEmployer','Pt1Line14_StreetNumberName','Pt1Line15_Occupation',
  'Pt1Line16a_DateFrom','Pt1Line16b_ToFrom',

  // Added quick checks for your new fields
  'Pt1Line1_AlienNumber','Pt1Line2_AcctIdentifier','Pt1Line3_SSN',
  'Pt1Line22_DateOfBirth','Pt1Line24_CityTownOfBirth','Pt1Line26_CountryOfBirth',

  'Pt2Line1a_FamilyName','Pt2Line1b_GivenName','Pt2Line1c_MiddleName',
  'Pt2Line2_AlienNumber','Pt2Line3_SSN','Pt2Line4_DateOfBirth',
  'Pt2Line7_CityTownOfBirth','Pt2Line8_CountryOfBirth','Pt2Line9_CountryofCitzOrNationality',
  'Pt2Line10a_FamilyName','Pt2Line10b_GivenName','Pt2Line10c_MiddleName',
  'Pt2Line11_StreetNumberName',
  'Pt2Line14_StreetNumberName','Pt2Line15a_DateFrom','Pt2Line15b_ToFrom',
  'Pt2Line16_NameofEmployer','Pt2Line17_StreetNumberName','Pt2Line18_Occupation',
  'Pt2Line19a_DateFrom','Pt2Line19b_ToFrom',
];
