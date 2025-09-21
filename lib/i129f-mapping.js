// lib/i129f-mapping.js

/** Small helpers */
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

/** write text with fallbacks */
function setText(form, name, value) {
  if (!name) return;
  try {
    const tf = form.getTextField(name);
    tf.setText(value ?? '');
  } catch {}
}

/** try multiple text fields */
function setTextAny(form, names, value) {
  for (const n of [].concat(names||[])) {
    try {
      const tf = form.getTextField(n);
      tf.setText(value ?? '');
      return true;
    } catch {}
  }
  return false;
}

/** checkbox/radio helpers */
function checkBox(form, name, on = true) {
  try {
    const cb = form.getCheckBox(name);
    on ? cb.check() : cb.uncheck();
    return true;
  } catch {}
  return false;
}
function selectRadio(form, name, opt) {
  try {
    const rg = form.getRadioGroup(name);
    rg.select(opt);
    return true;
  } catch {}
  return false;
}
function tryCheck(names, on = true) {
  for (const name of [].concat(names || [])) {
    if (checkBox(form, name, on)) return true;
    // some PDFs expose radios instead
    if (on && selectRadio(form, name, 'Yes')) return true;
  }
  return false;
}

/** copy address-like values */
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

export function applyI129fMapping(saved, form) {
  if (!saved) return;

  const pet = saved.petitioner ?? {};
  const ben = saved.beneficiary ?? {};

  const petSameAsMailing =
    !!(pet.currentSameAsMailing || pet.physicalSameAsMailing || pet.sameAsMailing);
  const benSameAsMailing =
    !!(ben.currentSameAsMailing || ben.physicalSameAsMailing || ben.sameAsMailing);

  // ---- Part 1 basics ----
  setText(form, 'Pt1Line6a_FamilyName',  get(pet, 'lastName'));
  setText(form, 'Pt1Line6b_GivenName',   get(pet, 'firstName'));
  setText(form, 'Pt1Line6c_MiddleName',  get(pet, 'middleName'));

  setText(form, 'Pt1Line7a_FamilyName',  get(pet, 'otherNames[0].lastName'));
  setText(form, 'Pt1Line7b_GivenName',   get(pet, 'otherNames[0].firstName'));
  setText(form, 'Pt1Line7c_MiddleName',  get(pet, 'otherNames[0].middleName'));

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

  // ---- NEW: top lines 1–5 ----
  setText(form, 'Pt1Line1_AlienNumber',    get(pet, 'aNumber'));
  setText(form, 'Pt1Line2_AcctIdentifier', get(pet, 'uscisOnlineAccount'));
  setText(form, 'Pt1Line3_SSN',            get(pet, 'ssn'));

  // Line 4 — K1/K3
  const pType = (pet.petitionType || '').toUpperCase();
  if (pType === 'K1') {
    tryCheck(['Pt1Line4a_Checkboxes_p0_ch2','Pt1Line4a_Checkboxes_p2_ch2','Pt1Line4a_K1','Pt1Line4_K1'], true);
  } else if (pType === 'K3') {
    tryCheck(['Pt1Line4a_Checkboxes_p0_ch3','Pt1Line4a_Checkboxes_p2_ch3','Pt1Line4a_K3','Pt1Line4_K3'], true);
  }

  // Line 5 — If K-3: I-130 filed? (Yes/No)
  const k3Filed = pet.k3FiledI130;
  const k3Yes = (k3Filed === true || String(k3Filed).toLowerCase() === 'yes');
  const k3No  = (k3Filed === false || String(k3Filed).toLowerCase() === 'no');
  if (pType === 'K3') {
    if (k3Yes) {
      tryCheck(['Pt1Line5_Yes','Pt1Line5_Y','Pt1Line5_Checkboxes_p0_ch1','Pt1Line5_Checkboxes_p2_ch1'], true);
      tryCheck(['Pt1Line5_No','Pt1Line5_N','Pt1Line5_Checkboxes_p0_ch2','Pt1Line5_Checkboxes_p2_ch2'], false);
    } else if (k3No) {
      tryCheck(['Pt1Line5_No','Pt1Line5_N','Pt1Line5_Checkboxes_p0_ch2','Pt1Line5_Checkboxes_p2_ch2'], true);
      tryCheck(['Pt1Line5_Yes','Pt1Line5_Y','Pt1Line5_Checkboxes_p0_ch1','Pt1Line5_Checkboxes_p2_ch1'], false);
    }
  }

  // ---- NEW: 21–26 with robust fallbacks ----

  // 21 Sex
  const sex = String(pet.sex || '').toLowerCase();
  if (sex) {
    const maleNames   = ['Pt1Line21_Male','Pt1Line21_Checkboxes_p0_ch2','Pt1Line21_Checkboxes_p2_ch2','Pt1Line21_Sex_M','Pt1Line21_M'];
    const femaleNames = ['Pt1Line21_Female','Pt1Line21_Checkboxes_p0_ch3','Pt1Line21_Checkboxes_p2_ch3','Pt1Line21_Sex_F','Pt1Line21_F'];
    if (sex === 'male' || sex === 'm') {
      tryCheck(maleNames, true);
      // some PDFs use a single text field for sex
      setTextAny(form, ['Pt1Line21_Sex','Pt1Line21_SexText'], 'Male');
    } else if (sex === 'female' || sex === 'f') {
      tryCheck(femaleNames, true);
      setTextAny(form, ['Pt1Line21_Sex','Pt1Line21_SexText'], 'Female');
    }
  }

  // 22 Date of Birth
  const dobText = fmtDate(pet.dob);
  setTextAny(form, [
    'Pt1Line22_DateOfBirth',
    'Pt1Line22_Date of Birth',
    'Pt1Line22_DOB',
    'Pt1Line22_BirthDate'
  ], dobText);

  // 23 Marital Status
  (function() {
    const ms = String(pet.maritalStatus || '').toLowerCase();
    // radio group common ids
    if (selectRadio(form, 'Pt1Line23_MaritalStatus', {single:'Single',married:'Married',divorced:'Divorced',widowed:'Widowed'}[ms])) return;
    // try individual checkboxes
    const labels = ['Single','Married','Divorced','Widowed'];
    labels.forEach(L => tryCheck([`Pt1Line23_${L}`, `Pt1Line23_${L}_cb`], false));
    if (ms === 'single')   tryCheck(['Pt1Line23_Single','Pt1Line23_Single_cb'], true);
    if (ms === 'married')  tryCheck(['Pt1Line23_Married','Pt1Line23_Married_cb'], true);
    if (ms === 'divorced') tryCheck(['Pt1Line23_Divorced','Pt1Line23_Divorced_cb'], true);
    if (ms === 'widowed')  tryCheck(['Pt1Line23_Widowed','Pt1Line23_Widowed_cb'], true);
    // final fallback: a text box variant
    if (ms) setTextAny(form, ['Pt1Line23_MaritalStatus','Pt1Line23_Marital','Pt1Line23_Text'], pet.maritalStatus);
  })();

  // 24–26 Birthplace
  setText(form, 'Pt1Line24_CityTownOfBirth',        pet.birthCity);
  setText(form, 'Pt1Line25_ProvinceOrStateOfBirth', pet.birthProvince);
  // Some templates mislabeled country with the same "ProvinceOrStateOfBirth" id
  setTextAny(form, [
    'Pt1Line26_CountryOfBirth',
    'Pt1Line26_CountryofBirth',
    'Pt1Line26_ProvinceOrStateOfBirth', // fallback seen in your template
  ], pet.birthCountry);

  // ---- Part 2 (unchanged from before) ----
  setText(form, 'Pt2Line1a_FamilyName',       get(ben, 'lastName'));
  setText(form, 'Pt2Line1b_GivenName',        get(ben, 'firstName'));
  setText(form, 'Pt2Line1c_MiddleName',       get(ben, 'middleName'));

  setText(form, 'Pt2Line2_AlienNumber',       get(ben, 'aNumber'));
  setText(form, 'Pt2Line3_SSN',               get(ben, 'ssn'));
  setText(form, 'Pt2Line4_DateOfBirth',       fmtDate(get(ben, 'dob')));

  setText(form, 'Pt2Line7_CityTownOfBirth',   get(ben, 'birthCity'));
  setText(form, 'Pt2Line8_CountryOfBirth',    get(ben, 'birthCountry'));
  setText(form, 'Pt2Line9_CountryofCitzOrNationality', get(ben, 'citizenship'));

  setText(form, 'Pt2Line10a_FamilyName',      get(ben, 'otherNames[0].lastName'));
  setText(form, 'Pt2Line10b_GivenName',       get(ben, 'otherNames[0].firstName'));
  setText(form, 'Pt2Line10c_MiddleName',      get(ben, 'otherNames[0].middleName'));

  const benMail = pickAddress(ben.mailing);
  // Do not set InCareOf for beneficiary per your spec
  setText(form, 'Pt2Line11_StreetNumberName', benMail.street);
  setText(form, 'Pt2Line11_AptSteFlrNumber',  benMail.unitNum);
  setText(form, 'Pt2Line11_CityOrTown',       benMail.city);
  setText(form, 'Pt2Line11_State',            benMail.state);
  setText(form, 'Pt2Line11_ZipCode',          benMail.zip);
  setText(form, 'Pt2Line11_Province',         benMail.province);
  setText(form, 'Pt2Line11_PostalCode',       benMail.postal);
  setText(form, 'Pt2Line11_Country',          benMail.country);

  const benPhys0 = benSameAsMailing ? { ...benMail } : pickAddress(get(ben, 'physical[0]'));
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
}

/** Optional for /all-fields */
export const I129F_DEBUG_FIELD_LIST = [
  'Pt1Line6a_FamilyName','Pt1Line6b_GivenName','Pt1Line6c_MiddleName',
  'Pt1Line7a_FamilyName','Pt1Line7b_GivenName','Pt1Line7c_MiddleName',
  'Pt1Line8_StreetNumberName','Pt1Line8_AptSteFlrNumber','Pt1Line8_CityOrTown',
  'Pt1Line8_State','Pt1Line8_ZipCode',

  'Pt1Line9_StreetNumberName','Pt1Line10a_DateFrom','Pt1Line10b_DateFrom',

  'Pt1Line13_NameofEmployer','Pt1Line14_StreetNumberName','Pt1Line15_Occupation',
  'Pt1Line16a_DateFrom','Pt1Line16b_ToFrom',

  // New quick checks
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
