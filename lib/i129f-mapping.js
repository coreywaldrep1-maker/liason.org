// lib/i129f-mapping.js

/** ---------- tiny utils ---------- */
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

function setText(form, pdfFieldName, value) {
  if (!pdfFieldName) return;
  try { form.getTextField(pdfFieldName).setText(value ?? ''); } catch {}
}
function checkBox(form, name, on = true) {
  try { const cb = form.getCheckBox(name); on ? cb.check() : cb.uncheck(); } catch {}
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

/** ---------- main mapper ---------- */
export function applyI129fMapping(saved, form) {
  if (!saved) return;

  const pet = saved.petitioner ?? {};
  const ben = saved.beneficiary ?? {};

  // Flags users might set in UI
  const petSameAsMailing = !!(pet.currentSameAsMailing || pet.physicalSameAsMailing || saved.mailing?.sameAsPhysical);
  const benSameAsMailing = !!(ben.currentSameAsMailing || ben.physicalSameAsMailing);

  /* ---------- NEW: Part 1 lines 1–5 (A#, acct, SSN, K-1/K-3 + I-130) ---------- */
  setText(form, 'Pt1Line1_AlienNumber', get(pet, 'aNumber'));
  setText(form, 'Pt1Line2_AcctIdentifier', get(pet, 'uscisOnlineAccount'));
  setText(form, 'Pt1Line3_SSN', get(pet, 'ssn'));

  // classification: 'k1' or 'k3' (we set both candidates defensively)
  const classif = (saved.classification || pet.classification || '').toLowerCase();
  checkBox(form, 'Pt1Line4a_Checkboxes_p0_ch2', classif === 'k1');
  checkBox(form, 'Pt1Line4b_Checkboxes_p0_ch2', classif === 'k3'); // some PDFs use 4b; harmless if absent

  // If K-3, “have you filed I-130?” (Yes/No)
  const filedI130 = !!(saved.k3FiledI130 ?? pet.k3FiledI130);
  // Commonly “_ch2” = Yes and “_ch3” = No on USCIS PDFs
  checkBox(form, 'Pt1Line5_Checkboxes_p0_ch2', classif === 'k3' && filedI130 === true);
  checkBox(form, 'Pt1Line5_Checkboxes_p0_ch3', classif === 'k3' && filedI130 === false);

  /* ---------- NEW: Part 1 “Other Information” (21–26) ---------- */
  // 21 Sex — try two common checkbox ids
  const sex = (pet.sex || '').toLowerCase(); // 'm'|'male' or 'f'|'female'
  const isMale = sex === 'm' || sex === 'male';
  const isFemale = sex === 'f' || sex === 'female';
  checkBox(form, 'Pt1Line21_Checkbox_p2_ch2', isMale);
  checkBox(form, 'Pt1Line21_Checkboxes_p2_ch3', isFemale);

  // 22 DOB
  setText(form, 'Pt1Line22_DateofBirth', fmtDate(pet.dob));

  // 23 Marital status — map to several possible checkbox slots
  const ms = (pet.maritalStatus || '').toLowerCase(); // 'single'|'married'|'divorced'|'widowed'
  checkBox(form, 'Pt1Line23_Checkbox_p2_ch2', ms === 'single');
  checkBox(form, 'Pt1Line23_Checkbox_p2_ch3', ms === 'married');
  checkBox(form, 'Pt1Line23_Checkbox_p2_ch4', ms === 'divorced');
  checkBox(form, 'Pt1Line23_Checkbox_p2_ch5', ms === 'widowed');

  // 24–26 Birth details
  setText(form, 'Pt1Line24_CityTownOfBirth', pet.birthCity || get(pet,'cityBirth'));
  setText(form, 'Pt1Line25_ProvinceOrStateOfBirth', pet.birthProvinceState || get(pet,'stateBirth') || get(pet,'provinceBirth'));
  setText(form, 'Pt1Line26_CountryOfCitzOrNationality', pet.birthCountry || get(pet,'countryBirth'));

  /* ---------- Part 1 legal names (already present) ---------- */
  setText(form, 'Pt1Line6a_FamilyName',  get(pet, 'lastName'));
  setText(form, 'Pt1Line6b_GivenName',   get(pet, 'firstName'));
  setText(form, 'Pt1Line6c_MiddleName',  get(pet, 'middleName'));

  setText(form, 'Pt1Line7a_FamilyName',  get(pet, 'otherNames[0].lastName'));
  setText(form, 'Pt1Line7b_GivenName',   get(pet, 'otherNames[0].firstName'));
  setText(form, 'Pt1Line7c_MiddleName',  get(pet, 'otherNames[0].middleName'));

  /* ---------- Mailing & physical (as before) ---------- */
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

  /* ---------- Employment (as before) ---------- */
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

  /* ---------- NEW: Parents (page 3) ---------- */
  const p0 = (pet.parents && pet.parents[0]) || {};
  const p1 = (pet.parents && pet.parents[1]) || {};

  // Parent #1
  setText(form, 'Pt1Line27a_FamilyName', p0.lastName || '');
  setText(form, 'Pt1Line27b_GivenName',  p0.firstName || '');
  setText(form, 'Pt1Line27c_MiddleName', p0.middleName || '');
  setText(form, 'Pt1Line28_DateofBirth', fmtDate(p0.dob));
  const p0Sex = (p0.sex || '').toLowerCase();
  checkBox(form, 'Pt1Line29_Checkbox_p2_ch2', p0Sex === 'm' || p0Sex === 'male');
  checkBox(form, 'Pt1Line29_Checkboxes_p2_ch3', p0Sex === 'f' || p0Sex === 'female');
  setText(form, 'Pt1Line30_CountryOfCitzOrNationality', p0.countryBirth || p0.nationality || '');
  // (Residence fields exist but your UI doesn’t collect them; skipping is fine.)

  // Parent #2
  setText(form, 'Pt1Line32a_FamilyName', p1.lastName || '');
  setText(form, 'Pt1Line32b_GivenName',  p1.firstName || '');
  setText(form, 'Pt1Line32c_MiddleName', p1.middleName || '');
  setText(form, 'Pt1Line33_DateofBirth', fmtDate(p1.dob));
  const p1Sex = (p1.sex || '').toLowerCase();
  checkBox(form, 'Pt1Line34_Checkbox_p2_ch2', p1Sex === 'm' || p1Sex === 'male');
  checkBox(form, 'Pt1Line34_Checkboxes_p2_ch3', p1Sex === 'f' || p1Sex === 'female');
  setText(form, 'Pt1Line35_CountryOfCitzOrNationality', p1.countryBirth || p1.nationality || '');

  /* ---------- Part 2 (beneficiary) – unchanged from your working bits ---------- */
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

/** For your /all-fields debug page (optional) */
export const I129F_DEBUG_FIELD_LIST = [
  'Pt1Line1_AlienNumber','Pt1Line2_AcctIdentifier','Pt1Line3_SSN',
  'Pt1Line4a_Checkboxes_p0_ch2','Pt1Line5_Checkboxes_p0_ch2','Pt1Line5_Checkboxes_p0_ch3',
  'Pt1Line21_Checkbox_p2_ch2','Pt1Line22_DateofBirth','Pt1Line23_Checkbox_p2_ch2','Pt1Line24_CityTownOfBirth',
  'Pt1Line27a_FamilyName','Pt1Line28_DateofBirth','Pt1Line29_Checkbox_p2_ch2',
  'Pt1Line32a_FamilyName','Pt1Line33_DateofBirth','Pt1Line34_Checkbox_p2_ch2',
  'Pt2Line1a_FamilyName','Pt2Line4_DateOfBirth'
];
