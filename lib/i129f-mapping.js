// lib/i129f-mapping.js

/** ------------------------------
 * Small helpers (safe getters, dates)
 * ------------------------------ */
function get(obj, path, dflt = '') {
  try {
    const parts = Array.isArray(path) ? path : String(path).split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur == null) return dflt;
      if (p.endsWith(']')) {
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

/** ------------------------------
 * PDF field helpers (with fuzzy fallback)
 * ------------------------------ */
function _allFieldNames(form) {
  try {
    return form.getFields().map(f => f.getName());
  } catch {
    return [];
  }
}

function _firstExistingName(form, names = []) {
  for (const n of names) {
    try {
      // try as text then checkbox; if either exists, return it
      form.getTextField(n); return n;
    } catch {}
    try {
      form.getCheckBox(n); return n;
    } catch {}
  }
  return null;
}

function _firstNameByRegex(form, regexes = []) {
  const all = _allFieldNames(form);
  for (const rx of regexes) {
    const found = all.find(n => rx.test(n));
    if (found) return found;
  }
  return null;
}

function setText(form, pdfFieldName, value) {
  if (!pdfFieldName) return false;
  try {
    const tf = form.getTextField(pdfFieldName);
    tf.setText(value ?? '');
    return true;
  } catch { return false; }
}

function checkBox(form, name, on = true) {
  if (!name) return false;
  try {
    const cb = form.getCheckBox(name);
    on ? cb.check() : cb.uncheck();
    return true;
  } catch { return false; }
}

/** Try explicit names first; if none exist, fuzzy-match by regex patterns */
function setTextSmart(form, explicitNames, regexes, value) {
  const name = _firstExistingName(form, explicitNames) || _firstNameByRegex(form, regexes);
  if (!name) return false;
  return setText(form, name, value);
}
function checkSmart(form, explicitNames, regexes, on) {
  const name = _firstExistingName(form, explicitNames) || _firstNameByRegex(form, regexes);
  if (!name) return false;
  return checkBox(form, name, on);
}

/** Shallow copy address-like keys */
function pickAddress(src = {}) {
  return {
    inCareOf: src.inCareOf ?? '',
    street: src.street ?? '',
    unitNum: src.unitNum ?? '',
    unitType: src.unitType ?? '',
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

/** ------------------------------
 * Main mapper
 * ------------------------------ */
export function applyI129fMapping(saved, form) {
  if (!saved) return;

  const pet = saved.petitioner ?? {};
  const ben = saved.beneficiary ?? {};

  const petSameAsMailing =
    !!(pet.currentSameAsMailing || pet.physicalSameAsMailing || pet.sameAsMailing);
  const benSameAsMailing =
    !!(ben.currentSameAsMailing || ben.physicalSameAsMailing || ben.sameAsMailing);

  /* ===== PART 1 — TOP IDENTIFIERS (Lines 1–3) ===== */
  setTextSmart(
    form,
    ['Pt1Line1_AlienNumber','Pt1_Line1_AlienNumber','Pt1_A_Number','A_Number'],
    [/^pt1.*line.?1.*alien.*number/i, /alien.*number/i],
    pet.aNumber
  );
  setTextSmart(
    form,
    ['Pt1Line2_AcctIdentifier','Pt1_Line2_AcctIdentifier','Pt1_OnlineAcct','Online_Account'],
    [/^pt1.*line.?2.*(acct|account|uscis).*id/i, /(uscis).*account/i],
    pet.uscisOnlineAccount
  );
  setTextSmart(
    form,
    ['Pt1Line3_SSN','Pt1_Line3_SSN','Pt1_SSN','SSN'],
    [/^pt1.*line.?3.*ssn/i, /(^|_)ssn(_|$)/i],
    pet.ssn
  );

  /* ===== PART 1 — CLASSIFICATION (Line 4) and I-130 (Line 5) ===== */
  const cls = (saved.classification || '').toLowerCase(); // "k1" or "k3"

  // K-1 checkbox
  checkSmart(
    form,
    ['Pt1Line4a_K1','Pt1Line4a_Checkboxes_p0_ch1','Pt1_Line4a_K1','Pt1_Line4a_Fiance','Line4_K1'],
    [/line.?4.*(k.?1|fianc[eé])/i],
    cls === 'k1'
  );
  // K-3 checkbox
  checkSmart(
    form,
    ['Pt1Line4a_K3','Pt1Line4a_Checkboxes_p0_ch2','Pt1_Line4a_K3','Pt1_Line4a_Spouse','Line4_K3'],
    [/line.?4.*k.?3/i],
    cls === 'k3'
  );

  // Line 5: Filed I-130? (only relevant for K-3)
  if (cls === 'k3') {
    const filed = saved.k3FiledI130;
    checkSmart(
      form,
      ['Pt1Line5_Yes','Pt1_Line5_Yes','Line5_I130_Yes','Line5_Checkboxes_p0_ch1'],
      [/line.?5.*(i-?130).*(yes|y)/i],
      filed === true
    );
    checkSmart(
      form,
      ['Pt1Line5_No','Pt1_Line5_No','Line5_I130_No','Line5_Checkboxes_p0_ch2'],
      [/line.?5.*(i-?130).*(no|n)/i],
      filed === false
    );
  } else {
    // clear both if not K-3
    checkSmart(form, ['Pt1Line5_Yes','Pt1_Line5_Yes','Line5_I130_Yes','Line5_Checkboxes_p0_ch1'], [/line.?5.*i-?130.*yes/i], false);
    checkSmart(form, ['Pt1Line5_No','Pt1_Line5_No','Line5_I130_No','Line5_Checkboxes_p0_ch2'], [/line.?5.*i-?130.*no/i], false);
  }

  /* ===== PART 1 — NAMES (Line 6–7) ===== */
  setText(form, 'Pt1Line6a_FamilyName',  get(pet,'lastName'));
  setText(form, 'Pt1Line6b_GivenName',   get(pet,'firstName'));
  setText(form, 'Pt1Line6c_MiddleName',  get(pet,'middleName'));
  setText(form, 'Pt1Line7a_FamilyName',  get(pet,'otherNames[0].lastName'));
  setText(form, 'Pt1Line7b_GivenName',   get(pet,'otherNames[0].firstName'));
  setText(form, 'Pt1Line7c_MiddleName',  get(pet,'otherNames[0].middleName'));

  /* ===== PART 1 — MAILING ADDRESS (Line 8) ===== */
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

  /* ===== PART 1 — PHYSICAL ADDRESS HISTORY (Lines 9–12) ===== */
  const petPhys0 = petSameAsMailing ? { ...petMail } : pickAddress(get(saved, 'physicalAddresses[0]'));
  setText(form, 'Pt1Line9_StreetNumberName',  petPhys0.street);
  setText(form, 'Pt1Line9_AptSteFlrNumber',   petPhys0.unitNum);
  setText(form, 'Pt1Line9_CityOrTown',        petPhys0.city);
  setText(form, 'Pt1Line9_State',             petPhys0.state);
  setText(form, 'Pt1Line9_ZipCode',           petPhys0.zip);
  setText(form, 'Pt1Line9_Province',          petPhys0.province);
  setText(form, 'Pt1Line9_PostalCode',        petPhys0.postal);
  setText(form, 'Pt1Line9_Country',           petPhys0.country);
  setText(form, 'Pt1Line10a_DateFrom',        fmtDate(petPhys0.from));
  setText(form, 'Pt1Line10b_DateFrom',        fmtDate(petPhys0.to));

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

  /* ===== PART 1 — EMPLOYMENT (13–20) ===== */
  setText(form, 'Pt1Line13_NameofEmployer',   get(saved,'employment[0].employer'));
  setText(form, 'Pt1Line14_StreetNumberName', get(saved,'employment[0].street'));
  setText(form, 'Pt1Line14_AptSteFlrNumber',  get(saved,'employment[0].unitNum'));
  setText(form, 'Pt1Line14_CityOrTown',       get(saved,'employment[0].city'));
  setText(form, 'Pt1Line14_State',            get(saved,'employment[0].state'));
  setText(form, 'Pt1Line14_ZipCode',          get(saved,'employment[0].zip'));
  setText(form, 'Pt1Line14_Province',         get(saved,'employment[0].province'));
  setText(form, 'Pt1Line14_PostalCode',       get(saved,'employment[0].postal'));
  setText(form, 'Pt1Line14_Country',          get(saved,'employment[0].country'));
  setText(form, 'Pt1Line15_Occupation',       get(saved,'employment[0].occupation'));
  setText(form, 'Pt1Line16a_DateFrom',        fmtDate(get(saved,'employment[0].from')));
  setText(form, 'Pt1Line16b_ToFrom',          fmtDate(get(saved,'employment[0].to')));

  setText(form, 'Pt1Line17_NameofEmployer',   get(saved,'employment[1].employer'));
  setText(form, 'Pt1Line18_StreetNumberName', get(saved,'employment[1].street'));
  setText(form, 'Pt1Line18_AptSteFlrNumber',  get(saved,'employment[1].unitNum'));
  setText(form, 'Pt1Line18_CityOrTown',       get(saved,'employment[1].city'));
  setText(form, 'Pt1Line18_State',            get(saved,'employment[1].state'));
  setText(form, 'Pt1Line18_ZipCode',          get(saved,'employment[1].zip'));
  setText(form, 'Pt1Line18_Province',         get(saved,'employment[1].province'));
  setText(form, 'Pt1Line18_PostalCode',       get(saved,'employment[1].postal'));
  setText(form, 'Pt1Line18_Country',          get(saved,'employment[1].country'));
  setText(form, 'Pt1Line19_Occupation',       get(saved,'employment[1].occupation'));
  setText(form, 'Pt1Line20a_DateFrom',        fmtDate(get(saved,'employment[1].from')));
  setText(form, 'Pt1Line20b_ToFrom',          fmtDate(get(saved,'employment[1].to')));

  /* ===== PART 1 — OTHER INFORMATION (21–26) ===== */
  // 21 Sex
  const sex = (pet.sex || '').toLowerCase();
  checkSmart(
    form,
    ['Pt1Line21_Male','Pt1Line21_Checkboxes_p0_ch1','Pt1_Line21_Male','Line21_Male'],
    [/line.?21.*male/i],
    sex === 'male'
  );
  checkSmart(
    form,
    ['Pt1Line21_Female','Pt1Line21_Checkboxes_p0_ch2','Pt1_Line21_Female','Line21_Female'],
    [/line.?21.*female/i],
    sex === 'female'
  );

  // 22 DOB
  setTextSmart(
    form,
    ['Pt1Line22_DateOfBirth','Pt1Line22_Date of Birth','Line22_DOB'],
    [/line.?22.*(date.*birth|dob)/i],
    fmtDate(pet.dob)
  );

  // 23 Marital Status
  const ms = (pet.maritalStatus || '').toLowerCase();
  checkSmart(form,
    ['Pt1Line23_Single','Pt1_Line23_Single','Line23_Single','Pt1Line23_Checkboxes_p0_ch1'],
    [/line.?23.*single/i], ms === 'single');
  checkSmart(form,
    ['Pt1Line23_Married','Pt1_Line23_Married','Line23_Married','Pt1Line23_Checkboxes_p0_ch2'],
    [/line.?23.*married/i], ms === 'married');
  checkSmart(form,
    ['Pt1Line23_Divorced','Pt1_Line23_Divorced','Line23_Divorced','Pt1Line23_Checkboxes_p0_ch3'],
    [/line.?23.*divorc/i], ms === 'divorced');
  checkSmart(form,
    ['Pt1Line23_Widowed','Pt1_Line23_Widowed','Line23_Widowed','Pt1Line23_Checkboxes_p0_ch4'],
    [/line.?23.*widow/i], ms === 'widowed');

  // 24–26 Birth City / Province/State / Country
  setTextSmart(form,
    ['Pt1Line24_CityTownOfBirth','Line24_City'],
    [/line.?24.*(city|town|village).*birth/i],
    pet.birthCity
  );
  setTextSmart(form,
    ['Pt1Line25_ProvinceOrStateOfBirth','Line25_ProvinceState'],
    [/line.?25.*(province|state).*birth/i],
    pet.birthProvinceState
  );
  setTextSmart(form,
    ['Pt1Line26_CountryOfBirth','Line26_Country'],
    [/line.?26.*country.*birth/i],
    pet.birthCountry
  );

  /* ===== PART 2 — BENEFICIARY ===== */
  setText(form, 'Pt2Line1a_FamilyName',       get(ben,'lastName'));
  setText(form, 'Pt2Line1b_GivenName',        get(ben,'firstName'));
  setText(form, 'Pt2Line1c_MiddleName',       get(ben,'middleName'));

  setText(form, 'Pt2Line2_AlienNumber',       get(ben,'aNumber'));
  setText(form, 'Pt2Line3_SSN',               get(ben,'ssn'));
  setText(form, 'Pt2Line4_DateOfBirth',       fmtDate(get(ben,'dob')));

  setText(form, 'Pt2Line7_CityTownOfBirth',   get(ben,'birthCity'));
  setText(form, 'Pt2Line8_CountryOfBirth',    get(ben,'birthCountry'));
  setText(form, 'Pt2Line9_CountryofCitzOrNationality', get(ben,'citizenship'));

  setText(form, 'Pt2Line10a_FamilyName',      get(ben,'otherNames[0].lastName'));
  setText(form, 'Pt2Line10b_GivenName',       get(ben,'otherNames[0].firstName'));
  setText(form, 'Pt2Line10c_MiddleName',      get(ben,'otherNames[0].middleName'));

  // Beneficiary mailing
  const benMail = pickAddress(ben.mailing);
  setText(form, 'Pt2Line11_StreetNumberName', benMail.street);
  setText(form, 'Pt2Line11_AptSteFlrNumber',  benMail.unitNum);
  setText(form, 'Pt2Line11_CityOrTown',       benMail.city);
  setText(form, 'Pt2Line11_State',            benMail.state);
  setText(form, 'Pt2Line11_ZipCode',          benMail.zip);
  setText(form, 'Pt2Line11_Province',         benMail.province);
  setText(form, 'Pt2Line11_PostalCode',       benMail.postal);
  setText(form, 'Pt2Line11_Country',          benMail.country);

  // Beneficiary current/physical
  const benPhys0 = benSameAsMailing
    ? { ...benMail }
    : (pickAddress(get(ben, 'physical[0]')) || pickAddress(get(ben, 'physicalAddress')));
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
  setText(form, 'Pt2Line16_NameofEmployer',   get(ben,'employment[0].employer'));
  setText(form, 'Pt2Line17_StreetNumberName', get(ben,'employment[0].street'));
  setText(form, 'Pt2Line17_AptSteFlrNumber',  get(ben,'employment[0].unitNum'));
  setText(form, 'Pt2Line17_CityOrTown',       get(ben,'employment[0].city'));
  setText(form, 'Pt2Line17_State',            get(ben,'employment[0].state'));
  setText(form, 'Pt2Line17_ZipCode',          get(ben,'employment[0].zip'));
  setText(form, 'Pt2Line17_Province',         get(ben,'employment[0].province'));
  setText(form, 'Pt2Line17_PostalCode',       get(ben,'employment[0].postal'));
  setText(form, 'Pt2Line17_Country',          get(ben,'employment[0].country'));
  setText(form, 'Pt2Line18_Occupation',       get(ben,'employment[0].occupation'));
  setText(form, 'Pt2Line19a_DateFrom',        fmtDate(get(ben,'employment[0].from')));
  setText(form, 'Pt2Line19b_ToFrom',          fmtDate(get(ben,'employment[0].to')));

  /* ===== PARENTS (Petitioner) — add Sex/City/Country with fuzzy IDs ===== */
  const p1 = (pet.parents && pet.parents[0]) ? pet.parents[0] : {};
  const p2 = (pet.parents && pet.parents[1]) ? pet.parents[1] : {};

  // Names & DOB (if your PDF exposes them with these IDs; otherwise fuzzy will skip)
  setTextSmart(form, ['Pt1Parent1_Family','Pt1P1_Family','Parent1_Family'], [/parent.?1.*(family|last)/i], p1.lastName);
  setTextSmart(form, ['Pt1Parent1_Given','Pt1P1_Given','Parent1_Given'],   [/parent.?1.*(given|first)/i], p1.firstName);
  setTextSmart(form, ['Pt1Parent1_Middle','Pt1P1_Middle','Parent1_Middle'],[/parent.?1.*middle/i],        p1.middleName);
  setTextSmart(form, ['Pt1Parent1_DOB','Pt1P1_DOB','Parent1_DOB'],         [/parent.?1.*(date.*birth|dob)/i], fmtDate(p1.dob));

  const p1sex = (p1.sex || '').toLowerCase();
  checkSmart(form,
    ['Pt1Parent1_Sex_Male','P1_Sex_Male','Parent1_Sex_Male'],
    [/parent.?1.*sex.*male/i],
    p1sex === 'male'
  );
  checkSmart(form,
    ['Pt1Parent1_Sex_Female','P1_Sex_Female','Parent1_Sex_Female'],
    [/parent.?1.*sex.*female/i],
    p1sex === 'female'
  );
  setTextSmart(form, ['Pt1Parent1_CityOfBirth','P1_CityOfBirth','Parent1_City'], [/parent.?1.*city.*birth/i], p1.cityBirth);
  setTextSmart(form, ['Pt1Parent1_CountryOfBirth','P1_CountryOfBirth','Parent1_Country'], [/parent.?1.*country.*birth/i], p1.countryBirth);

  setTextSmart(form, ['Pt1Parent1_Nationality','P1_Nationality','Parent1_Nationality'], [/parent.?1.*nation/i], p1.nationality);

  setTextSmart(form, ['Pt1Parent2_Family','Pt1P2_Family','Parent2_Family'], [/parent.?2.*(family|last)/i], p2.lastName);
  setTextSmart(form, ['Pt1Parent2_Given','Pt1P2_Given','Parent2_Given'],   [/parent.?2.*(given|first)/i], p2.firstName);
  setTextSmart(form, ['Pt1Parent2_Middle','Pt1P2_Middle','Parent2_Middle'],[/parent.?2.*middle/i],        p2.middleName);
  setTextSmart(form, ['Pt1Parent2_DOB','Pt1P2_DOB','Parent2_DOB'],         [/parent.?2.*(date.*birth|dob)/i], fmtDate(p2.dob));

  const p2sex = (p2.sex || '').toLowerCase();
  checkSmart(form,
    ['Pt1Parent2_Sex_Male','P2_Sex_Male','Parent2_Sex_Male'],
    [/parent.?2.*sex.*male/i],
    p2sex === 'male'
  );
  checkSmart(form,
    ['Pt1Parent2_Sex_Female','P2_Sex_Female','Parent2_Sex_Female'],
    [/parent.?2.*sex.*female/i],
    p2sex === 'female'
  );
  setTextSmart(form, ['Pt1Parent2_CityOfBirth','P2_CityOfBirth','Parent2_City'], [/parent.?2.*city.*birth/i], p2.cityBirth);
  setTextSmart(form, ['Pt1Parent2_CountryOfBirth','P2_CountryOfBirth','Parent2_Country'], [/parent.?2.*country.*birth/i], p2.countryBirth);

  setTextSmart(form, ['Pt1Parent2_Nationality','P2_Nationality','Parent2_Nationality'], [/parent.?2.*nation/i], p2.nationality);
}

/** Optional: keep your debug subset */
export const I129F_DEBUG_FIELD_LIST = [
  'Pt1Line6a_FamilyName','Pt1Line6b_GivenName','Pt1Line6c_MiddleName',
  'Pt1Line7a_FamilyName','Pt1Line7b_GivenName','Pt1Line7c_MiddleName',
  'Pt1Line8_StreetNumberName','Pt1Line8_AptSteFlrNumber','Pt1Line8_CityOrTown',
  'Pt1Line8_State','Pt1Line8_ZipCode',
  'Pt1Line9_StreetNumberName','Pt1Line10a_DateFrom','Pt1Line10b_DateFrom',
  'Pt1Line13_NameofEmployer','Pt1Line14_StreetNumberName','Pt1Line15_Occupation',
  'Pt1Line16a_DateFrom','Pt1Line16b_ToFrom',

  // quick checks for the tricky ones
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
