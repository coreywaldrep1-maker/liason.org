// lib/i129f-mapping.js
// Unified mapping for pdf-lib Form fill — covers Parts 1–8.
// Compatible with your existing data shape (saved.petitioner, saved.beneficiary, etc.).

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
    if (typeof v === 'string' && /^\d{1,2}\/\d{1,2}\/(\d{2}|\d{4})$/.test(v)) {
      return v;
    }
    const d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yy = d.getFullYear();
    return `${mm}/${dd}/${yy}`;
  } catch {
    return String(v);
  }
}

/* ===== pdf-lib helpers ===== */
function setText1(form, name, value) {
  try { form.getTextField(name).setText(value ?? ''); return true; } catch { return false; }
}
function check1(form, name, on = true) {
  try { const cb = form.getCheckBox(name); on ? cb.check() : cb.uncheck(); return true; } catch { return false; }
}
function setManyText(form, names, value) {
  let ok = false; for (const n of names) ok = setText1(form, n, value) || ok; return ok;
}
function setManyChecks(form, names, on) {
  let ok = false; for (const n of names) ok = check1(form, n, on) || ok; return ok;
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

export function applyI129fMapping(saved, form) {
  if (!saved) return;

  const pet = saved.petitioner ?? {};
  const ben = saved.beneficiary ?? {};

  const petSameAsMailing =
    !!(pet.currentSameAsMailing || pet.physicalSameAsMailing || pet.sameAsMailing || saved?.mailing?.sameAsPhysical);
  const benSameAsMailing =
    !!(ben.currentSameAsMailing || ben.physicalSameAsMailing || ben.sameAsMailing);

  /* ===== Part 1 — Lines 1–3 ===== */
  setManyText(form, ['Pt1Line1_AlienNumber','Pt1_A_Number','A_Number'], pet.aNumber);
  setManyText(form, ['Pt1Line2_AcctIdentifier','Pt1_OnlineAcct','Online_Account'], pet.uscisOnlineAccount);
  setManyText(form, ['Pt1Line3_SSN','Pt1_SSN','SSN'], pet.ssn);

  /* ===== Part 1 — Line 4/5 ===== */
  const cls = (saved?.classification?.type || saved?.classification || '').toLowerCase();
  const k3Filed = (saved?.classification?.i130Filed || saved?.k3FiledI130 || '').toLowerCase();
  setManyChecks(form, ['Pt1Line4a_K1','Pt1_Line4a_Fiance','Line4_K1'], cls === 'k1');
  setManyChecks(form, ['Pt1Line4a_K3','Pt1_Line4a_Spouse','Line4_K3'], cls === 'k3');
  setManyChecks(form, ['Pt1Line5_Yes','Line5_I130_Yes'], cls === 'k3' && k3Filed === 'yes');
  setManyChecks(form, ['Pt1Line5_No','Line5_I130_No'],  cls === 'k3' && k3Filed === 'no');

  /* ===== Part 1 — Names ===== */
  setText1(form, 'Pt1Line6a_FamilyName',  pet.lastName);
  setText1(form, 'Pt1Line6b_GivenName',   pet.firstName);
  setText1(form, 'Pt1Line6c_MiddleName',  pet.middleName);
  setText1(form, 'Pt1Line7a_FamilyName',  get(pet,'otherNames[0].lastName'));
  setText1(form, 'Pt1Line7b_GivenName',   get(pet,'otherNames[0].firstName'));
  setText1(form, 'Pt1Line7c_MiddleName',  get(pet,'otherNames[0].middleName'));

  /* ===== Part 1 — Mailing ===== */
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

  /* ===== Part 1 — Physical addresses ===== */
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

  /* ===== Part 1 — Other Info ===== */
  const sex = (pet.sex || '').toLowerCase();
  setManyChecks(form, ['Pt1Line21_Male','Line21_Male'], sex === 'male');
  setManyChecks(form, ['Pt1Line21_Female','Line21_Female'], sex === 'female');
  setManyText(form, ['Pt1Line22_DateOfBirth','Line22_DOB'], fmtDate(pet.dob));
  const ms = (pet.maritalStatus || '').toLowerCase();
  setManyChecks(form, ['Pt1Line23_Single','Line23_Single'], ms === 'single');
  setManyChecks(form, ['Pt1Line23_Married','Line23_Married'], ms === 'married');
  setManyChecks(form, ['Pt1Line23_Divorced','Line23_Divorced'], ms === 'divorced');
  setManyChecks(form, ['Pt1Line23_Widowed','Line23_Widowed'], ms === 'widowed');
  setManyText(form, ['Pt1Line24_CityTownOfBirth','Line24_City'], pet.cityBirth);
  setManyText(form, ['Pt1Line25_ProvinceOrStateOfBirth','Line25_ProvinceState'], pet.provinceBirth || pet.birthProvinceState);
  setManyText(form, ['Pt1Line26_CountryOfBirth','Line26_Country'], pet.countryBirth);

  /* ===== Part 2 — Beneficiary ===== */
  setText1(form, 'Pt2Line1a_FamilyName',       ben.lastName);
  setText1(form, 'Pt2Line1b_GivenName',        ben.firstName);
  setText1(form, 'Pt2Line1c_MiddleName',       ben.middleName);
  setText1(form, 'Pt2Line2_AlienNumber',       ben.aNumber);
  setText1(form, 'Pt2Line3_SSN',               ben.ssn);
  setManyText(form, ['Pt2Line4_DateOfBirth','Pt2Line4_DOB'], fmtDate(ben.dob));
  setText1(form, 'Pt2Line7_CityTownOfBirth',   ben.birthCity || ben.cityBirth);
  setText1(form, 'Pt2Line8_CountryOfBirth',    ben.birthCountry || ben.countryBirth);
  setText1(form, 'Pt2Line9_CountryofCitzOrNationality', ben.citizenship || ben.nationality);
  setText1(form, 'Pt2Line10a_FamilyName',      get(ben,'otherNames[0].lastName'));
  setText1(form, 'Pt2Line10b_GivenName',       get(ben,'otherNames[0].firstName'));
  setText1(form, 'Pt2Line10c_MiddleName',      get(ben,'otherNames[0].middleName'));

  const benMail = pickAddress(ben.mailing);
  setText1(form, 'Pt2Line11_StreetNumberName', benMail.street);
  setText1(form, 'Pt2Line11_AptSteFlrNumber',  benMail.unitNum);
  setText1(form, 'Pt2Line11_CityOrTown',       benMail.city);
  setText1(form, 'Pt2Line11_State',            benMail.state);
  setText1(form, 'Pt2Line11_ZipCode',          benMail.zip);
  setText1(form, 'Pt2Line11_Province',         benMail.province);
  setText1(form, 'Pt2Line11_PostalCode',       benMail.postal);
  setText1(form, 'Pt2Line11_Country',          benMail.country);

  const benPhys0 = benSameAsMailing ? { ...benMail } : (pickAddress(get(ben,'physical[0]')) || pickAddress(get(ben,'physicalAddress')));
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

  /* ===== Part 3 — Other Information ===== */
  const p3 = saved.part3 || saved.otherInfo || {};
  setManyChecks(form, ['Pt3_MetInPerson_Yes','Part3_Met_Yes'], String(p3.metInPerson).toLowerCase()==='yes' || p3.metInPerson === true);
  setManyChecks(form, ['Pt3_MetInPerson_No','Part3_Met_No'],   String(p3.metInPerson).toLowerCase()==='no'  || p3.metInPerson === false);
  // Add more Part 3 fields here if your PDF exposes them via /api/i129f/fields.

  /* ===== Part 4 — Biographic Information ===== */
  const bio = saved.biographic || saved.part4 || {};
  const eth = (bio.ethnicity || '').toLowerCase();
  setManyChecks(form, ['Pt4_Ethnicity_Hispanic','Part4_Ethnicity_p0_ch1'], eth === 'hispanic' || eth === 'latino');
  setManyChecks(form, ['Pt4_Ethnicity_NotHispanic','Part4_Ethnicity_p0_ch2'], eth.includes('not'));
  const race = (bio.race || '').toLowerCase();
  setManyChecks(form, ['Pt4_Race_White'], race === 'white');
  setManyChecks(form, ['Pt4_Race_Black'], race.includes('black') || race.includes('african'));
  setManyChecks(form, ['Pt4_Race_Asian'], race === 'asian');
  setManyChecks(form, ['Pt4_Race_AIAN'],  race.includes('ameri
