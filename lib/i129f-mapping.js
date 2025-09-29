// lib/i129f-mapping.js
//
// Robust, explicit field mapping for I-129F (Parts 1–8).
// - Tries multiple likely PDF field IDs for each line (safe when PDFs rename things).
// - Converts dates to MM/DD/YYYY, normalizes Yes/No booleans, and guards every write.
// - Packs overflow names/addresses/employers into Part 8 (Line 3d) automatically.
//
// If a field still won’t populate, open your PDF overlay/inspector and
// add that exact field ID to the candidate array for the matching line below.

/* ========== tiny utils ========== */
function get(obj, path, dflt = '') {
  try {
    const parts = Array.isArray(path) ? path : String(path).split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur == null) return dflt;
      if (p.endsWith(']')) {
        // array index like "parents[1]"
        const m = /(.*)\[(\d+)\]$/.exec(p);
        if (!m) return dflt;
        cur = cur[m[1]];
        cur = Array.isArray(cur) ? cur[Number(m[2])] : undefined;
      } else {
        cur = cur[p];
      }
    }
    return cur ?? dflt;
  } catch {
    return dflt;
  }
}
function isBlank(v) {
  return v == null || (typeof v === 'string' && v.trim() === '');
}
function fmtDate(v) {
  if (!v) return '';
  try {
    if (typeof v === 'string') {
      // already MM/DD/YYYY?
      if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(v)) {
        const [m, d, y] = v.split('/');
        const mm = String(m).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        const yyyy = y.length === 2 ? (Number(y) >= 70 ? '19' + y : '20' + y) : y;
        return `${mm}/${dd}/${yyyy}`;
      }
      // ISO?
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
        const [y, m, d] = v.split('-');
        return `${m}/${d}/${y}`;
      }
    }
    const d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = String(d.getFullYear());
    return `${mm}/${dd}/${yyyy}`;
  } catch {
    return String(v ?? '');
  }
}
function yn(v) {
  const s = typeof v === 'string' ? v.trim().toLowerCase() : v;
  if (s === true || s === 'true' || s === 'yes' || s === 'y' || s === '1') return true;
  if (s === false || s === 'false' || s === 'no' || s === 'n' || s === '0') return false;
  return undefined; // unknown
}
function fullName(n) {
  if (!n) return '';
  const a = [n.lastName, n.firstName, n.middleName].filter(Boolean);
  return a.join(', ').replace(/\s+,/g, ',').trim();
}
function addressLines(a) {
  if (!a) return { street: '', unitNum: '', city: '', state: '', zip: '', province: '', postal: '', country: '' };
  return {
    street: a.street ?? '',
    unitNum: a.unitNum ?? '',
    city: a.city ?? '',
    state: a.state ?? '',
    zip: a.zip ?? '',
    province: a.province ?? '',
    postal: a.postal ?? '',
    country: a.country ?? '',
  };
}

/* ========== low-level PDF writers (pdf-lib safe) ========== */
function setText1(form, name, value) {
  try {
    const f = form.getTextField(name);
    f.setText(value ?? '');
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
  let wrote = 0;
  for (const n of names) {
    if (!isBlank(value)) wrote += setText1(form, n, String(value)) ? 1 : 0;
  }
  return wrote;
}
function setManyChecks(form, names, on = true) {
  let wrote = 0;
  for (const n of names) wrote += check1(form, n, on) ? 1 : 0;
  return wrote;
}
function setYesNo(form, yesNames, noNames, value) {
  const v = yn(value);
  if (v === undefined) {
    // Uncheck both to avoid accidental stale state
    setManyChecks(form, yesNames, false);
    setManyChecks(form, noNames, false);
    return 0;
  }
  setManyChecks(form, yesNames, v === true);
  setManyChecks(form, noNames, v === false);
  return 1;
}

/* ========== spill extras into Part 8 (Line 3d) ========== */
function appendPart8Note(store, text) {
  if (!text) return;
  const cur = store.part8?.line3d || '';
  const sep = cur ? '\n' : '';
  store.part8 = store.part8 || {};
  store.part8.line3d = `${cur}${sep}${text}`.trim();
}

/* ========== MAIN APPLICATOR ========== */
export function applyI129fMapping(saved, form) {
  if (!saved || !form) return;

  // Defensive clones to avoid undefined reads
  const pet = saved.petitioner || {};
  const ben = saved.beneficiary || {};
  const interp = saved.interpreter || {};
  const prep = saved.preparer || {};
  const cls = (saved.classification?.type || '').toLowerCase(); // 'k1' | 'k3' | ''

  /* ===== Part 1 — Classification (4–5) ===== */
  // Line 4: K-1 vs K-3 checkboxes
  setManyChecks(form, [
    'Pt1Line4a_K1','Pt1_Line4a_K1','Line4_K1','Pt1Line4_Checkboxes_p0_ch1'
  ], cls === 'k1');
  setManyChecks(form, [
    'Pt1Line4a_K3','Pt1_Line4a_K3','Line4_K3','Pt1Line4_Checkboxes_p0_ch2','Pt1_Line4a_Spouse'
  ], cls === 'k3');

  // Line 5: If K-3 — have you filed I-130?
  const i130Filed = yn(saved.classification?.i130Filed);
  setYesNo(
    form,
    ['Pt1Line5_Yes','Line5_Checkboxes_p0_ch1','Pt1_Line5_Yes'],
    ['Pt1Line5_No','Line5_Checkboxes_p0_ch2','Pt1_Line5_No'],
    cls === 'k3' ? i130Filed : undefined
  );

  /* ===== Part 1 — Petitioner IDs & Name (1–7, 22–26) ===== */
  setManyText(form, ['Pt1Line1_AlienNumber','Pt1_Line1_A_Number'], pet.aNumber);
  setManyText(form, ['Pt1Line2_AcctIdentifier','Pt1_Line2_OnlineAcct'], pet.uscisOnlineAccount);
  setManyText(form, ['Pt1Line3_SSN','Pt1_Line3_SSN'], pet.ssn);

  setManyText(form, ['Pt1Line6a_FamilyName','Pt1_Line6a_Family'], pet.lastName);
  setManyText(form, ['Pt1Line6b_GivenName','Pt1_Line6b_Given'], pet.firstName);
  setManyText(form, ['Pt1Line6c_MiddleName','Pt1_Line6c_Middle'], pet.middleName);

  // Other names (two slots visible; rest spill to Part 8)
  const petOther = Array.isArray(pet.otherNames) ? pet.otherNames : [];
  const pO0 = petOther[0] || {};
  const pO1 = petOther[1] || {};
  setManyText(form, ['Pt1Line7a_FamilyName'], pO0.lastName);
  setManyText(form, ['Pt1Line7b_GivenName'], pO0.firstName);
  setManyText(form, ['Pt1Line7c_MiddleName'], pO0.middleName);
  setManyText(form, ['Pt1Line7d_FamilyName'], pO1.lastName);
  setManyText(form, ['Pt1Line7e_GivenName'], pO1.firstName);
  setManyText(form, ['Pt1Line7f_MiddleName'], pO1.middleName);
  if (petOther.length > 2) {
    appendPart8Note(saved, petOther.slice(2).map((n, i) => `Extra petitioner name #${i+3}: ${fullName(n)}`).join(' | '));
  }

  // DoB / Place of birth
  setManyText(form, ['Pt1Line22_DateOfBirth','Pt1_Line22_DOB'], fmtDate(pet.dob));
  setManyText(form, ['Pt1Line24_CityTownOfBirth','Pt1_Line24_CityBirth'], pet.cityBirth);
  setManyText(form, ['Pt1Line25_ProvinceOfBirth','Pt1_Line25_ProvinceBirth'], pet.provinceBirth);
  setManyText(form, ['Pt1Line26_CountryOfBirth','Pt1_Line26_CountryBirth'], pet.countryBirth);
  // Sex & marital
  setManyChecks(form, ['Pt1Line23_Sex_Male','Pt1_Line23_Male','Pt1Line23_Checkboxes_p0_ch1'], (pet.sex||'').toLowerCase()==='male');
  setManyChecks(form, ['Pt1Line23_Sex_Female','Pt1_Line23_Female','Pt1Line23_Checkboxes_p0_ch2'], (pet.sex||'').toLowerCase()==='female');
  // Naturalization (free-form)
  setManyText(form, ['Pt1_Natz_Number','Pt1Line27_NatzNumber'], pet.natzNumber);
  setManyText(form, ['Pt1_Natz_Place','Pt1Line27_NatzPlace'], pet.natzPlace);
  setManyText(form, ['Pt1_Natz_Date','Pt1Line27_NatzDate'], fmtDate(pet.natzDate));

  /* ===== Part 1 — Addresses (8–10,14) ===== */
  const mailing = saved.mailing || {};
  const m = addressLines(mailing);
  setManyText(form, ['Pt1Line8_InCareOf'], mailing.inCareOf);
  setManyText(form, ['Pt1Line8_StreetNumberName'], m.street);
  setManyText(form, ['Pt1Line8_AptSteFlrNumber'], mailing.unitNum || mailing.unitType || '');
  setManyText(form, ['Pt1Line8_CityOrTown'], m.city);
  setManyText(form, ['Pt1Line8_State'], m.state);
  setManyText(form, ['Pt1Line8_ZipCode'], m.zip || m.postal);
  setManyText(form, ['Pt1Line8_Province'], m.province);
  setManyText(form, ['Pt1Line8_PostalCode'], m.postal);
  setManyText(form, ['Pt1Line8_Country'], m.country);

  // Physical address history – two visible slots; extras -> Part 8
  const phys = Array.isArray(saved.physicalAddresses) ? saved.physicalAddresses : [];
  const a0 = addressLines(phys[0] || {});
  const a1 = addressLines(phys[1] || {});
  setManyText(form, ['Pt1Line9_StreetNumberName'], a0.street);
  setManyText(form, ['Pt1Line9_AptSteFlrNumber'], phys[0]?.unitNum || phys[0]?.unitType || '');
  setManyText(form, ['Pt1Line9_CityOrTown'], a0.city);
  setManyText(form, ['Pt1Line9_State'], a0.state);
  setManyText(form, ['Pt1Line9_ZipCode'], a0.zip || a0.postal);
  setManyText(form, ['Pt1Line10a_DateFrom'], fmtDate(phys[0]?.from));
  setManyText(form, ['Pt1Line10b_DateFrom','Pt1Line10b_DateTo'], fmtDate(phys[0]?.to));

  setManyText(form, ['Pt1Line14_StreetNumberName'], a1.street);
  setManyText(form, ['Pt1Line14_AptSteFlrNumber'], phys[1]?.unitNum || phys[1]?.unitType || '');
  setManyText(form, ['Pt1Line14_CityOrTown'], a1.city);
  setManyText(form, ['Pt1Line14_State'], a1.state);
  setManyText(form, ['Pt1Line14_ZipCode'], a1.zip || a1.postal);
  setManyText(form, ['Pt1Line14a_DateFrom'], fmtDate(phys[1]?.from));
  setManyText(form, ['Pt1Line14b_DateFrom','Pt1Line14b_DateTo'], fmtDate(phys[1]?.to));
  if (phys.length > 2) {
    appendPart8Note(saved, phys.slice(2).map((a, i) => {
      const al = addressLines(a);
      return `Extra petitioner address #${i+3}: ${al.street}, ${al.city} ${al.state} ${al.zip||al.postal}, ${al.country} (${fmtDate(a.from)} – ${fmtDate(a.to)})`;
    }).join(' | '));
  }

  /* ===== Part 1 — Employment (13–16) ===== */
  const petEmp = Array.isArray(saved.employment) ? saved.employment : [];
  const pe0 = petEmp[0] || {};
  const pe1 = petEmp[1] || {};
  setManyText(form, ['Pt1Line13_NameofEmployer'], pe0.employer);
  setManyText(form, ['Pt1Line14_StreetNumberName'], pe0.street);
  setManyText(form, ['Pt1Line15_Occupation'], pe0.occupation);
  setManyText(form, ['Pt1Line16a_DateFrom'], fmtDate(pe0.from));
  setManyText(form, ['Pt1Line16b_ToFrom','Pt1Line16b_DateTo'], fmtDate(pe0.to));

  setManyText(form, ['Pt1Line17_NameofEmployer','Pt1Line16_2_NameOfEmployer'], pe1.employer);
  setManyText(form, ['Pt1Line17_StreetNumberName'], pe1.street);
  setManyText(form, ['Pt1Line18_Occupation'], pe1.occupation);
  setManyText(form, ['Pt1Line19a_DateFrom'], fmtDate(pe1.from));
  setManyText(form, ['Pt1Line19b_ToFrom','Pt1Line19b_DateTo'], fmtDate(pe1.to));
  if (petEmp.length > 2) {
    appendPart8Note(saved, petEmp.slice(2).map((e,i)=>`Extra petitioner employer #${i+3}: ${e.employer||''}, ${fmtDate(e.from)}–${fmtDate(e.to)}`).join(' | '));
  }

  /* ===== Part 1 — Parents ===== */
  const pp = Array.isArray(pet.parents) ? pet.parents : [];
  const pp0 = pp[0] || {};
  const pp1 = pp[1] || {};
  setManyText(form, ['Pt1_Parent1_Family'], pp0.lastName);
  setManyText(form, ['Pt1_Parent1_Given'], pp0.firstName);
  setManyText(form, ['Pt1_Parent1_Middle'], pp0.middleName);
  setManyText(form, ['Pt1_Parent1_DOB'], fmtDate(pp0.dob));
  setManyText(form, ['Pt1_Parent1_CityBirth'], pp0.cityBirth);
  setManyText(form, ['Pt1_Parent1_CountryBirth'], pp0.countryBirth);
  setManyText(form, ['Pt1_Parent1_Nationality'], pp0.nationality);
  setManyChecks(form, ['Pt1_Parent1_Male'], (pp0.sex||'').toLowerCase()==='male');
  setManyChecks(form, ['Pt1_Parent1_Female'], (pp0.sex||'').toLowerCase()==='female');

  setManyText(form, ['Pt1_Parent2_Family'], pp1.lastName);
  setManyText(form, ['Pt1_Parent2_Given'], pp1.firstName);
  setManyText(form, ['Pt1_Parent2_Middle'], pp1.middleName);
  setManyText(form, ['Pt1_Parent2_DOB'], fmtDate(pp1.dob));
  setManyText(form, ['Pt1_Parent2_CityBirth'], pp1.cityBirth);
  setManyText(form, ['Pt1_Parent2_CountryBirth'], pp1.countryBirth);
  setManyText(form, ['Pt1_Parent2_Nationality'], pp1.nationality);
  setManyChecks(form, ['Pt1_Parent2_Male'], (pp1.sex||'').toLowerCase()==='male');
  setManyChecks(form, ['Pt1_Parent2_Female'], (pp1.sex||'').toLowerCase()==='female');

  /* ===== Part 2 — Beneficiary Identity (1–9) ===== */
  setManyText(form, ['Pt2Line1a_FamilyName'], ben.lastName);
  setManyText(form, ['Pt2Line1b_GivenName'], ben.firstName);
  setManyText(form, ['Pt2Line1c_MiddleName'], ben.middleName);

  setManyText(form, ['Pt2Line2_AlienNumber'], ben.aNumber);
  setManyText(form, ['Pt2Line3_SSN'], ben.ssn);
  setManyText(form, ['Pt2Line4_DateOfBirth'], fmtDate(ben.dob));

  setManyText(form, ['Pt2Line7_CityTownOfBirth'], ben.cityBirth);
  setManyText(form, ['Pt2Line8_CountryOfBirth'], ben.countryBirth);
  setManyText(form, ['Pt2Line9_CountryofCitzOrNationality'], ben.nationality);

  // Other names (two visible; extras -> Part 8)
  const bOther = Array.isArray(ben.otherNames) ? ben.otherNames : [];
  const bO0 = bOther[0] || {};
  const bO1 = bOther[1] || {};
  setManyText(form, ['Pt2Line10a_FamilyName'], bO0.lastName);
  setManyText(form, ['Pt2Line10b_GivenName'], bO0.firstName);
  setManyText(form, ['Pt2Line10c_MiddleName'], bO0.middleName);
  setManyText(form, ['Pt2Line10d_FamilyName'], bO1.lastName);
  setManyText(form, ['Pt2Line10e_GivenName'], bO1.firstName);
  setManyText(form, ['Pt2Line10f_MiddleName'], bO1.middleName);
  if (bOther.length > 2) {
    appendPart8Note(saved, bOther.slice(2).map((n, i) => `Extra beneficiary name #${i+3}: ${fullName(n)}`).join(' | '));
  }

  /* ===== Part 2 — Addresses (11, 14–15) ===== */
  const bm = addressLines(ben.mailing || {});
  const bp = addressLines(ben.physicalAddress || {});
  setManyText(form, ['Pt2Line11_InCareOf'], ben.mailing?.inCareOf);
  setManyText(form, ['Pt2Line11_StreetNumberName'], bm.street);
  setManyText(form, ['Pt2Line11_AptSteFlrNumber'], ben.mailing?.unitNum || ben.mailing?.unitType || '');
  setManyText(form, ['Pt2Line11_CityOrTown'], bm.city);
  setManyText(form, ['Pt2Line11_State'], bm.state);
  setManyText(form, ['Pt2Line11_ZipCode'], bm.zip || bm.postal);
  setManyText(form, ['Pt2Line11_Province'], bm.province);
  setManyText(form, ['Pt2Line11_PostalCode'], bm.postal);
  setManyText(form, ['Pt2Line11_Country'], bm.country);

  setManyText(form, ['Pt2Line14_StreetNumberName'], bp.street);
  setManyText(form, ['Pt2Line14_AptSteFlrNumber'], ben.physicalAddress?.unitNum || ben.physicalAddress?.unitType || '');
  setManyText(form, ['Pt2Line14_CityOrTown'], bp.city);
  setManyText(form, ['Pt2Line14_State'], bp.state);
  setManyText(form, ['Pt2Line14_ZipCode'], bp.zip || bp.postal);
  setManyText(form, ['Pt2Line14_Province'], bp.province);
  setManyText(form, ['Pt2Line14_PostalCode'], bp.postal);
  setManyText(form, ['Pt2Line14_Country'], bp.country);

  // 15a/b (dates at physical address)
  setManyText(form, ['Pt2Line15a_DateFrom'], fmtDate(ben.physicalAddress?.from));
  setManyText(form, ['Pt2Line15b_ToFrom','Pt2Line15b_DateTo'], fmtDate(ben.physicalAddress?.to));

  /* ===== Part 2 — Employment (16–19) ===== */
  const be = Array.isArray(ben.employment) ? ben.employment : [];
  const be0 = be[0] || {};
  const be1 = be[1] || {};
  setManyText(form, ['Pt2Line16_NameofEmployer'], be0.employer);
  setManyText(form, ['Pt2Line17_StreetNumberName'], be0.street);
  setManyText(form, ['Pt2Line18_Occupation'], be0.occupation);
  setManyText(form, ['Pt2Line19a_DateFrom'], fmtDate(be0.from));
  setManyText(form, ['Pt2Line19b_ToFrom','Pt2Line19b_DateTo'], fmtDate(be0.to));

  setManyText(form, ['Pt2Line20_NameofEmployer','Pt2Line16_2_NameOfEmployer'], be1.employer);
  setManyText(form, ['Pt2Line20_StreetNumberName'], be1.street);
  setManyText(form, ['Pt2Line21_Occupation'], be1.occupation);
  setManyText(form, ['Pt2Line22a_DateFrom'], fmtDate(be1.from));
  setManyText(form, ['Pt2Line22b_ToFrom','Pt2Line22b_DateTo'], fmtDate(be1.to));
  if (be.length > 2) {
    appendPart8Note(saved, be.slice(2).map((e,i)=>`Extra beneficiary employer #${i+3}: ${e.employer||''}, ${fmtDate(e.from)}–${fmtDate(e.to)}`).join(' | '));
  }

  /* ===== Part 2 — Parents ===== */
  const bpArr = Array.isArray(ben.parents) ? ben.parents : [];
  const bpa = bpArr[0] || {};
  const bpb = bpArr[1] || {};
  setManyText(form, ['Pt2_Parent1_Family'], bpa.lastName);
  setManyText(form, ['Pt2_Parent1_Given'], bpa.firstName);
  setManyText(form, ['Pt2_Parent1_Middle'], bpa.middleName);
  setManyText(form, ['Pt2_Parent1_DOB'], fmtDate(bpa.dob));
  setManyText(form, ['Pt2_Parent1_CityBirth'], bpa.cityBirth);
  setManyText(form, ['Pt2_Parent1_CountryBirth'], bpa.countryBirth);
  setManyText(form, ['Pt2_Parent1_Nationality'], bpa.nationality);
  setManyChecks(form, ['Pt2_Parent1_Male'], (bpa.sex||'').toLowerCase()==='male');
  setManyChecks(form, ['Pt2_Parent1_Female'], (bpa.sex||'').toLowerCase()==='female');

  setManyText(form, ['Pt2_Parent2_Family'], bpb.lastName);
  setManyText(form, ['Pt2_Parent2_Given'], bpb.firstName);
  setManyText(form, ['Pt2_Parent2_Middle'], bpb.middleName);
  setManyText(form, ['Pt2_Parent2_DOB'], fmtDate(bpb.dob));
  setManyText(form, ['Pt2_Parent2_CityBirth'], bpb.cityBirth);
  setManyText(form, ['Pt2_Parent2_CountryBirth'], bpb.countryBirth);
  setManyText(form, ['Pt2_Parent2_Nationality'], bpb.nationality);
  setManyChecks(form, ['Pt2_Parent2_Male'], (bpb.sex||'').toLowerCase()==='male');
  setManyChecks(form, ['Pt2_Parent2_Female'], (bpb.sex||'').toLowerCase()==='female');

  /* ===== Parts 5–7 — Contact, Interpreter, Preparer ===== */
  // Petitioner contact
  setManyText(form, ['Pt5_Petitioner_DayPhone'], pet.phone);
  setManyText(form, ['Pt5_Petitioner_Mobile'], pet.mobile);
  setManyText(form, ['Pt5_Petitioner_Email'], pet.email);

  // Interpreter used?
  const usedInterpreter = !isBlank(interp.language) || !isBlank(interp.firstName) || !isBlank(interp.lastName);
  setYesNo(
    form,
    ['Pt6_UsedInterpreter_Yes','Pt6_Checkboxes_p0_ch1'],
    ['Pt6_UsedInterpreter_No','Pt6_Checkboxes_p0_ch2'],
    usedInterpreter
  );
  setManyText(form, ['Pt6_Interpreter_Language'], interp.language);
  setManyText(form, ['Pt6_Interpreter_Email'], interp.email);
  setManyText(form, ['Pt6_Interpreter_Family'], interp.lastName);
  setManyText(form, ['Pt6_Interpreter_Given'], interp.firstName);
  setManyText(form, ['Pt6_Interpreter_Business'], interp.business);
  setManyText(form, ['Pt6_Interpreter_Phone1'], interp.phone1);
  setManyText(form, ['Pt6_Interpreter_Phone2'], interp.phone2);
  setManyText(form, ['Pt6_Interpreter_SignDate'], fmtDate(interp.signDate));

  // Preparer used?
  const usedPreparer = !isBlank(prep.firstName) || !isBlank(prep.lastName) || !isBlank(prep.business);
  setYesNo(
    form,
    ['Pt7_UsedPreparer_Yes','Pt7_Checkboxes_p0_ch1'],
    ['Pt7_UsedPreparer_No','Pt7_Checkboxes_p0_ch2'],
    usedPreparer
  );
  setManyText(form, ['Pt7_Preparer_Family'], prep.lastName);
  setManyText(form, ['Pt7_Preparer_Given'], prep.firstName);
  setManyText(form, ['Pt7_Preparer_Business'], prep.business);
  setManyText(form, ['Pt7_Preparer_Phone'], prep.phone);
  setManyText(form, ['Pt7_Preparer_Mobile'], prep.mobile);
  setManyText(form, ['Pt7_Preparer_Email'], prep.email);
  setManyText(form, ['Pt7_Preparer_SignDate'], fmtDate(prep.signDate));

  /* ===== Part 3/4 — Criminal / prior filings (common Y/N patterns) =====
     NOTE: These are placeholders for your exact field IDs. Keep the logical names,
     just add your true PDF IDs to each candidate array below. */
  const crim = saved.criminal || saved.part3 || {};
  setYesNo(form, ['Pt3_Q1_Yes'], ['Pt3_Q1_No'], yn(crim.q1));
  setYesNo(form, ['Pt3_Q2_Yes'], ['Pt3_Q2_No'], yn(crim.q2));
  setYesNo(form, ['Pt3_Q3_Yes'], ['Pt3_Q3_No'], yn(crim.q3));
  setYesNo(form, ['Pt3_Q4_Yes'], ['Pt3_Q4_No'], yn(crim.q4));
  setYesNo(form, ['Pt3_Q5_Yes'], ['Pt3_Q5_No'], yn(crim.q5));
  // If any are "Yes", encourage details in Part 8:
  if ([crim.q1, crim.q2, crim.q3, crim.q4, crim.q5].some(v => yn(v) === true)) {
    appendPart8Note(saved, 'See criminal/immigration history explanations.');
  }

  /* ===== Part 8 — Additional Information (3d–7d) ===== */
  setManyText(form, ['Pt8_Line3d'], get(saved, 'part8.line3d', ''));
  setManyText(form, ['Pt8_Line4d'], get(saved, 'part8.line4d', ''));
  setManyText(form, ['Pt8_Line5d'], get(saved, 'part8.line
