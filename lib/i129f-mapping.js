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
 * Call from /api/i129f/pdf after you've loaded the saved row & PDF form.
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

  // Normalize data we will use
  const pet = saved.petitioner ?? {};
  const ben = saved.beneficiary ?? {};

  // Consolidation flags (use any that your UI might set)
  const petSameAsMailing =
    !!(pet.currentSameAsMailing || pet.physicalSameAsMailing || pet.sameAsMailing);

  const benSameAsMailing =
    !!(ben.currentSameAsMailing || ben.physicalSameAsMailing || ben.sameAsMailing);

  // -------- PART 1 — PETITIONER --------

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
  // If your PDF exposes a separate unit-type field (rare); otherwise UI consolidates it:
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

  // ---- NEW: Part 1 header items & personal details ----

  // 1–3. IDs at the very top of Part 1
  setText(form, 'Pt1Line1_AlienNumber',       get(pet, 'aNumber'));              // A-Number
  setText(form, 'Pt1Line2_AcctIdentifier',    get(pet, 'uscisOnlineAccount'));   // USCIS Online Account #
  setText(form, 'Pt1Line3_SSN',               get(pet, 'ssn'));                  // SSN

  // helper to try multiple checkbox/radiogroup names safely
  function tryCheck(names, on = true) {
    for (const name of [].concat(names || [])) {
      try { const cb = form.getCheckBox(name); on ? cb.check() : cb.uncheck(); return true; } catch {}
      try { const rg = form.getRadioGroup(name); if (on) rg.select('Yes'); return true; } catch {}
    }
    return false;
  }

  // 4. Petition type (K-1 vs K-3). value from UI: petitioner.petitionType = 'K1' | 'K3'
  const pType = (pet.petitionType || '').toUpperCase();
  if (pType === 'K1') {
    tryCheck(['Pt1Line4a_Checkboxes_p0_ch2', 'Pt1Line4a_K1', 'Pt1Line4_K1']);
  } else if (pType === 'K3') {
    tryCheck(['Pt1Line4a_Checkboxes_p0_ch3', 'Pt1Line4a_K3', 'Pt1Line4_K3']);
  }

  // 5. If K-3, “have you filed Form I-130?” (Yes/No)
  const k3Filed = pet.k3FiledI130; // true/false or 'yes'/'no'
  const k3Yes = (k3Filed === true || String(k3Filed).toLowerCase() === 'yes');
  const k3No  = (k3Filed === false || String(k3Filed).toLowerCase() === 'no');
  if (k3Yes) {
    tryCheck(['Pt1Line5_Yes','Pt1Line5_Y','Pt1Line5_Checkboxes_p0_ch1'], true);
    tryCheck(['Pt1Line5_No','Pt1Line5_N','Pt1Line5_Checkboxes_p0_ch2'], false);
  } else if (k3No) {
    tryCheck(['Pt1Line5_No','Pt1Line5_N','Pt1Line5_Checkboxes_p0_ch2'], true);
    tryCheck(['Pt1Line5_Yes','Pt1Line5_Y','Pt1Line5_Checkboxes_p0_ch1'], false);
  }

  // 21. Sex (checkbox/radio). pet.sex should be 'Male' | 'Female' | 'M' | 'F'
  const sex = String(pet.sex || '').toLowerCase();
  if (sex) {
    const isMale = (sex === 'male' || sex === 'm');
    const isFem  = (sex === 'female' || sex === 'f');
    if (isMale) {
      tryCheck(['Pt1Line21_Male','Pt1Line21_Checkboxes_p2_ch2','Pt1Line21_Sex_M','Pt1Line21_M']);
      tryCheck(['Pt1Line21_Female','Pt1Line21_Sex_F','Pt1Line21_F'], false);
    } else if (isFem) {
      tryCheck(['Pt1Line21_Female','Pt1Line21_Checkboxes_p2_ch3','Pt1Line21_Sex_F','Pt1Line21_F']);
      tryCheck(['Pt1Line21_Male','Pt1Line21_Sex_M','Pt1Line21_M'], false);
    }
  }

  // 22. Petitioner Date of Birth
  setText(form, 'Pt1Line22_DateOfBirth', fmtDate(pet.dob));

  // 23. Marital status (radio/checkbox/text). pet.maritalStatus: Single|Married|Divorced|Widowed
  (function() {
    const ms = String(pet.maritalStatus || '').toLowerCase();
    // try radio first
    try {
      const rg = form.getRadioGroup('Pt1Line23_MaritalStatus');
      const map = { single:'Single', married:'Married', divorced:'Divorced', widowed:'Widowed' };
      if (map[ms]) { rg.select(map[ms]); return; }
    } catch {}
    // try individual checkboxes
    const on = (label) => tryCheck([`Pt1Line23_${label}`, `Pt1Line23_${label}_cb`], true);
    const off = (label) => tryCheck([`Pt1Line23_${label}`, `Pt1Line23_${label}_cb`], false);
    ['Single','Married','Divorced','Widowed'].forEach(off);
    if (ms === 'single') on('Single');
    else if (ms === 'married') on('Married');
    else if (ms === 'divorced') on('Divorced');
    else if (ms === 'widowed') on('Widowed');
    // fallback: single text field in some PDFs
    if (ms) setText(form, 'Pt1Line23_MaritalStatus', pet.maritalStatus);
  })();

  // 24–26. Birth place
  setText(form, 'Pt1Line24_CityTownOfBirth',        pet.birthCity);
  setText(form, 'Pt1Line25_ProvinceOrStateOfBirth', pet.birthProvince);
  setText(form, 'Pt1Line26_CountryOfBirth',         pet.birthCountry);

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
  // ⛔ Per your instruction: DO NOT populate "In Care Of" for beneficiary
  // setText(form, 'Pt2Line11_InCareOfName',   benMail.inCareOf);
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
    : pickAddress(get(ben, 'physical[0]'));

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

  // New quick checks
  'Pt1Line1_AlienNumber','Pt1Line2_AcctIdentifier','Pt1Line3_SSN',
  'Pt1Line22_DateOfBirth','Pt1Line24_CityTownOfBirth','Pt1Line26_CountryOfBirth',

  'Pt2Line1a_FamilyName','Pt2Line1b_GivenName','Pt2Line1c_MiddleName',
  'Pt2Line2_AlienNumber','Pt2Line3_SSN','Pt2Line4_DateOfBirth',
  'Pt2Line7_CityTownOfBirth','Pt2Line8_CountryOfBirth','Pt2Line9_CountryofCitzOrNationality',
  'Pt2Line10a_FamilyName','Pt2Line10b_GivenName','Pt2Line10c_MiddleName',
  'Pt2Line11_StreetNumberName', // note: no InCareOf for beneficiary per your spec
  'Pt2Line14_StreetNumberName','Pt2Line15a_DateFrom','Pt2Line15b_ToFrom',
  'Pt2Line16_NameofEmployer','Pt2Line17_StreetNumberName','Pt2Line18_Occupation',
  'Pt2Line19a_DateFrom','Pt2Line19b_ToFrom',
];
