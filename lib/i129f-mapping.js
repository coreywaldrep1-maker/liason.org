// lib/i129f-mapping.js
// Safer mapping for pdf-lib Form fill — Parts 1–8.
// - Never calls .toLowerCase() on non-strings
// - Handles arrays/objects gracefully

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

const toStr = (v) => (v == null ? '' : String(v));
const low = (v) => toStr(v).toLowerCase();
const firstOr = (v, d = '') => (Array.isArray(v) ? (v[0] ?? d) : (v ?? d));
const lowArr = (v) => (Array.isArray(v) ? v.map(low) : [low(v)]);

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
    inCareOf: src?.inCareOf ?? '',
    street: src?.street ?? '',
    unitNum: src?.unitNum ?? '',
    unitType: src?.unitType ?? '',
    city: src?.city ?? '',
    state: src?.state ?? '',
    zip: src?.zip ?? '',
    province: src?.province ?? '',
    postal: src?.postal ?? '',
    country: src?.country ?? '',
    from: src?.from ?? '',
    to: src?.to ?? '',
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
  setManyText(form, ['Pt1Line1_AlienNumber','Pt1_A_Number','A_Number'], toStr(pet.aNumber));
  setManyText(form, ['Pt1Line2_AcctIdentifier','Pt1_OnlineAcct','Online_Account'], toStr(pet.uscisOnlineAccount));
  setManyText(form, ['Pt1Line3_SSN','Pt1_SSN','SSN'], toStr(pet.ssn));

  /* ===== Part 1 — Line 4/5 (classification) ===== */
  const clsRaw = (saved?.classification?.type ?? (typeof saved?.classification === 'string' ? saved.classification : ''));
  const cls = low(clsRaw);
  const k3Filed = low(saved?.classification?.i130Filed ?? saved?.k3FiledI130 ?? '');
  setManyChecks(form, ['Pt1Line4a_K1','Pt1_Line4a_Fiance','Line4_K1'], cls === 'k1');
  setManyChecks(form, ['Pt1Line4a_K3','Pt1_Line4a_Spouse','Line4_K3'], cls === 'k3');
  setManyChecks(form, ['Pt1Line5_Yes','Line5_I130_Yes'], cls === 'k3' && k3Filed === 'yes');
  setManyChecks(form, ['Pt1Line5_No','Line5_I130_No'],  cls === 'k3' && k3Filed === 'no');

  /* ===== Part 1 — Names ===== */
  setText1(form, 'Pt1Line6a_FamilyName',  toStr(pet.lastName));
  setText1(form, 'Pt1Line6b_GivenName',   toStr(pet.firstName));
  setText1(form, 'Pt1Line6c_MiddleName',  toStr(pet.middleName));
  setText1(form, 'Pt1Line7a_FamilyName',  toStr(get(pet,'otherNames[0].lastName')));
  setText1(form, 'Pt1Line7b_GivenName',   toStr(get(pet,'otherNames[0].firstName')));
  setText1(form, 'Pt1Line7c_MiddleName',  toStr(get(pet,'otherNames[0].middleName')));

  /* ===== Part 1 — Mailing ===== */
  const petMail = pickAddress(saved.mailing ?? pet.mailing);
  setManyText(form, ['Pt1Line8_InCareofName'],      toStr(petMail.inCareOf));
  setManyText(form, ['Pt1Line8_StreetNumberName'],  toStr(petMail.street));
  setManyText(form, ['Pt1Line8_AptSteFlrNumber'],   toStr(petMail.unitNum));
  setManyText(form, ['Pt1Line8_CityOrTown'],        toStr(petMail.city));
  setManyText(form, ['Pt1Line8_State'],             toStr(petMail.state));
  setManyText(form, ['Pt1Line8_ZipCode'],           toStr(petMail.zip));
  setManyText(form, ['Pt1Line8_Province'],          toStr(petMail.province));
  setManyText(form, ['Pt1Line8_PostalCode'],        toStr(petMail.postal));
  setManyText(form, ['Pt1Line8_Country'],           toStr(petMail.country));
  setManyText(form, ['Pt1Line8_Unit_p0_ch3'],       toStr(petMail.unitType));

  /* ===== Part 1 — Physical addresses ===== */
  const petPhys0 = petSameAsMailing ? { ...petMail } : pickAddress(get(saved, 'physicalAddresses[0]'));
  setManyText(form, ['Pt1Line9_StreetNumberName'],  toStr(petPhys0.street));
  setManyText(form, ['Pt1Line9_AptSteFlrNumber'],   toStr(petPhys0.unitNum));
  setManyText(form, ['Pt1Line9_CityOrTown'],        toStr(petPhys0.city));
  setManyText(form, ['Pt1Line9_State'],             toStr(petPhys0.state));
  setManyText(form, ['Pt1Line9_ZipCode'],           toStr(petPhys0.zip));
  setManyText(form, ['Pt1Line9_Province'],          toStr(petPhys0.province));
  setManyText(form, ['Pt1Line9_PostalCode'],        toStr(petPhys0.postal));
  setManyText(form, ['Pt1Line9_Country'],           toStr(petPhys0.country));
  setManyText(form, ['Pt1Line10a_DateFrom'],        fmtDate(petPhys0.from));
  setManyText(form, ['Pt1Line10b_DateFrom'],        fmtDate(petPhys0.to));

  const petPhys1 = pickAddress(get(saved, 'physicalAddresses[1]'));
  setManyText(form, ['Pt1Line11_StreetNumberName'], toStr(petPhys1.street));
  setManyText(form, ['Pt1Line11_AptSteFlrNumber'],  toStr(petPhys1.unitNum));
  setManyText(form, ['Pt1Line11_CityOrTown'],       toStr(petPhys1.city));
  setManyText(form, ['Pt1Line11_State'],            toStr(petPhys1.state));
  setManyText(form, ['Pt1Line11_ZipCode'],          toStr(petPhys1.zip));
  setManyText(form, ['Pt1Line11_Province'],         toStr(petPhys1.province));
  setManyText(form, ['Pt1Line11_PostalCode'],       toStr(petPhys1.postal));
  setManyText(form, ['Pt1Line11_Country'],          toStr(petPhys1.country));
  setManyText(form, ['Pt1Line12a_DateFrom'],        fmtDate(petPhys1.from));
  setManyText(form, ['Pt1Line12b_ToFrom'],          fmtDate(petPhys1.to));

  /* ===== Part 1 — Other Info ===== */
  const sex = low(pet.sex);
  setManyChecks(form, ['Pt1Line21_Male','Line21_Male'], sex === 'male');
  setManyChecks(form, ['Pt1Line21_Female','Line21_Female'], sex === 'female');
  setManyText(form, ['Pt1Line22_DateOfBirth','Line22_DOB'], fmtDate(pet.dob));
  const ms = low(pet.maritalStatus);
  setManyChecks(form, ['Pt1Line23_Single','Line23_Single'], ms === 'single');
  setManyChecks(form, ['Pt1Line23_Married','Line23_Married'], ms === 'married');
  setManyChecks(form, ['Pt1Line23_Divorced','Line23_Divorced'], ms === 'divorced');
  setManyChecks(form, ['Pt1Line23_Widowed','Line23_Widowed'], ms === 'widowed');
  setManyText(form, ['Pt1Line24_CityTownOfBirth','Line24_City'], toStr(pet.cityBirth));
  setManyText(form, ['Pt1Line25_ProvinceOrStateOfBirth','Line25_ProvinceState'], toStr(pet.provinceBirth || pet.birthProvinceState));
  setManyText(form, ['Pt1Line26_CountryOfBirth','Line26_Country'], toStr(pet.countryBirth));

  /* ===== Part 2 — Beneficiary ===== */
  setText1(form, 'Pt2Line1a_FamilyName',       toStr(ben.lastName));
  setText1(form, 'Pt2Line1b_GivenName',        toStr(ben.firstName));
  setText1(form, 'Pt2Line1c_MiddleName',       toStr(ben.middleName));
  setText1(form, 'Pt2Line2_AlienNumber',       toStr(ben.aNumber));
  setText1(form, 'Pt2Line3_SSN',               toStr(ben.ssn));
  setManyText(form, ['Pt2Line4_DateOfBirth','Pt2Line4_DOB'], fmtDate(ben.dob));
  setText1(form, 'Pt2Line7_CityTownOfBirth',   toStr(ben.birthCity || ben.cityBirth));
  setText1(form, 'Pt2Line8_CountryOfBirth',    toStr(ben.birthCountry || ben.countryBirth));
  setText1(form, 'Pt2Line9_CountryofCitzOrNationality', toStr(ben.citizenship || ben.nationality));
  setText1(form, 'Pt2Line10a_FamilyName',      toStr(get(ben,'otherNames[0].lastName')));
  setText1(form, 'Pt2Line10b_GivenName',       toStr(get(ben,'otherNames[0].firstName')));
  setText1(form, 'Pt2Line10c_MiddleName',      toStr(get(ben,'otherNames[0].middleName')));

  const benMail = pickAddress(ben.mailing);
  setText1(form, 'Pt2Line11_StreetNumberName', toStr(benMail.street));
  setText1(form, 'Pt2Line11_AptSteFlrNumber',  toStr(benMail.unitNum));
  setText1(form, 'Pt2Line11_CityOrTown',       toStr(benMail.city));
  setText1(form, 'Pt2Line11_State',            toStr(benMail.state));
  setText1(form, 'Pt2Line11_ZipCode',          toStr(benMail.zip));
  setText1(form, 'Pt2Line11_Province',         toStr(benMail.province));
  setText1(form, 'Pt2Line11_PostalCode',       toStr(benMail.postal));
  setText1(form, 'Pt2Line11_Country',          toStr(benMail.country));

  const benPhys0 = benSameAsMailing
      ? { ...benMail }
      : (pickAddress(get(ben,'physical[0]')) || pickAddress(get(ben,'physicalAddress')));
  setText1(form, 'Pt2Line14_StreetNumberName', toStr(benPhys0.street));
  setText1(form, 'Pt2Line14_AptSteFlrNumber',  toStr(benPhys0.unitNum));
  setText1(form, 'Pt2Line14_CityOrTown',       toStr(benPhys0.city));
  setText1(form, 'Pt2Line14_State',            toStr(benPhys0.state));
  setText1(form, 'Pt2Line14_ZipCode',          toStr(benPhys0.zip));
  setText1(form, 'Pt2Line14_Province',         toStr(benPhys0.province));
  setText1(form, 'Pt2Line14_PostalCode',       toStr(benPhys0.postal));
  setText1(form, 'Pt2Line14_Country',          toStr(benPhys0.country));
  setText1(form, 'Pt2Line15a_DateFrom',        fmtDate(benPhys0.from));
  setText1(form, 'Pt2Line15b_ToFrom',          fmtDate(benPhys0.to));

  setText1(form, 'Pt2Line16_NameofEmployer',   toStr(get(ben,'employment[0].employer')));
  setText1(form, 'Pt2Line17_StreetNumberName', toStr(get(ben,'employment[0].street')));
  setText1(form, 'Pt2Line17_AptSteFlrNumber',  toStr(get(ben,'employment[0].unitNum')));
  setText1(form, 'Pt2Line17_CityOrTown',       toStr(get(ben,'employment[0].city')));
  setText1(form, 'Pt2Line17_State',            toStr(get(ben,'employment[0].state')));
  setText1(form, 'Pt2Line17_ZipCode',          toStr(get(ben,'employment[0].zip')));
  setText1(form, 'Pt2Line17_Province',         toStr(get(ben,'employment[0].province')));
  setText1(form, 'Pt2Line17_PostalCode',       toStr(get(ben,'employment[0].postal')));
  setText1(form, 'Pt2Line17_Country',          toStr(get(ben,'employment[0].country')));
  setText1(form, 'Pt2Line18_Occupation',       toStr(get(ben,'employment[0].occupation')));
  setText1(form, 'Pt2Line19a_DateFrom',        fmtDate(get(ben,'employment[0].from')));
  setText1(form, 'Pt2Line19b_ToFrom',          fmtDate(get(ben,'employment[0].to')));

  /* ===== Part 3 — Other Information ===== */
  const p3 = saved.part3 || saved.otherInfo || {};
  const met = low(firstOr(p3.metInPerson, ''));
  setManyChecks(form, ['Pt3_MetInPerson_Yes','Part3_Met_Yes'], met === 'yes' || met === 'true');
  setManyChecks(form, ['Pt3_MetInPerson_No','Part3_Met_No'],   met === 'no'  || met === 'false');

  /* ===== Part 4 — Biographic Information ===== */
  const bio = saved.biographic || saved.part4 || {};
  const eth = low(firstOr(bio.ethnicity, ''));
  setManyChecks(form, ['Pt4_Ethnicity_Hispanic','Part4_Ethnicity_p0_ch1'], eth === 'hispanic' || eth === 'latino');
  setManyChecks(form, ['Pt4_Ethnicity_NotHispanic','Part4_Ethnicity_p0_ch2'], eth.includes('not'));

  const raceVals = lowArr(bio.race);
  const hasRace = (needle) => raceVals.includes(needle) || raceVals.some((r) => r.includes(needle));
  setManyChecks(form, ['Pt4_Race_White'], hasRace('white'));
  setManyChecks(form, ['Pt4_Race_Black'], hasRace('black') || hasRace('african'));
  setManyChecks(form, ['Pt4_Race_Asian'], hasRace('asian'));
  setManyChecks(form, ['Pt4_Race_AIAN'],  hasRace('american indian') || hasRace('alaska'));
  setManyChecks(form, ['Pt4_Race_NHPI'],  hasRace('pacific'));

  setManyText(form, ['Pt4_HeightFeet'], toStr(firstOr(bio.heightFeet,'')));
  setManyText(form, ['Pt4_HeightInches'], toStr(firstOr(bio.heightInches,'')));
  setManyText(form, ['Pt4_Weight'], toStr(firstOr(bio.weight,'')));

  const eye = low(firstOr(bio.eyeColor,''));
  setManyChecks(form, ['Pt4_Eye_Black'], eye === 'black');
  setManyChecks(form, ['Pt4_Eye_Blue'],  eye === 'blue');
  setManyChecks(form, ['Pt4_Eye_Brown'], eye === 'brown');
  setManyChecks(form, ['Pt4_Eye_Gray'],  eye === 'gray' || eye === 'grey');
  setManyChecks(form, ['Pt4_Eye_Green'], eye === 'green');
  setManyChecks(form, ['Pt4_Eye_Hazel'], eye === 'hazel');
  setManyChecks(form, ['Pt4_Eye_Maroon'], eye === 'maroon');
  setManyChecks(form, ['Pt4_Eye_Pink'],  eye === 'pink');
  setManyChecks(form, ['Pt4_Eye_Unknown'], eye === 'unknown' || eye === 'other');

  const hair = low(firstOr(bio.hairColor,''));
  setManyChecks(form, ['Pt4_Hair_Bald'],  hair === 'bald' || hair === 'none');
  setManyChecks(form, ['Pt4_Hair_Black'], hair === 'black');
  setManyChecks(form, ['Pt4_Hair_Blond'], hair === 'blond' || hair === 'blonde');
  setManyChecks(form, ['Pt4_Hair_Brown'], hair === 'brown');
  setManyChecks(form, ['Pt4_Hair_Grey','Pt4_Hair_Gray'], hair === 'gray' || hair === 'grey');
  setManyChecks(form, ['Pt4_Hair_Red'],   hair === 'red');
  setManyChecks(form, ['Pt4_Hair_Sandy'], hair === 'sandy');
  setManyChecks(form, ['Pt4_Hair_White'], hair === 'white');
  setManyChecks(form, ['Pt4_Hair_Unknown'], hair === 'unknown' || hair === 'other');

  /* ===== Part 5 — Petitioner Contact + Signature (date only) ===== */
  setManyText(form, ['Pt5_Email','Pt5_PetitionerEmail'], toStr(get(saved, 'petitioner.email')));
  setManyText(form, ['Pt5_Phone_Day'], toStr(get(saved, 'petitioner.phone')));
  setManyText(form, ['Pt5_Phone_Mobile'], toStr(get(saved, 'petitioner.mobile')));
  setManyText(form, ['Pt5_SignatureDate','Pt5_SignDate','Pt5_Date_of_Signature'],
              fmtDate(get(saved,'preparer.signDate')) || fmtDate(get(saved,'petitioner.signDate')));

  /* ===== Part 6 — Interpreter ===== */
  const itp = saved.interpreter || {};
  setManyText(form, ['Pt6_Language','Pt6_Interp_Language'], toStr(itp.language));
  setManyText(form, ['Pt6_Email','Pt6_Interp_Email'], toStr(itp.email));
  setManyText(form, ['Pt6_SignDate','Pt6_Interp_SignDate'], fmtDate(itp.signDate));
  setManyText(form, ['Pt6_Family','Pt6_Interp_Family'], toStr(itp.lastName));
  setManyText(form, ['Pt6_Given','Pt6_Interp_Given'], toStr(itp.firstName));
  setManyText(form, ['Pt6_Business','Pt6_Interp_Business'], toStr(itp.business));
  setManyText(form, ['Pt6_Phone1','Pt6_Interp_Phone1'], toStr(itp.phone1));
  setManyText(form, ['Pt6_Phone2','Pt6_Interp_Phone2'], toStr(itp.phone2));

  /* ===== Part 7 — Preparer ===== */
  const prep = saved.preparer || {};
  setManyText(form, ['Pt7_Family','Pt7_Prep_Family'], toStr(prep.lastName));
  setManyText(form, ['Pt7_Given','Pt7_Prep_Given'],   toStr(prep.firstName));
  setManyText(form, ['Pt7_Business','Pt7_Prep_Business'], toStr(prep.business));
  setManyText(form, ['Pt7_Phone','Pt7_Prep_Phone'],   toStr(prep.phone));
  setManyText(form, ['Pt7_Mobile','Pt7_Prep_Mobile'], toStr(prep.mobile));
  setManyText(form, ['Pt7_Email','Pt7_Prep_Email'],   toStr(prep.email));
  setManyText(form, ['Pt7_SignDate','Pt7_Prep_SignDate'], fmtDate(prep.signDate));

  /* ===== Part 8 — Additional Information ===== */
  const p8 = saved.part8 || {};
  setManyText(form, ['Pt8_Line3d','Pt8_3d','Additional_3d'], toStr(p8.line3d));
  setManyText(form, ['Pt8_Line4d','Pt8_4d','Additional_4d'], toStr(p8.line4d));
  setManyText(form, ['Pt8_Line5d','Pt8_5d','Additional_5d'], toStr(p8.line5d));
  setManyText(form, ['Pt8_Line6d','Pt8_6d','Additional_6d'], toStr(p8.line6d));

  /* ===== Arbitrary overrides (advanced) ===== */
  const other = saved.other || {};
  for (const [fieldName, value] of Object.entries(other)) {
    if (typeof fieldName !== 'string') continue;
    if (!setText1(form, fieldName, toStr(value))) {
      if (value === true || value === false) check1(form, fieldName, !!value);
    }
  }
}
