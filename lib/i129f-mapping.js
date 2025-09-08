// lib/i129f-mapping.js

function setText(form, fieldId, value) {
  try {
    if (!fieldId || value == null || value === '') return;
    const f = form.getTextField(fieldId);
    if (f) f.setText(String(value));
  } catch {}
}

function fmtDate(yyyyMmDd) {
  if (!yyyyMmDd || typeof yyyyMmDd !== 'string' || yyyyMmDd.length < 10) return '';
  const [y, m, d] = yyyyMmDd.split('-');
  if (!y || !m || !d) return '';
  return `${m}/${d}/${y}`;
}

/** Fill Part 8 addendum slots: Line3..Line7 blocks */
function fillAddenda(form, entries) {
  const slots = [
    { p:'Line3a_PageNumber', t:'Line3d_AdditionalInfo', pn:'Line3b_PartNumber', in:'Line3c_ItemNumber' },
    { p:'Line4a_PageNumber', t:'Line4d_AdditionalInfo', pn:'Line4b_PartNumber', in:'Line4c_ItemNumber' },
    { p:'Line5a_PageNumber', t:'Line5d_AdditionalInfo', pn:'Line5b_PartNumber', in:'Line5c_ItemNumber' },
    { p:'Line6a_PageNumber', t:'Line6d_AdditionalInfo', pn:'Line6b_PartNumber', in:'Line6c_ItemNumber' },
    { p:'Line7a_PageNumber', t:'Line7d_AdditionalInfo', pn:'Line7b_PartNumber', in:'Line7c_ItemNumber' },
  ];
  for (let i = 0; i < slots.length && i < entries.length; i++) {
    const s = slots[i], e = entries[i];
    setText(form, s.p,  e.page ?? '');
    setText(form, s.pn, e.part ?? '');
    setText(form, s.in, e.item ?? '');
    setText(form, s.t,  e.text ?? '');
  }
}

export function applyI129fMapping(data, form) {
  const pet = data?.petitioner || {};
  const mailing = data?.mailing || {};
  const addrs = Array.isArray(data?.addresses) ? data.addresses : [];
  const emps  = Array.isArray(data?.employers) ? data.employers : [];

  const ben = data?.beneficiary || {};
  const benAddrs = Array.isArray(ben.addresses) ? ben.addresses : [];
  const benEmps  = Array.isArray(ben.employers) ? ben.employers : [];
  const benMail  = ben?.mailing || {};
  const travel   = ben?.travel || {};
  const parents  = ben?.parents || {};
  const bio      = data?.bio || {};
  const contact  = data?.contact || {};

  // ===============================
  // Part 1 — Petitioner
  // ===============================

  // Names
  setText(form, 'Pt1Line7a_FamilyName', pet.lastName);
  setText(form, 'Pt1Line7b_GivenName',  pet.firstName);
  setText(form, 'Pt1Line7c_MiddleName', pet.middleName);

  // Other names used – first one on form, extras → Part 8
  const petOther = Array.isArray(pet.otherNames) ? pet.otherNames : [];
  if (petOther[0]) {
    setText(form, 'Pt1Line6a_FamilyName', petOther[0].lastName);
    setText(form, 'Pt1Line6b_GivenName',  petOther[0].firstName);
    setText(form, 'Pt1Line6c_MiddleName', petOther[0].middleName);
  }

  // Mailing (Line 8)
  setText(form, 'Pt1Line8_StreetNumberName', mailing.street);
  setText(form, 'Pt1Line8_Unit_p0_ch3',      mailing.unitType);
  setText(form, 'Pt1Line8_AptSteFlrNumber',  mailing.unitNum);
  setText(form, 'Pt1Line8_CityOrTown',       mailing.city);
  setText(form, 'Pt1Line8_State',            mailing.state);
  setText(form, 'Pt1Line8_ZipCode',          mailing.zip);

  // Physical addresses (Lines 9, 11, 14, 18 + 10a/10b and 12a/12b)
  if (addrs[0]) {
    const a = addrs[0];
    setText(form, 'Pt1Line9_StreetNumberName', a.street);
    setText(form, 'Pt1Line9_Unit_p1_ch3',      a.unitType);
    setText(form, 'Pt1Line9_AptSteFlrNumber',  a.unitNum);
    setText(form, 'Pt1Line9_CityOrTown',       a.city);
    setText(form, 'Pt1Line9_State',            a.state);
    setText(form, 'Pt1Line9_ZipCode',          a.zip);
    setText(form, 'Pt1Line10a_DateFrom',       fmtDate(a.from));
    setText(form, 'Pt1Line10b_DateFrom',       fmtDate(a.to));
  }
  if (addrs[1]) {
    const a = addrs[1];
    setText(form, 'Pt1Line11_StreetNumberName', a.street);
    setText(form, 'Pt1Line11_Unit_p1_ch3',      a.unitType);
    setText(form, 'Pt1Line11_AptSteFlrNumber',  a.unitNum);
    setText(form, 'Pt1Line11_CityOrTown',       a.city);
    setText(form, 'Pt1Line11_State',            a.state);
    setText(form, 'Pt1Line11_ZipCode',          a.zip);
    setText(form, 'Pt1Line12a_DateFrom',        fmtDate(a.from));
    setText(form, 'Pt1Line12b_ToFrom',          fmtDate(a.to));
  }
  if (addrs[2]) {
    const a = addrs[2];
    setText(form, 'Pt1Line14_StreetNumberName', a.street);
    setText(form, 'Pt1Line14_Unit_p1_ch3',      a.unitType);
    setText(form, 'Pt1Line14_AptSteFlrNumber',  a.unitNum);
    setText(form, 'Pt1Line14_CityOrTown',       a.city);
    setText(form, 'Pt1Line14_State',            a.state);
    setText(form, 'Pt1Line14_ZipCode',          a.zip);
  }
  if (addrs[3]) {
    const a = addrs[3];
    setText(form, 'Pt1Line18_StreetNumberName', a.street);
    setText(form, 'Pt1Line18_Unit_p1_ch3',      a.unitType);
    setText(form, 'Pt1Line18_AptSteFlrNumber',  a.unitNum);
    setText(form, 'Pt1Line18_CityOrTown',       a.city);
    setText(form, 'Pt1Line18_State',            a.state);
    setText(form, 'Pt1Line18_ZipCode',          a.zip);
  }

  // Employment (current + prior)
  if (emps[0]) {
    const e = emps[0];
    setText(form, 'Pt1Line13_NameofEmployer',   e.name);
    setText(form, 'Pt1Line15_Occupation',       e.occupation);
    setText(form, 'Pt1Line14_StreetNumberName', e.street);
    setText(form, 'Pt1Line14_Unit_p1_ch3',      e.unitType);
    setText(form, 'Pt1Line14_AptSteFlrNumber',  e.unitNum);
    setText(form, 'Pt1Line14_CityOrTown',       e.city);
    setText(form, 'Pt1Line14_State',            e.state);
    setText(form, 'Pt1Line14_ZipCode',          e.zip);
    setText(form, 'Pt1Line16a_DateFrom',        fmtDate(e.from));
    setText(form, 'Pt1Line16b_ToFrom',          fmtDate(e.to));
  }
  if (emps[1]) {
    const e = emps[1];
    setText(form, 'Pt1Line17_NameofEmployer',   e.name);
    setText(form, 'Pt1Line19_Occupation',       e.occupation);
    setText(form, 'Pt1Line18_StreetNumberName', e.street);
    setText(form, 'Pt1Line18_Unit_p1_ch3',      e.unitType);
    setText(form, 'Pt1Line18_AptSteFlrNumber',  e.unitNum);
    setText(form, 'Pt1Line18_CityOrTown',       e.city);
    setText(form, 'Pt1Line18_State',            e.state);
    setText(form, 'Pt1Line18_ZipCode',          e.zip);
    setText(form, 'Pt1Line20a_DateFrom',        fmtDate(e.from));
    setText(form, 'Pt1Line20b_ToFrom',          fmtDate(e.to));
  }

  // ===============================
  // Part 2 — Beneficiary
  // ===============================

  setText(form, 'Pt2Line1a_FamilyName', ben.lastName);
  setText(form, 'Pt2Line1b_GivenName',  ben.firstName);
  setText(form, 'Pt2Line1c_MiddleName', ben.middleName);

  const benOther = Array.isArray(ben.otherNames) ? ben.otherNames : [];
  if (benOther[0]) {
    setText(form, 'Pt2Line10a_FamilyName', benOther[0].lastName);
    setText(form, 'Pt2Line10b_GivenName',  benOther[0].firstName);
    setText(form, 'Pt2Line10c_MiddleName', benOther[0].middleName);
  }

  setText(form, 'Pt2Line2_AlienNumber', ben.alienNumber);
  setText(form, 'Pt2Line3_SSN',         ben.ssn);
  setText(form, 'Pt2Line4_DateOfBirth', fmtDate(ben.dob));
  setText(form, 'Pt2Line7_CityTownOfBirth', ben.birthCity);
  setText(form, 'Pt2Line8_CountryOfBirth',  ben.birthCountry);
  setText(form, 'Pt2Line9_CountryofCitzOrNationality', ben.citizenship);

  // Beneficiary mailing (Pt2Line11) + “current physical” (Pt2Line14)
  setText(form, 'Pt2Line11_InCareOfName',        ''); // leave blank unless you add it to UI
  setText(form, 'Pt2Line11_StreetNumberName',    benMail.street);
  setText(form, 'Pt2Line11_Unit_p4_ch3',         benMail.unitType);
  setText(form, 'Pt2Line11_AptSteFlrNumber',     benMail.unitNum);
  setText(form, 'Pt2Line11_CityOrTown',          benMail.city);
  setText(form, 'Pt2Line11_State',               benMail.state);
  setText(form, 'Pt2Line11_ZipCode',             benMail.zip);

  if (benAddrs[0]) {
    const a = benAddrs[0];
    setText(form, 'Pt2Line14_StreetNumberName', a.street);
    setText(form, 'Pt2Line14_Unit_p4_ch3',      a.unitType);
    setText(form, 'Pt2Line14_AptSteFlrNumber',  a.unitNum);
    setText(form, 'Pt2Line14_CityOrTown',       a.city);
    setText(form, 'Pt2Line14_State',            a.state);
    setText(form, 'Pt2Line14_ZipCode',          a.zip);
  }

  // Beneficiary employment (Pt2Line16/17/18/19/20 + 15/19 dates)
  if (benEmps[0]) {
    const e = benEmps[0];
    setText(form, 'Pt2Line16_NameofEmployer',   e.name);
    setText(form, 'Pt2Line18_Occupation',       e.occupation);
    setText(form, 'Pt2Line17_StreetNumberName', e.street);
    setText(form, 'Pt2Line17_Unit_p4_ch3',      e.unitType);
    setText(form, 'Pt2Line17_AptSteFlrNumber',  e.unitNum);
    setText(form, 'Pt2Line17_CityOrTown',       e.city);
    setText(form, 'Pt2Line17_State',            e.state);
    setText(form, 'Pt2Line17_ZipCode',          e.zip);
    setText(form, 'Pt2Line15a_DateFrom',        fmtDate(e.from));
    setText(form, 'Pt2Line15b_ToFrom',          fmtDate(e.to));
  }
  if (benEmps[1]) {
    const e = benEmps[1];
    setText(form, 'Pt2Line20_NameofEmployer',   e.name);
    setText(form, 'Pt2Line22_Occupation',       e.occupation);
    setText(form, 'Pt2Line21_StreetNumberName', e.street);
    setText(form, 'Pt2Line21_Unit_p5_ch3',      e.unitType);
    setText(form, 'Pt2Line21_AptSteFlrNumber',  e.unitNum);
    setText(form, 'Pt2Line21_CityOrTown',       e.city);
    setText(form, 'Pt2Line21_State',            e.state);
    setText(form, 'Pt2Line21_ZipCode',          e.zip);
    setText(form, 'Pt2Line23a_DateFrom',        fmtDate(e.from));
    setText(form, 'Pt2Line23b_ToFrom',          fmtDate(e.to));
  }

  // Beneficiary parents (simplified to names/country)
  const p1 = parents.parent1 || {};
  const p2 = parents.parent2 || {};
  setText(form, 'Pt2Line40a_FamilyName', p1.lastName);
  setText(form, 'Pt2Line40b_GivenName',  p1.firstName);
  setText(form, 'Pt2Line40c_MiddleName', p1.middleName);
  setText(form, 'Pt2Line41_CountryOfBirth', p1.country);
  setText(form, 'Pt2Line49a_FamilyName', p2.lastName);
  setText(form, 'Pt2Line49b_GivenName',  p2.firstName);
  setText(form, 'Pt2Line49c_MiddleName', p2.middleName);
  // If you capture parent DOBs, set Pt2Line42_DateofBirth etc.

  // Travel/arrival
  setText(form, 'Pt2Line38a_LastArrivedAs',      travel.lastArrivedAs);
  setText(form, 'Pt2Line38b_ArrivalDeparture',   travel.i94);
  setText(form, 'Pt2Line38c_DateofArrival',      fmtDate(travel.arrivalDate));
  setText(form, 'Pt2Line38d_DateExpired',        fmtDate(travel.expiredDate));
  setText(form, 'Pt2Line38e_Passport',           travel.passport);
  setText(form, 'Pt2Line38f_TravelDoc',          travel.travelDoc);
  setText(form, 'Pt2Line38g_CountryOfIssuance',  travel.countryOfIssuance);
  setText(form, 'Pt2Line38h_ExpDate',            fmtDate(travel.passportExpDate));

  // Relationship description (if used on your edition)
  setText(form, 'Pt2Line52_Relationship', ben.relationship);
  setText(form, 'Pt2Line54_Describe', ben.relationshipDescribe);

  // ===============================
  // Part 3–4 — Biographic
  // ===============================
  setText(form, 'Pt4Line3_HeightFeet',   bio.heightFeet);
  setText(form, 'Pt4Line3_HeightInches', bio.heightInches);
  setText(form, 'Pt4Line6_HairColor_p8_ch9', bio.hairColor);
  // race/ethnicity checkboxes vary by template; we capture free-text:
  setText(form, 'Pt3Line4b_AdditionalInformation', bio.raceNotes);

  // ===============================
  // Part 5 — Petitioner Contact & Signature
  // ===============================
  setText(form, 'Pt5Line1_DaytimePhoneNumber1', contact.petitionerDayPhone);
  setText(form, 'Pt5Line2_MobileNumber1',       contact.petitionerMobile);
  setText(form, 'Pt5Line3_Email',               contact.petitionerEmail);
  setText(form, 'Pt5Line4_DateOfSignature',     fmtDate(contact.petitionerSignDate));

  // ===============================
  // Part 6 — Interpreter
  // ===============================
  const it = contact.interpreter || {};
  setText(form, 'Pt6Line1_InterpreterFamilyName', it.lastName);
  setText(form, 'Pt6Line1_InterpreterGivenName',  it.firstName);
  setText(form, 'Pt6Line2_NameofBusinessorOrgName', it.business);
  setText(form, 'Pt6Line4_InterpreterDaytimeTelephone_p9_n1', it.daytimePhone1);
  setText(form, 'Pt6Line4_InterpreterDaytimeTelephone_p9_n2', it.daytimePhone2);
  setText(form, 'Pt6Line5_Email', it.email);
  setText(form, 'Pt6_NameOfLanguage', it.language);
  setText(form, 'Pt6Line6_DateofSignature', fmtDate(it.signDate));

  // ===============================
  // Part 7 — Preparer
  // ===============================
  const pr = contact.preparer || {};
  setText(form, 'Pt7Line1_PreparerFamilyName', pr.lastName);
  setText(form, 'Pt7Line1b_PreparerGivenName', pr.firstName);
  setText(form, 'Pt7Line2_NameofBusinessorOrgName', pr.business);
  setText(form, 'Pt7Line3_DaytimePhoneNumber1', pr.dayPhone);
  setText(form, 'Pt7Line4_PreparerMobileNumber', pr.mobile);
  setText(form, 'Pt7Line5_Email', pr.email);
  setText(form, 'Pt7Line6_DateofSignature', fmtDate(pr.signDate));

  // ===============================
  // Part 8 — Additional Information (auto overflow)
  // ===============================
  const addenda = [];

  // Petitioner: extra other names beyond first -> Part 1, Item 6
  if (petOther.length > 1) {
    for (let i = 1; i < petOther.length; i++) {
      const n = petOther[i];
      addenda.push({
        page: '1', part: '1', item: '6',
        text: `Additional Other Name #${i+1} — Family: ${n.lastName||''}; Given: ${n.firstName||''}; Middle: ${n.middleName||''}`
      });
    }
  }

  // Petitioner: extra addresses beyond the 4 rows
  if (addrs.length > 4) {
    for (let i = 4; i < addrs.length; i++) {
      const a = addrs[i];
      addenda.push({
        page: '1', part: '1', item: '9–20',
        text: `Additional Address #${i+1} — ${a.street||''} ${a.unitType||''} ${a.unitNum||''}, ${a.city||''}, ${a.state||''} ${a.zip||''}; From ${fmtDate(a.from)} To ${fmtDate(a.to)}`
      });
    }
  }

  // Petitioner: extra employers beyond 2
  if (emps.length > 2) {
    for (let i = 2; i < emps.length; i++) {
      const e = emps[i];
      addenda.push({
        page: '1', part: '1', item: '13–20',
        text: `Additional Employer #${i+1} — ${e.name||''}, ${e.occupation||''}, ${e.street||''} ${e.unitType||''} ${e.unitNum||''}, ${e.city||''}, ${e.state||''} ${e.zip||''}; From ${fmtDate(e.from)} To ${fmtDate(e.to)}`
      });
    }
  }

  // Beneficiary: extra other names beyond first -> Part 2, Item 10
  if (benOther.length > 1) {
    for (let i = 1; i < benOther.length; i++) {
      const n = benOther[i];
      addenda.push({
        page: '2', part: '2', item: '10',
        text: `Beneficiary Additional Other Name #${i+1} — Family: ${n.lastName||''}; Given: ${n.firstName||''}; Middle: ${n.middleName||''}`
      });
    }
  }

  // Beneficiary: extra addresses beyond the rows shown (Pt2Line11/14 capture first)
  if (benAddrs.length > 1) {
    for (let i = 1; i < benAddrs.length; i++) {
      const a = benAddrs[i];
      addenda.push({
        page: '2', part: '2', item: '11/14',
        text: `Beneficiary Additional Address #${i+1} — ${a.street||''} ${a.unitType||''} ${a.unitNum||''}, ${a.city||''}, ${a.state||''} ${a.zip||''}; From ${fmtDate(a.from)} To ${fmtDate(a.to)}`
      });
    }
  }

  // Beneficiary: extra employers beyond 2
  if (benEmps.length > 2) {
    for (let i = 2; i < benEmps.length; i++) {
      const e = benEmps[i];
      addenda.push({
        page: '2', part: '2', item: '15–23',
        text: `Beneficiary Additional Employer #${i+1} — ${e.name||''}, ${e.occupation||''}, ${e.street||''} ${e.unitType||''} ${e.unitNum||''}, ${e.city||''}, ${e.state||''} ${e.zip||''}; From ${fmtDate(e.from)} To ${fmtDate(e.to)}`
      });
    }
  }

  fillAddenda(form, addenda);
}
