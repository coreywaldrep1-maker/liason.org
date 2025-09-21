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

function firstNonEmpty(...vals) {
  for (const v of vals) if (v !== undefined && v !== null && String(v).trim() !== '') return v;
  return '';
}

function fmtDate(v) {
  if (!v) return '';
  try {
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
      const [y, m, d] = v.split('-');
      return `${m}/${d}/${y}`;
    }
    const d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yy = d.getFullYear();
    return `${mm}/${dd}/${y}`;
  } catch {
    return String(v);
  }
}

/** Robust setters (silently skip if field not present in PDF) */
function setText(form, name, value) {
  if (!name) return;
  try { form.getTextField(name).setText(value ?? ''); } catch {}
}
function setFirstText(form, names = [], value) {
  for (const n of names) {
    try { form.getTextField(n).setText(value ?? ''); return true; } catch {}
  }
  return false;
}
function checkBox(form, name, on = true) {
  try { const cb = form.getCheckBox(name); on ? cb.check() : cb.uncheck(); } catch {}
}
function checkFirst(form, names = [], on = true) {
  for (const n of names) {
    try { const cb = form.getCheckBox(n); on ? cb.check() : cb.uncheck(); return true; } catch {}
  }
  return false;
}

/** Address copy */
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

/* ---------- PDF FIELD FALLBACK SETS YOU CAN TWEAK FROM /api/i129f/pdf-debug ---------- */

/** K-1/K-3 and I-130 */
const PDF_K1 = ['Pt1Line4a_Checkboxes_p0_ch2','Pt1Line4a_Checkboxes_p0_ch0','K1_Check','Part1_K1'];
const PDF_K3 = ['Pt1Line4a_Checkboxes_p0_ch3','Pt1Line4a_Checkboxes_p0_ch1','K3_Check','Part1_K3'];
const PDF_K3_I130_YES = ['Pt1Line5_Yes','Pt1Line5_Y','K3_I130_Yes','Part1_Q5_Yes'];
const PDF_K3_I130_NO  = ['Pt1Line5_No','Pt1Line5_N','K3_I130_No','Part1_Q5_No'];

/** Petitioner “Other information” (Sex / DOB / Marital / Birth) */
const PDF_P1_SEX_M = ['Pt1Line21_Sex_Male','Pt1Line21_Checkboxes_p2_ch0','Sex_Male_Pt1'];
const PDF_P1_SEX_F = ['Pt1Line21_Sex_Female','Pt1Line21_Checkboxes_p2_ch1','Sex_Female_Pt1'];
const PDF_P1_SEX_TXT = ['Pt1Line21_Sex','Sex_Pt1','Part1_Sex_Text'];

const PDF_P1_DOB = ['Pt1Line22_DateOfBirth','Pt1Line22_Date_of_Birth','DOB_Pt1','Pt1_DOB'];

const PDF_P1_MS_SINGLE  = ['Pt1Line23_Single','Marital_Single_Pt1','Pt1_MS_Single'];
const PDF_P1_MS_MARRIED = ['Pt1Line23_Married','Marital_Married_Pt1','Pt1_MS_Married'];
const PDF_P1_MS_DIV     = ['Pt1Line23_Divorced','Marital_Divorced_Pt1','Pt1_MS_Divorced'];
const PDF_P1_MS_WID     = ['Pt1Line23_Widowed','Marital_Widowed_Pt1','Pt1_MS_Widowed'];
const PDF_P1_MS_TXT     = ['Pt1Line23_MaritalStatus','MaritalStatus_Pt1','Pt1_MS_Text'];

const PDF_P1_CITYBIRTH  = ['Pt1Line24_CityTownOfBirth','Pt1_CityBirth'];
const PDF_P1_PROVBIRTH  = ['Pt1Line25_ProvinceOrStateOfBirth','Pt1_ProvinceBirth','Pt1_StateBirth'];
const PDF_P1_COUNTRYB   = ['Pt1Line26_CountryOfBirth','Pt1_CountryBirth','Country_of_Birth_Pt1'];

/** Petitioner Parents (Parent #1 then #2) — try multiple common ids */
const P1PARENT1 = {
  last:   ['Pt1Line27a_FamilyName','P1_Par1_Last','Pt1_Parent1_LastName'],
  first:  ['Pt1Line27b_GivenName','P1_Par1_First','Pt1_Parent1_FirstName'],
  middle: ['Pt1Line27c_MiddleName','P1_Par1_Middle','Pt1_Parent1_MiddleName'],
  dob:    ['Pt1Line28_DateOfBirth','P1_Par1_DOB','Pt1_Parent1_DOB'],
  city:   ['Pt1Line29_CityTownOfBirth','P1_Par1_CityBirth'],
  country:['Pt1Line30_CountryOfBirth','P1_Par1_CountryBirth','Pt1_Parent1_Country'],
};
const P1PARENT2 = {
  last:   ['Pt1Line31a_FamilyName','P1_Par2_Last','Pt1_Parent2_LastName'],
  first:  ['Pt1Line31b_GivenName','P1_Par2_First','Pt1_Parent2_FirstName'],
  middle: ['Pt1Line31c_MiddleName','P1_Par2_Middle','Pt1_Parent2_MiddleName'],
  dob:    ['Pt1Line32_DateOfBirth','P1_Par2_DOB','Pt1_Parent2_DOB'],
  city:   ['Pt1Line33_CityTownOfBirth','P1_Par2_CityBirth'],
  country:['Pt1Line34_CountryOfBirth','P1_Par2_CountryBirth','Pt1_Parent2_Country'],
};

export function applyI129fMapping(saved, form) {
  if (!saved) return;

  const pet = saved.petitioner ?? {};
  const ben = saved.beneficiary ?? {};

  const petSameAsMailing =
    !!(pet.currentSameAsMailing || pet.physicalSameAsMailing || pet.sameAsMailing);
  const benSameAsMailing =
    !!(ben.currentSameAsMailing || ben.physicalSameAsMailing || ben.sameAsMailing);

  /* ===== Part 1 — top three ids (A#, USCIS acct, SSN) ===== */
  setFirstText(form, ['Pt1Line1_AlienNumber','Pt1_Line1_AlienNumber','Part1_Line1_A-Number','A_Number_Pt1'],
    firstNonEmpty(pet.aNumber, saved.aNumber)
  );
  setFirstText(form, ['Pt1Line2_AcctIdentifier','Pt1_Line2_AcctIdentifier','USCIS_Online_Acct_Pt1'],
    firstNonEmpty(pet.uscisOnlineAccount, saved.uscisOnlineAccount)
  );
  setFirstText(form, ['Pt1Line3_SSN','Pt1_Line3_SSN','SSN_Pt1'],
    firstNonEmpty(pet.ssn, saved.ssn)
  );

  /* ===== Part 1 — K-1 / K-3 and I-130 ===== */
  const classification = String(firstNonEmpty(saved.classification, pet.classification, saved.petitionType)).toUpperCase();
  const isK1 = classification === 'K1';
  const isK3 = classification === 'K3';
  if (isK1) checkFirst(form, PDF_K1, true);
  if (isK3) checkFirst(form, PDF_K3, true);

  const i130Filed = !!firstNonEmpty(saved.i130Filed, saved.k3_i130Filed, pet.i130Filed);
  if (isK3) {
    if (i130Filed) {
      checkFirst(form, PDF_K3_I130_YES, true);
      checkFirst(form, PDF_K3_I130_NO, false);
    } else {
      checkFirst(form, PDF_K3_I130_NO, true);
      checkFirst(form, PDF_K3_I130_YES, false);
    }
  }

  /* ===== Part 1 — Name ===== */
  setText(form, 'Pt1Line6a_FamilyName',  pet.lastName);
  setText(form, 'Pt1Line6b_GivenName',   pet.firstName);
  setText(form, 'Pt1Line6c_MiddleName',  pet.middleName);

  setText(form, 'Pt1Line7a_FamilyName',  get(pet, 'otherNames[0].lastName'));
  setText(form, 'Pt1Line7b_GivenName',   get(pet, 'otherNames[0].firstName'));
  setText(form, 'Pt1Line7c_MiddleName',  get(pet, 'otherNames[0].middleName'));

  /* ===== Part 1 — Mailing (8) ===== */
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

  /* ===== Part 1 — Physical (9–12) ===== */
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

  /* ===== Part 1 — Employment (13–20) ===== */
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

  /* ===== Part 1 — Other info (Sex / DOB / Marital / Birth) ===== */
  const sexVal = String(firstNonEmpty(pet.sex, saved.sex)).toLowerCase();
  if (sexVal === 'male' || sexVal === 'm') {
    checkFirst(form, PDF_P1_SEX_M, true);
    checkFirst(form, PDF_P1_SEX_F, false);
    setFirstText(form, PDF_P1_SEX_TXT, 'Male');
  } else if (sexVal === 'female' || sexVal === 'f') {
    checkFirst(form, PDF_P1_SEX_F, true);
    checkFirst(form, PDF_P1_SEX_M, false);
    setFirstText(form, PDF_P1_SEX_TXT, 'Female');
  }
  const petDobRaw = firstNonEmpty(pet.dob, pet.dateOfBirth, pet.birthDate, saved.petDob, saved.dateOfBirth);
  setFirstText(form, PDF_P1_DOB, fmtDate(petDobRaw));

  const ms = String(firstNonEmpty(pet.maritalStatus, saved.maritalStatus)).toLowerCase();
  if (['single','never married','never-married','unmarried'].includes(ms)) {
    checkFirst(form, PDF_P1_MS_SINGLE, true);
    setFirstText(form, PDF_P1_MS_TXT, 'Single');
  } else if (ms === 'married') {
    checkFirst(form, PDF_P1_MS_MARRIED, true);
    setFirstText(form, PDF_P1_MS_TXT, 'Married');
  } else if (ms === 'divorced') {
    checkFirst(form, PDF_P1_MS_DIV, true);
    setFirstText(form, PDF_P1_MS_TXT, 'Divorced');
  } else if (ms === 'widowed') {
    checkFirst(form, PDF_P1_MS_WID, true);
    setFirstText(form, PDF_P1_MS_TXT, 'Widowed');
  } else if (ms) {
    setFirstText(form, PDF_P1_MS_TXT, ms);
  }

  setFirstText(form, PDF_P1_CITYBIRTH, firstNonEmpty(pet.birthCity, pet.cityBirth, saved.birthCity));
  setFirstText(form, PDF_P1_PROVBIRTH, firstNonEmpty(pet.birthProvince, pet.stateBirth, pet.provinceBirth, saved.birthProvince, saved.stateBirth));
  setFirstText(form, PDF_P1_COUNTRYB, firstNonEmpty(pet.birthCountry, pet.countryBirth, pet.countryOfBirth, pet.nationality, saved.birthCountry, saved.countryOfBirth));

  /* ===== Part 1 — Parents (new) ===== */
  const par1 = (pet.parents && pet.parents[0]) ? pet.parents[0] : {};
  const par2 = (pet.parents && pet.parents[1]) ? pet.parents[1] : {};
  setFirstText(form, P1PARENT1.last,   par1.lastName);
  setFirstText(form, P1PARENT1.first,  par1.firstName);
  setFirstText(form, P1PARENT1.middle, par1.middleName);
  setFirstText(form, P1PARENT1.dob,    fmtDate(firstNonEmpty(par1.dob, par1.dateOfBirth)));
  setFirstText(form, P1PARENT1.city,   firstNonEmpty(par1.cityBirth, par1.birthCity));
  setFirstText(form, P1PARENT1.country,firstNonEmpty(par1.countryBirth, par1.birthCountry, par1.nationality));

  setFirstText(form, P1PARENT2.last,   par2.lastName);
  setFirstText(form, P1PARENT2.first,  par2.firstName);
  setFirstText(form, P1PARENT2.middle, par2.middleName);
  setFirstText(form, P1PARENT2.dob,    fmtDate(firstNonEmpty(par2.dob, par2.dateOfBirth)));
  setFirstText(form, P1PARENT2.city,   firstNonEmpty(par2.cityBirth, par2.birthCity));
  setFirstText(form, P1PARENT2.country,firstNonEmpty(par2.countryBirth, par2.birthCountry, par2.nationality));

  /* ===== Part 2 — Beneficiary (same as your working set) ===== */
  setText(form, 'Pt2Line1a_FamilyName',       ben.lastName);
  setText(form, 'Pt2Line1b_GivenName',        ben.firstName);
  setText(form, 'Pt2Line1c_MiddleName',       ben.middleName);

  setText(form, 'Pt2Line2_AlienNumber',       ben.aNumber);
  setText(form, 'Pt2Line3_SSN',               ben.ssn);
  setText(form, 'Pt2Line4_DateOfBirth',       fmtDate(ben.dob));

  setText(form, 'Pt2Line7_CityTownOfBirth',   ben.birthCity);
  setText(form, 'Pt2Line8_CountryOfBirth',    firstNonEmpty(ben.birthCountry, ben.countryBirth, ben.countryOfBirth, ben.nationality));
  setText(form, 'Pt2Line9_CountryofCitzOrNationality', firstNonEmpty(ben.citizenship, ben.nationality));

  setText(form, 'Pt2Line10a_FamilyName',      get(ben, 'otherNames[0].lastName'));
  setText(form, 'Pt2Line10b_GivenName',       get(ben, 'otherNames[0].firstName'));
  setText(form, 'Pt2Line10c_MiddleName',      get(ben, 'otherNames[0].middleName'));

  const benMail = pickAddress(ben.mailing);
  setText(form, 'Pt2Line11_StreetNumberName', benMail.street);
  setText(form, 'Pt2Line11_AptSteFlrNumber',  benMail.unitNum);
  setText(form, 'Pt2Line11_CityOrTown',       benMail.city);
  setText(form, 'Pt2Line11_State',            benMail.state);
  setText(form, 'Pt2Line11_ZipCode',          benMail.zip);
  setText(form, 'Pt2Line11_Province',         benMail.province);
  setText(form, 'Pt2Line11_PostalCode',       benMail.postal);
  setText(form, 'Pt2Line11_Country',          benMail.country);

  const benPhys0 = benSameAsMailing ? { ...benMail } : pickAddress(get(ben, 'physical[0]') || get(ben, 'physicalAddress'));
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

  setText(form, 'Pt2Line20_NameofEmployer',   get(ben, 'employment[1].employer'));
  setText(form, 'Pt2Line21_StreetNumberName', get(ben, 'employment[1].street'));
  setText(form, 'Pt2Line21_AptSteFlrNumber',  get(ben, 'employment[1].unitNum'));
  setText(form, 'Pt2Line21_CityOrTown',       get(ben, 'employment[1].city'));
  setText(form, 'Pt2Line21_State',            get(ben, 'employment[1].state'));
  setText(form, 'Pt2Line21_ZipCode',          get(ben, 'employment[1].zip'));
  setText(form, 'Pt2Line21_Province',         get(ben, 'employment[1].province'));
  setText(form, 'Pt2Line21_PostalCode',       get(ben, 'employment[1].postal'));
  setText(form, 'Pt2Line21_Country',          get(ben, 'employment[1].country'));
  setText(form, 'Pt2Line22_Occupation',       get(ben, 'employment[1].occupation'));
  setText(form, 'Pt2Line23a_DateFrom',        fmtDate(get(ben, 'employment[1].from')));
  setText(form, 'Pt2Line23b_ToFrom',          fmtDate(get(ben, 'employment[1].to')));
}

/** Light debug list */
export const I129F_DEBUG_FIELD_LIST = [
  'Pt1Line6a_FamilyName','Pt1Line6b_GivenName','Pt1Line6c_MiddleName',
  'Pt1Line7a_FamilyName','Pt1Line7b_GivenName','Pt1Line7c_MiddleName',
  'Pt1Line8_StreetNumberName','Pt1Line8_AptSteFlrNumber','Pt1Line8_CityOrTown',
  'Pt1Line8_State','Pt1Line8_ZipCode',
  'Pt1Line9_StreetNumberName','Pt1Line10a_DateFrom','Pt1Line10b_DateFrom',
  'Pt1Line13_NameofEmployer','Pt1Line14_StreetNumberName','Pt1Line15_Occupation',
  'Pt1Line16a_DateFrom','Pt1Line16b_ToFrom',
  'Pt1Line21_Sex','Pt1Line22_DateOfBirth','Pt1Line23_MaritalStatus',
  'Pt1Line24_CityTownOfBirth','Pt1Line25_ProvinceOrStateOfBirth','Pt1Line26_CountryOfBirth',
  // Parents quick-check
  'Pt1Line27a_FamilyName','Pt1Line27b_GivenName','Pt1Line27c_MiddleName',
  'Pt1Line28_DateOfBirth','Pt1Line29_CityTownOfBirth','Pt1Line30_CountryOfBirth',
  'Pt1Line31a_FamilyName','Pt1Line31b_GivenName','Pt1Line31c_MiddleName',
  'Pt1Line32_DateOfBirth','Pt1Line33_CityTownOfBirth','Pt1Line34_CountryOfBirth',
  // Part 2 subset
  'Pt2Line1a_FamilyName','Pt2Line1b_GivenName','Pt2Line1c_MiddleName',
  'Pt2Line2_AlienNumber','Pt2Line3_SSN','Pt2Line4_DateOfBirth',
  'Pt2Line7_CityTownOfBirth','Pt2Line8_CountryOfBirth','Pt2Line9_CountryofCitzOrNationality',
  'Pt2Line10a_FamilyName','Pt2Line10b_GivenName','Pt2Line10c_MiddleName',
  'Pt2Line11_StreetNumberName',
  'Pt2Line14_StreetNumberName','Pt2Line15a_DateFrom','Pt2Line15b_ToFrom',
  'Pt2Line16_NameofEmployer','Pt2Line17_StreetNumberName','Pt2Line18_Occupation',
  'Pt2Line19a_DateFrom','Pt2Line19b_ToFrom',
];
