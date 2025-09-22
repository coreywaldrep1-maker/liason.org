// lib/i129f-mapping.js
//
// Explicit-only mapping (no regex guessing).
// For each field we try a short list of likely PDF IDs—writing to all that exist.
// This prevents regressions if a PDF uses alternative IDs.
//
// If a field still won’t populate, open your PDF-field overlay and
// add the exact ID to the array for that field below.

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
    const dd = String(d.getDate() + 0).padStart(2, '0');
    const yy = d.getFullYear();
    return `${mm}/${dd}/${yy}`;
  } catch {
    return String(v);
  }
}

/* ========== low-level PDF helpers ========== */
function setText1(form, name, value) {
  try {
    const tf = form.getTextField(name);
    tf.setText(value ?? '');
    return true;
  } catch { return false; }
}
function check1(form, name, on = true) {
  try {
    const cb = form.getCheckBox(name);
    on ? cb.check() : cb.uncheck();
    return true;
  } catch { return false; }
}
function setManyText(form, names, value) {
  let ok = false;
  for (const n of names) ok = setText1(form, n, value) || ok;
  return ok;
}
function setManyChecks(form, names, on) {
  let ok = false;
  for (const n of names) ok = check1(form, n, on) || ok;
  return ok;
}

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

/* ========== MAIN ========== */
export function applyI129fMapping(saved, form) {
  if (!saved) return;

  const pet = saved.petitioner ?? {};
  const ben = saved.beneficiary ?? {};

  const petSameAsMailing =
    !!(pet.currentSameAsMailing || pet.physicalSameAsMailing || pet.sameAsMailing);
  const benSameAsMailing =
    !!(ben.currentSameAsMailing || ben.physicalSameAsMailing || ben.sameAsMailing);

  /* ===== Part 1 — Lines 1–3 (A#, Online Acct, SSN) ===== */
  setManyText(form, [
    'Pt1Line1_AlienNumber', 'Pt1_Line1_AlienNumber', 'Pt1_A_Number', 'A_Number'
  ], pet.aNumber);

  setManyText(form, [
    'Pt1Line2_AcctIdentifier', 'Pt1_Line2_AcctIdentifier', 'Pt1_OnlineAcct', 'Online_Account'
  ], pet.uscisOnlineAccount);

  setManyText(form, [
    'Pt1Line3_SSN', 'Pt1_Line3_SSN', 'Pt1_SSN', 'SSN'
  ], pet.ssn);

  /* ===== Part 1 — Line 4 (K-1 / K-3) and Line 5 (I-130 filed?) ===== */
  const cls = (saved.classification || '').toLowerCase(); // "k1" or "k3"

  // K-1
  setManyChecks(form, [
    'Pt1Line4a_K1', 'Pt1Line4a_Checkboxes_p0_ch1', 'Pt1_Line4a_K1', 'Pt1_Line4a_Fiance', 'Line4_K1'
  ], cls === 'k1');

  // K-3
  setManyChecks(form, [
    'Pt1Line4a_K3', 'Pt1Line4a_Checkboxes_p0_ch2', 'Pt1_Line4a_K3', 'Pt1_Line4a_Spouse', 'Line4_K3'
  ], cls === 'k3');

  // Line 5 (only relevant if K-3)
  const filed = saved.k3FiledI130;
  setManyChecks(form, [
    'Pt1Line5_Yes','Pt1_Line5_Yes','Line5_I130_Yes','Line5_Checkboxes_p0_ch1'
  ], cls === 'k3' && filed === true);
  setManyChecks(form, [
    'Pt1Line5_No','Pt1_Line5_No','Line5_I130_No','Line5_Checkboxes_p0_ch2'
  ], cls === 'k3' && filed === false);

  /* ===== Part 1 — Names (6–7) ===== */
  setText1(form, 'Pt1Line6a_FamilyName',  get(pet,'lastName'));
  setText1(form, 'Pt1Line6b_GivenName',   get(pet,'firstName'));
  setText1(form, 'Pt1Line6c_MiddleName',  get(pet,'middleName'));
  setText1(form, 'Pt1Line7a_FamilyName',  get(pet,'otherNames[0].lastName'));
  setText1(form, 'Pt1Line7b_GivenName',   get(pet,'otherNames[0].firstName'));
  setText1(form, 'Pt1Line7c_MiddleName',  get(pet,'otherNames[0].middleName'));

  /* ===== Part 1 — Mailing (8) ===== */
  const petMail = pickAddress(saved.mailing ?? pet.mailing);
  setManyText(form, ['Pt1Line8_InCareofName'],      petMail.inCareOf);
  setManyText(form, ['Pt1Line8_StreetNumberName'],  petMail.street);
  setManyText(form, ['Pt1Line8_AptSteFlrNumber'],   petMail.unitNum);
  setManyText(form, ['Pt1Line8_CityOrTown'],        petMail.city);
  setManyText(form, ['Pt1Line8_State'],             petMail.state);
  setManyText(form, ['Pt1Line8_ZipCode'],           petMail.zip);
  setManyText(form, ['Pt1Line8_Province'],          petMail.province);
  setManyText(form, ['Pt1Line8_PostalCode'],        petMail.postal);
  setManyText(form, ['Pt1Line8_Country'],           petMail.country);
  setManyText(form, ['Pt1Line8_Unit_p0_ch3'],       petMail.unitType);

  /* ===== Part 1 — Physical addresses (9–12) ===== */
  const petPhys0 = petSameAsMailing ? { ...petMail } : pickAddress(get(saved, 'physicalAddresses[0]'));
  setManyText(form, ['Pt1Line9_StreetNumberName'],  petPhys0.street);
  setManyText(form, ['Pt1Line9_AptSteFlrNumber'],   petPhys0.unitNum);
  setManyText(form, ['Pt1Line9_CityOrTown'],        petPhys0.city);
  setManyText(form, ['Pt1Line9_State'],             petPhys0.state);
  setManyText(form, ['Pt1Line9_ZipCode'],           petPhys0.zip);
  setManyText(form, ['Pt1Line9_Province'],          petPhys0.province);
  setManyText(form, ['Pt1Line9_PostalCode'],        petPhys0.postal);
  setManyText(form, ['Pt1Line9_Country'],           petPhys0.country);
  setManyText(form, ['Pt1Line10a_DateFrom'],        fmtDate(petPhys0.from));
  setManyText(form, ['Pt1Line10b_DateFrom'],        fmtDate(petPhys0.to));

  const petPhys1 = pickAddress(get(saved, 'physicalAddresses[1]'));
  setManyText(form, ['Pt1Line11_StreetNumberName'], petPhys1.street);
  setManyText(form, ['Pt1Line11_AptSteFlrNumber'],  petPhys1.unitNum);
  setManyText(form, ['Pt1Line11_CityOrTown'],       petPhys1.city);
  setManyText(form, ['Pt1Line11_State'],            petPhys1.state);
  setManyText(form, ['Pt1Line11_ZipCode'],          petPhys1.zip);
  setManyText(form, ['Pt1Line11_Province'],         petPhys1.province);
  setManyText(form, ['Pt1Line11_PostalCode'],       petPhys1.postal);
  setManyText(form, ['Pt1Line11_Country'],          petPhys1.country);
  setManyText(form, ['Pt1Line12a_DateFrom'],        fmtDate(petPhys1.from));
  setManyText(form, ['Pt1Line12b_ToFrom'],          fmtDate(petPhys1.to));

  /* ===== Part 1 — Employment (13–20) ===== */
  setManyText(form, ['Pt1Line13_NameofEmployer'],   get(saved,'employment[0].employer'));
  setManyText(form, ['Pt1Line14_StreetNumberName'], get(saved,'employment[0].street'));
  setManyText(form, ['Pt1Line14_AptSteFlrNumber'],  get(saved,'employment[0].unitNum'));
  setManyText(form, ['Pt1Line14_CityOrTown'],       get(saved,'employment[0].city'));
  setManyText(form, ['Pt1Line14_State'],            get(saved,'employment[0].state'));
  setManyText(form, ['Pt1Line14_ZipCode'],          get(saved,'employment[0].zip'));
  setManyText(form, ['Pt1Line14_Province'],         get(saved,'employment[0].province'));
  setManyText(form, ['Pt1Line14_PostalCode'],       get(saved,'employment[0].postal'));
  setManyText(form, ['Pt1Line14_Country'],          get(saved,'employment[0].country'));
  setManyText(form, ['Pt1Line15_Occupation'],       get(saved,'employment[0].occupation'));
  setManyText(form, ['Pt1Line16a_DateFrom'],        fmtDate(get(saved,'employment[0].from')));
  setManyText(form, ['Pt1Line16b_ToFrom'],          fmtDate(get(saved,'employment[0].to')));

  setManyText(form, ['Pt1Line17_NameofEmployer'],   get(saved,'employment[1].employer'));
  setManyText(form, ['Pt1Line18_StreetNumberName'], get(saved,'employment[1].street'));
  setManyText(form, ['Pt1Line18_AptSteFlrNumber'],  get(saved,'employment[1].unitNum'));
  setManyText(form, ['Pt1Line18_CityOrTown'],       get(saved,'employment[1].city'));
  setManyText(form, ['Pt1Line18_State'],            get(saved,'employment[1].state'));
  setManyText(form, ['Pt1Line18_ZipCode'],          get(saved,'employment[1].zip'));
  setManyText(form, ['Pt1Line18_Province'],         get(saved,'employment[1].province'));
  setManyText(form, ['Pt1Line18_PostalCode'],       get(saved,'employment[1].postal'));
  setManyText(form, ['Pt1Line18_Country'],          get(saved,'employment[1].country'));
  setManyText(form, ['Pt1Line19_Occupation'],       get(saved,'employment[1].occupation'));
  setManyText(form, ['Pt1Line20a_DateFrom'],        fmtDate(get(saved,'employment[1].from')));
  setManyText(form, ['Pt1Line20b_ToFrom'],          fmtDate(get(saved,'employment[1].to')));

  /* ===== Part 1 — Other Information (21–26) ===== */
  // 21 Sex (two checkboxes)
  const sex = (pet.sex || '').toLowerCase();
  setManyChecks(form, [
    'Pt1Line21_Male','Pt1Line21_Checkboxes_p0_ch1','Pt1_Line21_Male','Line21_Male'
  ], sex === 'male');
  setManyChecks(form, [
    'Pt1Line21_Female','Pt1Line21_Checkboxes_p0_ch2','Pt1_Line21_Female','Line21_Female'
  ], sex === 'female');

  // 22 DOB
  setManyText(form, [
    'Pt1Line22_DateOfBirth','Pt1Line22_Date of Birth','Line22_DOB'
  ], fmtDate(pet.dob));

  // 23 Marital Status (4 checkboxes)
  const ms = (pet.maritalStatus || '').toLowerCase();
  setManyChecks(form, [
    'Pt1Line23_Single','Pt1_Line23_Single','Line23_Single','Pt1Line23_Checkboxes_p0_ch1'
  ], ms === 'single');
  setManyChecks(form, [
    'Pt1Line23_Married','Pt1_Line23_Married','Line23_Married','Pt1Line23_Checkboxes_p0_ch2'
  ], ms === 'married');
  setManyChecks(form, [
    'Pt1Line23_Divorced','Pt1_Line23_Divorced','Line23_Divorced','Pt1Line23_Checkboxes_p0_ch3'
  ], ms === 'divorced');
  setManyChecks(form, [
    'Pt1Line23_Widowed','Pt1_Line23_Widowed','Line23_Widowed','Pt1Line23_Checkboxes_p0_ch4'
  ], ms === 'widowed');

  // 24–26 Birth City / Province/State / Country
  setManyText(form, ['Pt1Line24_CityTownOfBirth','Line24_City'], pet.birthCity);
  setManyText(form, ['Pt1Line25_ProvinceOrStateOfBirth','Line25_ProvinceState'], pet.birthProvinceState);
  setManyText(form, ['Pt1Line26_CountryOfBirth','Line26_Country'], pet.birthCountry);

  /* ===== Part 2 — Beneficiary (identity) ===== */
  setText1(form, 'Pt2Line1a_FamilyName',       get(ben,'lastName'));
  setText1(form, 'Pt2Line1b_GivenName',        get(ben,'firstName'));
  setText1(form, 'Pt2Line1c_MiddleName',       get(ben,'middleName'));

  setText1(form, 'Pt2Line2_AlienNumber',       get(ben,'aNumber'));
  setText1(form, 'Pt2Line3_SSN',               get(ben,'ssn'));
  setManyText(form, ['Pt2Line4_DateOfBirth','Pt2Line4_DOB'], fmtDate(get(ben,'dob')));

  setText1(form, 'Pt2Line7_CityTownOfBirth',   get(ben,'birthCity'));
  setText1(form, 'Pt2Line8_CountryOfBirth',    get(ben,'birthCountry'));
  setText1(form, 'Pt2Line9_CountryofCitzOrNationality', get(ben,'citizenship'));

  setText1(form, 'Pt2Line10a_FamilyName',      get(ben,'otherNames[0].lastName'));
  setText1(form, 'Pt2Line10b_GivenName',       get(ben,'otherNames[0].firstName'));
  setText1(form, 'Pt2Line10c_MiddleName',      get(ben,'otherNames[0].middleName'));

  /* Beneficiary mailing (11) */
  const benMail = pickAddress(ben.mailing);
  setText1(form, 'Pt2Line11_StreetNumberName', benMail.street);
  setText1(form, 'Pt2Line11_AptSteFlrNumber',  benMail.unitNum);
  setText1(form, 'Pt2Line11_CityOrTown',       benMail.city);
  setText1(form, 'Pt2Line11_State',            benMail.state);
  setText1(form, 'Pt2Line11_ZipCode',          benMail.zip);
  setText1(form, 'Pt2Line11_Province',         benMail.province);
  setText1(form, 'Pt2Line11_PostalCode',       benMail.postal);
  setText1(form, 'Pt2Line11_Country',          benMail.country);
  // (No InCareOf per your instruction)

  /* Beneficiary current physical (14–15) */
  const benPhys0 = benSameAsMailing
    ? { ...benMail }
    : (pickAddress(get(ben,'physical[0]')) || pickAddress(get(ben,'physicalAddress')));
  setText1(form, 'Pt2Line14_StreetNumberName', benPhys0.street);
  setText1(form, 'Pt2Line14_AptSteFlrNumber',  benPhys0.unitNum);
  setText1(form, 'Pt2Line14_CityOrTown',       benPhys0.city);
  setText1(form, 'Pt2Line14_State',            benPhys0.state);
  setText1(form, 'Pt2Line14_ZipCode',          benPhys0.zip);
  setText1(form, 'Pt2Line14_Province',         benPhys0.province);
  setText1(form, 'Pt2Line14_PostalCode',       benPhys0.postal);
  setText1(form, 'Pt2Line14_Country',          benPhys0.country);
  setText1(form, 'Pt2Line15a_DateFrom',        fmtDate(benPhys0.from));
  setText1(form, 'Pt2Line15b_ToFrom',          fmtDate(benPhys0.to));

  /* Beneficiary employment #1 (16–19) */
  setText1(form, 'Pt2Line16_NameofEmployer',   get(ben,'employment[0].employer'));
  setText1(form, 'Pt2Line17_StreetNumberName', get(ben,'employment[0].street'));
  setText1(form, 'Pt2Line17_AptSteFlrNumber',  get(ben,'employment[0].unitNum'));
  setText1(form, 'Pt2Line17_CityOrTown',       get(ben,'employment[0].city'));
  setText1(form, 'Pt2Line17_State',            get(ben,'employment[0].state'));
  setText1(form, 'Pt2Line17_ZipCode',          get(ben,'employment[0].zip'));
  setText1(form, 'Pt2Line17_Province',         get(ben,'employment[0].province'));
  setText1(form, 'Pt2Line17_PostalCode',       get(ben,'employment[0].postal'));
  setText1(form, 'Pt2Line17_Country',          get(ben,'employment[0].country'));
  setText1(form, 'Pt2Line18_Occupation',       get(ben,'employment[0].occupation'));
  setText1(form, 'Pt2Line19a_DateFrom',        fmtDate(get(ben,'employment[0].from')));
  setText1(form, 'Pt2Line19b_ToFrom',          fmtDate(get(ben,'employment[0].to')));

  /* ===== Petitioner Parents (new: ensure sex/city/country land) ===== */
  const p1 = (pet.parents && pet.parents[0]) ? pet.parents[0] : {};
  const p2 = (pet.parents && pet.parents[1]) ? pet.parents[1] : {};

  // If your PDF has explicit parent fields, include them here; otherwise these no-op.
  // Parent 1
  setManyText(form, ['Pt1Parent1_Family','Parent1_Family'], p1.lastName);
  setManyText(form, ['Pt1Parent1_Given','Parent1_Given'],   p1.firstName);
  setManyText(form, ['Pt1Parent1_Middle','Parent1_Middle'], p1.middleName);
  setManyText(form, ['Pt1Parent1_DOB','Parent1_DOB'],       fmtDate(p1.dob));

  const p1sex = (p1.sex || '').toLowerCase();
  setManyChecks(form, ['Pt1Parent1_Sex_Male','Parent1_Sex_Male'], p1sex === 'male');
  setManyChecks(form, ['Pt1Parent1_Sex_Female','Parent1_Sex_Female'], p1sex === 'female');

  setManyText(form, ['Pt1Parent1_CityOfBirth','Parent1_City'],     p1.cityBirth);
  setManyText(form, ['Pt1Parent1_CountryOfBirth','Parent1_Country'], p1.countryBirth);
  setManyText(form, ['Pt1Parent1_Nationality','Parent1_Nationality'], p1.nationality);

  // Parent 2
  setManyText(form, ['Pt1Parent2_Family','Parent2_Family'], p2.lastName);
  setManyText(form, ['Pt1Parent2_Given','Parent2_Given'],   p2.firstName);
  setManyText(form, ['Pt1Parent2_Middle','Parent2_Middle'], p2.middleName);
  setManyText(form, ['Pt1Parent2_DOB','Parent2_DOB'],       fmtDate(p2.dob));

  const p2sex = (p2.sex || '').toLowerCase();
  setManyChecks(form, ['Pt1Parent2_Sex_Male','Parent2_Sex_Male'], p2sex === 'male');
  setManyChecks(form, ['Pt1Parent2_Sex_Female','Parent2_Sex_Female'], p2sex === 'female');

  setManyText(form, ['Pt1Parent2_CityOfBirth','Parent2_City'],       p2.cityBirth);
  setManyText(form, ['Pt1Parent2_CountryOfBirth','Parent2_Country'], p2.countryBirth);
  setManyText(form, ['Pt1Parent2_Nationality','Parent2_Nationality'], p2.nationality);
}

/* Keep your debug list (optional) */
export const I129F_DEBUG_FIELD_LIST = [
  'Pt1Line6a_FamilyName','Pt1Line6b_GivenName','Pt1Line6c_MiddleName',
  'Pt1Line7a_FamilyName','Pt1Line7b_GivenName','Pt1Line7c_MiddleName',
  'Pt1Line8_StreetNumberName','Pt1Line8_AptSteFlrNumber','Pt1Line8_CityOrTown',
  'Pt1Line8_State','Pt1Line8_ZipCode',

  'Pt1Line9_StreetNumberName','Pt1Line10a_DateFrom','Pt1Line10b_DateFrom',

  'Pt1Line13_NameofEmployer','Pt1Line14_StreetNumberName','Pt1Line15_Occupation',
  'Pt1Line16a_DateFrom','Pt1Line16b_ToFrom',

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
