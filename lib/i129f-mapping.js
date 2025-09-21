// lib/i129f-mapping.js

/** ---------------- small utils ---------------- */
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
  } catch { return dflt; }
}

function fmtDate(v) {
  if (!v) return '';
  try {
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
      const [y,m,d] = v.split('-'); return `${m}/${d}/${y}`;
    }
    const d = new Date(v);
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    const yy = d.getFullYear();
    return `${mm}/${dd}/${yy}`;
  } catch { return String(v); }
}

/** ---------------- pdf-lib helpers ---------------- */
function fieldNameList(form) {
  try {
    return form.getFields().map(f => f.getName ? String(f.getName()) : String(f.name || ''));
  } catch {
    return [];
  }
}

function firstMatchingName(names, regexes) {
  for (const rx of regexes) {
    const hit = names.find(n => rx.test(n));
    if (hit) return hit;
  }
  return null;
}

function trySetTextByName(form, name, value) {
  if (!name) return false;
  try { form.getTextField(name).setText(value ?? ''); return true; } catch { return false; }
}
function tryCheckByName(form, name, on = true) {
  if (!name) return false;
  try { const cb = form.getCheckBox(name); on ? cb.check() : cb.uncheck(); return true; } catch { return false; }
}

function setTextOneOf(form, explicitNames, value, allNames) {
  for (const n of explicitNames) if (trySetTextByName(form, n, value)) return true;
  return false;
}
function checkOneOf(form, explicitNames, on, allNames) {
  for (const n of explicitNames) if (tryCheckByName(form, n, on)) return true;
  return false;
}

function setTextLike(form, patterns, value, allNames) {
  const name = firstMatchingName(allNames, patterns);
  return trySetTextByName(form, name, value);
}
function checkLike(form, patterns, on, allNames) {
  const name = firstMatchingName(allNames, patterns);
  return tryCheckByName(form, name, on);
}

function setText(form, name, value) { trySetTextByName(form, name, value); }
function checkBox(form, name, on = true) { tryCheckByName(form, name, on); }

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

/** ---------------- main mapper ---------------- */
export function applyI129fMapping(saved, form) {
  if (!saved) return;
  const NAMES = fieldNameList(form);

  const pet = saved.petitioner ?? {};
  const ben = saved.beneficiary ?? {};

  const petSameAsMailing = !!(pet.currentSameAsMailing || pet.physicalSameAsMailing || saved.mailing?.sameAsPhysical);
  const benSameAsMailing = !!(ben.currentSameAsMailing || ben.physicalSameAsMailing);

  /** Part 1 — Lines 1–3 (A#, acct, SSN) */
  setTextOneOf(form, ['Pt1Line1_AlienNumber'], pet.aNumber ?? '', NAMES) ||
    setTextLike(form, [/^pt1.*line1.*alien/i, /alien.*number/i], pet.aNumber ?? '', NAMES);

  setTextOneOf(form, ['Pt1Line2_AcctIdentifier'], pet.uscisOnlineAccount ?? '', NAMES) ||
    setTextLike(form, [/^pt1.*line2.*(acct|account|identifier)/i], pet.uscisOnlineAccount ?? '', NAMES);

  setTextOneOf(form, ['Pt1Line3_SSN'], pet.ssn ?? '', NAMES) ||
    setTextLike(form, [/^pt1.*line3.*ssn/i, /\bSSN\b/i], pet.ssn ?? '', NAMES);

  /** Part 1 — Line 4 (K-1 / K-3) and Line 5 (I-130 yes/no) */
  const classif = (saved.classification || pet.classification || '').toLowerCase(); // 'k1' | 'k3'
  // K-1
  checkOneOf(form, ['Pt1Line4a_Checkboxes_p0_ch2','Pt1Line4a_Checkbox_p0_ch2','Pt1Line4a_K1','Pt1Line4a'], classif==='k1', NAMES) ||
  checkLike(form, [/^pt1.*line4.*a.*(k-?1|fiance)/i], classif==='k1', NAMES);
  // K-3 (often 4b)
  checkOneOf(form, ['Pt1Line4b_Checkboxes_p0_ch2','Pt1Line4b_Checkbox_p0_ch2','Pt1Line4b_K3','Pt1Line4b'], classif==='k3', NAMES) ||
  checkLike(form, [/^pt1.*line4.*b.*(k-?3|spouse)/i], classif==='k3', NAMES);

  // I-130 Yes / No (Line 5)
  const filedI130 = !!(saved.k3FiledI130 ?? pet.k3FiledI130);
  (checkOneOf(form, ['Pt1Line5_Checkboxes_p0_ch2','Pt1Line5_Checkbox_p0_ch2','Pt1Line5_Yes'], classif==='k3' && filedI130 === true, NAMES) ||
   checkLike(form, [/^pt1.*line5.*(yes|ch2)/i], classif==='k3' && filedI130 === true, NAMES));
  (checkOneOf(form, ['Pt1Line5_Checkboxes_p0_ch3','Pt1Line5_Checkbox_p0_ch3','Pt1Line5_No'],  classif==='k3' && filedI130 === false, NAMES) ||
   checkLike(form, [/^pt1.*line5.*(no|ch3)/i],  classif==='k3' && filedI130 === false, NAMES));

  /** Part 1 — “Other info” (21–26): Sex, DOB, Marital, City/Prov/Country of birth */
  const sex = (pet.sex || '').toLowerCase();
  const isMale = sex === 'male' || sex === 'm';
  const isFemale = sex === 'female' || sex === 'f';

  // Sex (Line 21) – male then female
  (checkOneOf(form, ['Pt1Line21_Checkbox_p2_ch2','Pt1Line21_Male','Pt1Line21_ch2'], isMale, NAMES) ||
   checkLike(form, [/(pt1.*line21|sex).*male/i, /sex.*(ch2|male)/i], isMale, NAMES));

  (checkOneOf(form, ['Pt1Line21_Checkboxes_p2_ch3','Pt1Line21_Female','Pt1Line21_ch3'], isFemale, NAMES) ||
   checkLike(form, [/(pt1.*line21|sex).*female/i, /sex.*(ch3|female)/i], isFemale, NAMES));

  // DOB (22)
  setTextOneOf(form, ['Pt1Line22_DateofBirth','Pt1Line22_DateOfBirth'], fmtDate(pet.dob), NAMES) ||
  setTextLike(form, [/pt1.*line22.*date.*birth/i, /(other|petitioner).*(dob|date)/i], fmtDate(pet.dob), NAMES);

  // Marital Status (23) – single/married/divorced/widowed
  const ms = (pet.maritalStatus || '').toLowerCase();
  (checkOneOf(form, ['Pt1Line23_Checkbox_p2_ch2','Pt1Line23_Single'],   ms==='single', NAMES) ||
   checkLike(form, [/pt1.*line23.*(single|never married)/i], ms==='single', NAMES));
  (checkOneOf(form, ['Pt1Line23_Checkbox_p2_ch3','Pt1Line23_Married'],  ms==='married', NAMES) ||
   checkLike(form, [/pt1.*line23.*married/i], ms==='married', NAMES));
  (checkOneOf(form, ['Pt1Line23_Checkbox_p2_ch4','Pt1Line23_Divorced'], ms==='divorced', NAMES) ||
   checkLike(form, [/pt1.*line23.*divorc/i], ms==='divorced', NAMES));
  (checkOneOf(form, ['Pt1Line23_Checkbox_p2_ch5','Pt1Line23_Widowed'],  ms==='widowed', NAMES) ||
   checkLike(form, [/pt1.*line23.*widow/i], ms==='widowed', NAMES));

  // City (24), Province/State (25), Country (26)
  setTextOneOf(form, ['Pt1Line24_CityTownOfBirth','Pt1Line24_CityTownVillageOfBirth','Pt1Line24_CityOfBirth'], pet.birthCity || get(pet,'cityBirth'), NAMES) ||
  setTextLike(form, [/pt1.*line24.*(city|town|village).*birth/i], pet.birthCity || get(pet,'cityBirth'), NAMES);

  setTextOneOf(form, ['Pt1Line25_ProvinceOrStateOfBirth','Pt1Line25_StateOfBirth','Pt1Line25_ProvinceOfBirth'], pet.birthProvinceState || get(pet,'stateBirth') || get(pet,'provinceBirth'), NAMES) ||
  setTextLike(form, [/pt1.*line25.*(province|state).*birth/i], pet.birthProvinceState || get(pet,'stateBirth') || get(pet,'provinceBirth'), NAMES);

  setTextOneOf(form, ['Pt1Line26_CountryOfCitzOrNationality','Pt1Line26_CountryOfBirth'], pet.birthCountry || get(pet,'countryBirth'), NAMES) ||
  setTextLike(form, [/pt1.*line26.*country/i], pet.birthCountry || get(pet,'countryBirth'), NAMES);

  /** Names (6–7) */
  setText(form, 'Pt1Line6a_FamilyName',  get(pet, 'lastName'));
  setText(form, 'Pt1Line6b_GivenName',   get(pet, 'firstName'));
  setText(form, 'Pt1Line6c_MiddleName',  get(pet, 'middleName'));

  setText(form, 'Pt1Line7a_FamilyName',  get(pet, 'otherNames[0].lastName'));
  setText(form, 'Pt1Line7b_GivenName',   get(pet, 'otherNames[0].firstName'));
  setText(form, 'Pt1Line7c_MiddleName',  get(pet, 'otherNames[0].middleName'));

  /** Addresses (8–12) */
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

  /** Employment (13–20) */
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

  /** Parents (Page 3) — add Sex + City + Country with fuzzy matching */
  const p0 = (pet.parents && pet.parents[0]) || {};
  const p1 = (pet.parents && pet.parents[1]) || {};

  // Parent #1
  setText(form, 'Pt1Line27a_FamilyName', p0.lastName || '');
  setText(form, 'Pt1Line27b_GivenName',  p0.firstName || '');
  setText(form, 'Pt1Line27c_MiddleName', p0.middleName || '');
  setText(form, 'Pt1Line28_DateofBirth', fmtDate(p0.dob));

  const p0Sex = (p0.sex || '').toLowerCase();
  (checkOneOf(form, ['Pt1Line29_Checkbox_p2_ch2','Pt1Line29_Male','Pt1Line29_ch2'], p0Sex==='m'||p0Sex==='male', NAMES) ||
   checkLike(form, [/(pt1.*line29|parent.?1|father).*male/i], p0Sex==='m'||p0Sex==='male', NAMES));
  (checkOneOf(form, ['Pt1Line29_Checkboxes_p2_ch3','Pt1Line29_Female','Pt1Line29_ch3'], p0Sex==='f'||p0Sex==='female', NAMES) ||
   checkLike(form, [/(pt1.*line29|parent.?1|mother).*female/i], p0Sex==='f'||p0Sex==='female', NAMES));

  setTextOneOf(form, ['Pt1Line30_CityTownOfBirth','Pt1Line30_CityTownVillageOfBirth','Pt1Line30_CityOfBirth'], p0.cityBirth || '', NAMES) ||
  setTextLike(form, [/(pt1.*line30|parent.?1).*(city|town|village).*birth/i], p0.cityBirth || '', NAMES);

  setTextOneOf(form, ['Pt1Line30_CountryOfCitzOrNationality','Pt1Line30_CountryOfBirth'], p0.countryBirth || p0.nationality || '', NAMES) ||
  setTextLike(form, [/(pt1.*line30|parent.?1).*(country|national)/i], p0.countryBirth || p0.nationality || '', NAMES);

  // Parent #2
  setText(form, 'Pt1Line32a_FamilyName', p1.lastName || '');
  setText(form, 'Pt1Line32b_GivenName',  p1.firstName || '');
  setText(form, 'Pt1Line32c_MiddleName', p1.middleName || '');
  setText(form, 'Pt1Line33_DateofBirth', fmtDate(p1.dob));

  const p1Sex = (p1.sex || '').toLowerCase();
  (checkOneOf(form, ['Pt1Line34_Checkbox_p2_ch2','Pt1Line34_Male','Pt1Line34_ch2'], p1Sex==='m'||p1Sex==='male', NAMES) ||
   checkLike(form, [/(pt1.*line34|parent.?2|father).*male/i], p1Sex==='m'||p1Sex==='male', NAMES));
  (checkOneOf(form, ['Pt1Line34_Checkboxes_p2_ch3','Pt1Line34_Female','Pt1Line34_ch3'], p1Sex==='f'||p1Sex==='female', NAMES) ||
   checkLike(form, [/(pt1.*line34|parent.?2|mother).*female/i], p1Sex==='f'||p1Sex==='female', NAMES));

  setTextOneOf(form, ['Pt1Line35_CityTownOfBirth','Pt1Line35_CityTownVillageOfBirth','Pt1Line35_CityOfBirth'], p1.cityBirth || '', NAMES) ||
  setTextLike(form, [/(pt1.*line35|parent.?2).*(city|town|village).*birth/i], p1.cityBirth || '', NAMES);

  setTextOneOf(form, ['Pt1Line35_CountryOfCitzOrNationality','Pt1Line35_CountryOfBirth'], p1.countryBirth || p1.nationality || '', NAMES) ||
  setTextLike(form, [/(pt1.*line35|parent.?2).*(country|national)/i], p1.countryBirth || p1.nationality || '', NAMES);

  /** Part 2 — Beneficiary (leave your working pieces) */
  setText(form, 'Pt2Line1a_FamilyName',       get(ben, 'lastName'));
  setText(form, 'Pt2Line1b_GivenName',        get(ben, 'firstName'));
  setText(form, 'Pt2Line1c_MiddleName',       get(ben, 'middleName'));
  setText(form, 'Pt2Line2_AlienNumber',       get(ben, 'aNumber'));
  setText(form, 'Pt2Line3_SSN',               get(ben, 'ssn'));
  setText(form, 'Pt2Line4_DateOfBirth',       fmtDate(get(ben, 'dob')));
  setText(form, 'Pt2Line7_CityTownOfBirth',   get(ben, 'birthCity'));
  setText(form, 'Pt2Line8_CountryOfBirth',    get(ben, 'birthCountry'));
  setText(form, 'Pt2Line9_CountryofCitzOrNationality', get(ben, 'nationality'));

  const benMail = pickAddress(ben.mailing);
  setText(form, 'Pt2Line11_StreetNumberName', benMail.street);
  setText(form, 'Pt2Line11_AptSteFlrNumber',  benMail.unitNum);
  setText(form, 'Pt2Line11_CityOrTown',       benMail.city);
  setText(form, 'Pt2Line11_State',            benMail.state);
  setText(form, 'Pt2Line11_ZipCode',          benMail.zip);
  setText(form, 'Pt2Line11_Province',         benMail.province);
  setText(form, 'Pt2Line11_PostalCode',       benMail.postal);
  setText(form, 'Pt2Line11_Country',          benMail.country);

  const benPhys0 = benSameAsMailing ? { ...benMail } : pickAddress(get(ben, 'physicalAddress'));
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

/** Optional debug shortlist */
export const I129F_DEBUG_FIELD_LIST = [
  'Pt1Line1_AlienNumber','Pt1Line2_AcctIdentifier','Pt1Line3_SSN',
  'Pt1Line4a_Checkboxes_p0_ch2','Pt1Line4b_Checkboxes_p0_ch2',
  'Pt1Line5_Checkboxes_p0_ch2','Pt1Line5_Checkboxes_p0_ch3',
  'Pt1Line21_Checkbox_p2_ch2','Pt1Line21_Checkboxes_p2_ch3',
  'Pt1Line22_DateofBirth',
  'Pt1Line23_Checkbox_p2_ch2','Pt1Line23_Checkbox_p2_ch3','Pt1Line23_Checkbox_p2_ch4','Pt1Line23_Checkbox_p2_ch5',
  'Pt1Line24_CityTownOfBirth','Pt1Line25_ProvinceOrStateOfBirth','Pt1Line26_CountryOfCitzOrNationality',
  'Pt1Line27a_FamilyName','Pt1Line28_DateofBirth','Pt1Line29_Checkbox_p2_ch2',
  'Pt1Line30_CityTownOfBirth','Pt1Line30_CountryOfCitzOrNationality',
  'Pt1Line32a_FamilyName','Pt1Line33_DateofBirth','Pt1Line34_Checkbox_p2_ch2',
  'Pt1Line35_CityTownOfBirth','Pt1Line35_CountryOfCitzOrNationality',
  'Pt2Line1a_FamilyName','Pt2Line4_DateOfBirth'
];
