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

/** Try a *list* of candidate text field names, set the first that exists */
function setFirstText(form, names = [], value) {
  for (const n of names) {
    try {
      const tf = form.getTextField(n);
      tf.setText(value ?? '');
      return true;
    } catch {}
  }
  return false;
}

/** For radio/checkbox “one of” pairs: check the first name that exists */
function checkFirst(form, names = [], on = true) {
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

/**
 * Main mapper: write from saved JSON -> PDF AcroForm
 *
 * Notes per your request:
 * - Do NOT set "In Care Of" for the Beneficiary mailing address (Pt2 Line 11).
 * - If "current/physical address same as mailing", copy mailing values into those fields
 *   (so the user doesn't have to re-enter and we don't need extra form fields).
 * - "Apt/Ste/Flr" is handled in the WEB UI as a dropdown; here we only write the
 *   concatenated unit number or the available PDF field if present.
 */
export function applyI129fMapping(saved, form) {
  if (!saved) return;

  // Normalize sections we will use
  const pet = saved.petitioner ?? {};
  const ben = saved.beneficiary ?? {};

  // Consolidation flags (use any that your UI might set)
  const petSameAsMailing =
    !!(pet.currentSameAsMailing || pet.physicalSameAsMailing || pet.sameAsMailing);
  const benSameAsMailing =
    !!(ben.currentSameAsMailing || ben.physicalSameAsMailing || ben.sameAsMailing);

  // ===== PART 1 — PETITIONER (TOP OF PAGE) =====
  // These were reported as not transferring; write them with robust field-name fallbacks.
  setFirstText(form, [
    'Pt1Line1_AlienNumber', 'Pt1_Line1_AlienNumber', 'Part1_Line1_A-Number', 'A_Number_Pt1'
  ], get(pet, 'aNumber'));

  setFirstText(form, [
    'Pt1Line2_AcctIdentifier', 'Pt1_Line2_AcctIdentifier', 'USCIS_Online_Acct_Pt1', 'USCISOnlineAccount_Pt1'
  ], get(pet, 'uscisOnlineAccount'));

  setFirstText(form, [
    'Pt1Line3_SSN', 'Pt1_Line3_SSN', 'SSN_Pt1'
  ], get(pet, 'ssn'));

  // ----- K-1 / K-3 selection + I-130 filed (if K-3) -----
  // Expecting your site to store: saved.classification = 'K1' | 'K3'
  // and saved.i130Filed = true/false (only meaningful if K3).
  const classification = (saved.classification || pet.classification || '').toUpperCase();
  const isK1 = classification === 'K1';
  const isK3 = classification === 'K3';

  // “Select one box below…” (two checkboxes or radios on most PDFs)
  // Try several common field ids for each:
  if (isK1) {
    checkFirst(form, [
      'Pt1Line4a_Checkboxes_p0_ch0', // common
      'Pt1Line4a_Checkboxes_p0_ch2', // name you saw
      'K1_Check', 'K1Visa', 'Part1_K1'
    ], true);
  }
  if (isK3) {
    checkFirst(form, [
      'Pt1Line4a_Checkboxes_p0_ch1',
      'Pt1Line4a_Checkboxes_p0_ch3',
      'K3_Check', 'K3Visa', 'Part1_K3'
    ], true);
  }

  // Q5: If K-3, “Have you filed Form I-130? Yes / No”
  const i130Filed = !!(saved.i130Filed ?? pet.i130Filed);
  if (isK3) {
    if (i130Filed) {
      checkFirst(form, ['Pt1Line5_Yes', 'Pt1Line5_Y', 'K3_I130_Yes', 'Part1_Q5_Yes'], true);
      checkFirst(form, ['Pt1Line5_No',  'Pt1Line5_N', 'K3_I130_No',  'Part1_Q5_No' ], false);
    } else {
      checkFirst(form, ['Pt1Line5_No',  'Pt1Line5_N', 'K3_I130_No',  'Part1_Q5_No' ], true);
      checkFirst(form, ['Pt1Line5_Yes', 'Pt1Line5_Y', 'K3_I130_Yes', 'Part1_Q5_Yes'], false);
    }
  }

  // ===== PART 1 — PETITIONER LEGAL NAME =====
  setText(form, 'Pt1Line6a_FamilyName',  get(pet, 'lastName'));
  setText(form, 'Pt1Line6b_GivenName',   get(pet, 'firstName'));
  setText(form, 'Pt1Line6c_MiddleName',  get(pet, 'middleName'));

  // Other Names (first alias)
  setText(form, 'Pt1Line7a_FamilyName',  get(pet, 'otherNames[0].lastName'));
  setText(form, 'Pt1Line7b_GivenName',   get(pet, 'otherNames[0].firstName'));
  setText(form, 'Pt1Line7c_MiddleName',  get(pet, 'otherNames[0].middleName'));

  // ===== PART 1 — MAILING ADDRESS (Line 8) =====
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

  // ===== PART 1 — PHYSICAL ADDRESS HISTORY (Lines 9–12) =====
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

  // ===== PART 1 — EMPLOYMENT =====
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

  // ===== PART 1 — “OTHER INFORMATION” BLOCK (your reported missing transfers) =====
  // Sex (male/female checkboxes)
  const sex = (pet.sex || '').toLowerCase();
  if (sex === 'male' || sex === 'm') {
    checkFirst(form, ['Pt1Line21_Sex_Male', 'Pt1Line21_Checkboxes_p2_ch0', 'Sex_Male_Pt1'], true);
    checkFirst(form, ['Pt1Line21_Sex_Female', 'Pt1Line21_Checkboxes_p2_ch1', 'Sex_Female_Pt1'], false);
  } else if (sex === 'female' || sex === 'f') {
    checkFirst(form, ['Pt1Line21_Sex_Female', 'Pt1Line21_Checkboxes_p2_ch1', 'Sex_Female_Pt1'], true);
    checkFirst(form, ['Pt1Line21_Sex_Male', 'Pt1Line21_Checkboxes_p2_ch0', 'Sex_Male_Pt1'], false);
  }

  // Petitioner DOB
  setFirstText(form, ['Pt1Line22_DateOfBirth', 'Pt1Line22_Date_of_Birth', 'DOB_Pt1', 'Pt1_DOB'],
    fmtDate(pet.dob));

  // Marital status (single, married, divorced, widowed) – various possible ids
  const ms = (pet.maritalStatus || '').toLowerCase();
  const mark = (yesNames, noNames) => {
    checkFirst(form, yesNames, true);
    (noNames || []).forEach(n => checkFirst(form, [n], false));
  };
  if (['single','never married','never-married'].includes(ms)) {
    mark(['Pt1Line23_Single','Marital_Single_Pt1','Pt1_MS_Single']);
  } else if (ms === 'married') {
    mark(['Pt1Line23_Married','Marital_Married_Pt1','Pt1_MS_Married']);
  } else if (ms === 'divorced') {
    mark(['Pt1Line23_Divorced','Marital_Divorced_Pt1','Pt1_MS_Divorced']);
  } else if (ms === 'widowed') {
    mark(['Pt1Line23_Widowed','Marital_Widowed_Pt1','Pt1_MS_Widowed']);
  }

  // City/Province already worked for you; Country of Birth was not
  setFirstText(form, ['Pt1Line24_CityTownOfBirth','Pt1Line24_City_Town_Of_Birth','Pt1_CityBirth'],
    get(pet, 'birthCity'));
  setFirstText(form, ['Pt1Line25_ProvinceOrStateOfBirth','Pt1_ProvinceBirth','Pt1_StateBirth'],
    get(pet, 'birthProvince'));
  setFirstText(form, ['Pt1Line26_CountryOfBirth','Pt1_CountryBirth','Country_of_Birth_Pt1'],
    get(pet, 'birthCountry') || get(pet, 'countryOfBirth') || get(pet, 'nationality'));

  // ===== PART 2 — BENEFICIARY =====

  // Legal name
  setText(form, 'Pt2Line1a_FamilyName',       get(ben, 'lastName'));
  setText(form, 'Pt2Line1b_GivenName',        get(ben, 'firstName'));
  setText(form, 'Pt2Line1c_MiddleName',       get(ben, 'middleName'));

  setText(form, 'Pt2Line2_AlienNumber',       get(ben, 'aNumber'));
  setText(form, 'Pt2Line3_SSN',               get(ben, 'ssn'));
  setText(form, 'Pt2Line4_DateOfBirth',       fmtDate(get(ben, 'dob')));

  setText(form, 'Pt2Line7_CityTownOfBirth',   get(ben, 'birthCity'));
  setText(form, 'Pt2Line8_CountryOfBirth',    get(ben, 'birthCountry'));
  setText(form, 'Pt2Line9_CountryofCitzOrNationality', get(ben, 'citizenship') || get(ben, 'nationality'));

  // Other names used (first alias)
  setText(form, 'Pt2Line10a_FamilyName',      get(ben, 'otherNames[0].lastName'));
  setText(form, 'Pt2Line10b_GivenName',       get(ben, 'otherNames[0].firstName'));
  setText(form, 'Pt2Line10c_MiddleName',      get(ben, 'otherNames[0].middleName'));

  // Beneficiary mailing address (Pt2 Line 11) – no InCareOf per spec
  const benMail = pickAddress(ben.mailing);
  setText(form, 'Pt2Line11_StreetNumberName', benMail.street);
  setText(form, 'Pt2Line11_AptSteFlrNumber',  benMail.unitNum);
  setText(form, 'Pt2Line11_CityOrTown',       benMail.city);
  setText(form, 'Pt2Line11_State',            benMail.state);
  setText(form, 'Pt2Line11_ZipCode',          benMail.zip);
  setText(form, 'Pt2Line11_Province',         benMail.province);
  setText(form, 'Pt2Line11_PostalCode',       benMail.postal);
  setText(form, 'Pt2Line11_Country',          benMail.country);

  // Beneficiary CURRENT/physical address (Pt2 Line 14 + dates 15)
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

  // Beneficiary employment #1 & #2
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

/** Optional list the /all-fields page can display */
export const I129F_DEBUG_FIELD_LIST = [
  'Pt1Line6a_FamilyName','Pt1Line6b_GivenName','Pt1Line6c_MiddleName',
  'Pt1Line7a_FamilyName','Pt1Line7b_GivenName','Pt1Line7c_MiddleName',
  'Pt1Line8_StreetNumberName','Pt1Line8_AptSteFlrNumber','Pt1Line8_CityOrTown',
  'Pt1Line8_State','Pt1Line8_ZipCode',
  'Pt1Line9_StreetNumberName','Pt1Line10a_DateFrom','Pt1Line10b_DateFrom',
  'Pt1Line13_NameofEmployer','Pt1Line14_StreetNumberName','Pt1Line15_Occupation',
  'Pt1Line16a_DateFrom','Pt1Line16b_ToFrom',
  'Pt2Line1a_FamilyName','Pt2Line1b_GivenName','Pt2Line1c_MiddleName',
  'Pt2Line2_AlienNumber','Pt2Line3_SSN','Pt2Line4_DateOfBirth',
  'Pt2Line7_CityTownOfBirth','Pt2Line8_CountryOfBirth','Pt2Line9_CountryofCitzOrNationality',
  'Pt2Line10a_FamilyName','Pt2Line10b_GivenName','Pt2Line10c_MiddleName',
  'Pt2Line11_StreetNumberName',
  'Pt2Line14_StreetNumberName','Pt2Line15a_DateFrom','Pt2Line15b_ToFrom',
  'Pt2Line16_NameofEmployer','Pt2Line17_StreetNumberName','Pt2Line18_Occupation',
  'Pt2Line19a_DateFrom','Pt2Line19b_ToFrom',
];
