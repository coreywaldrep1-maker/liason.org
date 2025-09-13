// lib/i129f-mapping.js
//
// Maps your app's JSON model -> official I-129F PDF field names.
// Parts 1–8 covered, with sensible defaults and overflow to Part 8.
//
// NOTE: This assumes your in-app data model roughly follows:
// {
//   petitioner: {
//     lastName, firstName, middleName, aNumber, uscisAccount, ssn, dob,
//     birthCity, birthProvince, birthCountry, citizenship,
//     otherNames: [ {lastName, firstName, middleName}, ... ],
//     mailing: { inCareOf, street, unitType, unitNum, city, state, zip, province, postal, country },
//     physicalAddresses: [ {street, unitType, unitNum, city, state, zip, province, postal, country, from, to}, ...],
//     employment: [ {employer, occupation, street, unitType, unitNum, city, state, zip, province, postal, country, from, to}, ...],
//     parents: [ { lastName, firstName, middleName, dob, sex, birthCity, birthCountry, country }, ... ],
//     priorSpouses: [ { lastName, firstName, middleName, dateMarriageEnded }, ... ],
//     priorI129f: [ { aNumber, lastName, firstName, middleName, uscisAction }, ... ],
//     residenceSince18: [ { state, country }, ... ],
//   },
//   beneficiary: {
//     lastName, firstName, middleName, aNumber, ssn, dob,
//     birthCity, birthCountry, citizenship,
//     otherNames: [ ... ],
//     mailing: { inCareOf, street, unitType, unitNum, city, state, zip, province, postal, country, from, to },
//     employment: [ {employer, occupation, street, unitType, unitNum, city, state, zip, province, postal, country, from, to}, ... ],
//     passports: { passportNumber, travelDocNumber, countryOfIssuance, expDate },
//     lastArrival: { classOfAdmission, i94, dateArrival, dateExpired },
//     parents: [ ... ],
//     contact: { dayPhone, mobile, email },
//     physical: { heightFeet, heightInches, eyeColor, hairColor, raceWhite, raceBlack, raceAsian, raceNative, raceIslander },
//     relationship: { metInPersonYes, waived2yr, intlMarriageBroker: {...}, etc. }
//   },
//   relationship: { howMet, dates, priorMarriages, metInPersonYes, explanation },
//   contact: { dayPhone, mobile, email, signDate },
//   interpreter: { lastName, firstName, org, phone1, phone2, email, signDate, language },
//   preparer: { lastName, firstName, org, phone, mobile, email, signDate },
//   part8: [ { page, part, item, info }, ... ],
//   // Optional UX helper:
//   mailingSameAsPhysical: true, mailingFromDate: '01/01/2022'
// }

///////////////
// UTILITIES //
///////////////

function set(fields, name, val) {
  if (val === undefined || val === null) return;
  const s = String(val).trim();
  if (s) fields[name] = s;
}

function setNameTriplet(fields, base, obj = {}) {
  set(fields, `${base}a_FamilyName`, obj.lastName);
  set(fields, `${base}b_GivenName`, obj.firstName);
  set(fields, `${base}c_MiddleName`, obj.middleName);
}

function setAddress(fields, base, a = {}) {
  set(fields, `${base}_StreetNumberName`, a.street);
  set(fields, `${base}_Unit_p0_ch3`, a.unitType);
  set(fields, `${base}_AptSteFlrNumber`, a.unitNum);
  set(fields, `${base}_CityOrTown`, a.city);
  set(fields, `${base}_State`, a.state);
  set(fields, `${base}_ZipCode`, a.zip);
  set(fields, `${base}_Province`, a.province);
  set(fields, `${base}_PostalCode`, a.postal);
  set(fields, `${base}_Country`, a.country);
}

function setFromTo(fields, fromName, toName, obj = {}) {
  set(fields, fromName, obj.from);
  set(fields, toName, obj.to);
}

function setYes(fields, name, value) {
  if (value === true || value === 'Yes' || value === 'Y' || value === 'On' || value === '1') {
    fields[name] = 'Yes';
  }
}

// Part 8: 3..7 slots (3a..3d, 4a..4d, 5a..5d, 6a..6d, 7a..7d)
function addPart8Line(fields, slotIndex, { page, part, item, info }) {
  const bases = ['Line3', 'Line4', 'Line5', 'Line6', 'Line7'];
  const base = bases[slotIndex];
  if (!base) return;
  set(fields, `${base}a_PageNumber`, page);
  set(fields, `${base}b_PartNumber`, part);
  set(fields, `${base}c_ItemNumber`, item);
  set(fields, `${base}d_AdditionalInfo`, info);
}

function overflowToPart8FromNames(fields, list = [], startSlot = 0, page, part, item) {
  let slot = startSlot;
  for (let i = 1; i < list.length && slot < 5; i++, slot++) {
    const n = list[i] || {};
    const info = `${n.lastName || ''}, ${n.firstName || ''} ${n.middleName || ''}`.trim();
    if (info) addPart8Line(fields, slot, { page, part, item, info });
  }
  return startSlot + Math.max(0, list.length - 1);
}

function overflowToPart8FromText(fields, texts = [], startSlot = 0, page, part, item) {
  let slot = startSlot;
  for (let i = 0; i < texts.length && slot < 5; i++, slot++) {
    const info = texts[i];
    if (info) addPart8Line(fields, slot, { page, part, item, info });
  }
  return slot;
}

//////////////////////////////
// PART-SPECIFIC MAPPINGS   //
//////////////////////////////

function mapPart1(fields, model) {
  const p = model.petitioner || {};
  const m = model.mailing || {};
  const addrs = Array.isArray(model.physicalAddresses) ? model.physicalAddresses : [];
  const jobs = Array.isArray(model.employment) ? model.employment : [];

  // Optional helper: Mailing = Physical #1
  if (model.mailingSameAsPhysical) {
    const addr0 = {
      street: m.street, unitType: m.unitType, unitNum: m.unitNum,
      city: m.city, state: m.state, zip: m.zip,
      province: m.province, postal: m.postal, country: m.country,
      from: model.mailingFromDate || m.from || '', to: 'Present',
    };
    if (!addrs[0]) addrs[0] = addr0; else Object.assign(addrs[0], addr0);
  }

  // IDs
  set(fields, 'Pt1Line1_AlienNumber', p.aNumber);
  set(fields, 'Pt1Line2_AcctIdentifier', p.uscisAccount);
  set(fields, 'Pt1Line3_SSN', p.ssn);

  // Legal name (Line 6)
  setNameTriplet(fields, 'Pt1Line6', p);

  // Other names (Line 7) – first one; overflow -> Part 8
  if (Array.isArray(p.otherNames) && p.otherNames[0]) {
    setNameTriplet(fields, 'Pt1Line7', p.otherNames[0]);
  }

  // Mailing (Line 8)
  set(fields, 'Pt1Line8_InCareofName', m.inCareOf);
  setAddress(fields, 'Pt1Line8', m);
  // Example: same as physical? (checkbox if your template has it)
  // setYes(fields, 'Pt1Line8j_Checkboxes_p0_ch2', model.mailingSameAsPhysical);

  // Physical address history
  const a0 = addrs[0] || {};
  const a1 = addrs[1] || {};
  const a2 = addrs[2] || {};

  setAddress(fields, 'Pt1Line9', a0);
  set(fields, 'Pt1Line10a_DateFrom', a0.from);
  set(fields, 'Pt1Line10b_DateFrom', a0.to);

  setAddress(fields, 'Pt1Line11', a1);
  set(fields, 'Pt1Line12a_DateFrom', a1.from);
  set(fields, 'Pt1Line12b_ToFrom', a1.to);

  setAddress(fields, 'Pt1Line14', a2);
  // Pt1Line13/15/16 are employment #1; Pt1Line17/18/19/20 are employment #2

  // Employment (first two)
  const e0 = jobs[0] || {};
  const e1 = jobs[1] || {};
  set(fields, 'Pt1Line13_NameofEmployer', e0.employer);
  setAddress(fields, 'Pt1Line14', e0); // note: shares same block name in your template
  set(fields, 'Pt1Line15_Occupation', e0.occupation);
  set(fields, 'Pt1Line16a_DateFrom', e0.from);
  set(fields, 'Pt1Line16b_ToFrom', e0.to);

  set(fields, 'Pt1Line17_NameofEmployer', e1.employer);
  setAddress(fields, 'Pt1Line18', e1);
  set(fields, 'Pt1Line19_Occupation', e1.occupation);
  set(fields, 'Pt1Line20a_DateFrom', e1.from);
  set(fields, 'Pt1Line20b_ToFrom', e1.to);

  // Biographical (DOB, POB, etc.) — based on your field list
  set(fields, 'Pt1Line11_DateofBirth', p.dob);
  set(fields, 'Pt1Line24_CityTownOfBirth', p.birthCity);
  set(fields, 'Pt1Line25_ProvinceOrStateOfBirth', p.birthProvince);
  set(fields, 'Pt1Line26_CountryOfCitzOrNationality', p.citizenship);

  // Parents (Line 27..31)
  const par0 = (p.parents || [])[0] || {};
  const par1 = (p.parents || [])[1] || {};
  setNameTriplet(fields, 'Pt1Line27', par0); // 27a/b/c
  set(fields, 'Pt1Line28_DateofBirth', par0.dob);
  // 29 might be living? checkbox in your list: Pt1Line29_Checkbox_p2_ch2
  setYes(fields, 'Pt1Line29_Checkbox_p2_ch2', par0.living);
  set(fields, 'Pt1Line30_CountryOfCitzOrNationality', par0.country);
  set(fields, 'Pt1Line31_CityTownOfBirth', par0.birthCity);
  set(fields, 'Pt1Line31_CountryOfCitzOrNationality', par0.birthCountry);

  setNameTriplet(fields, 'Pt1Line32', par1); // 32a/b/c
  set(fields, 'Pt1Line33_DateofBirth', par1.dob);
  setYes(fields, 'Pt1Line34_Checkbox_p2_ch2', par1.living);
  set(fields, 'Pt1Line35_CountryOfCitzOrNationality', par1.country);
  set(fields, 'Pt1Line36a_CityTownOfBirth', par1.birthCity);
  set(fields, 'Pt1Line36b_CountryOfCitzOrNationality', par1.birthCountry);

  // Prior spouse(s) – first one (Lines 38–39, 45–46 suggest prior details)
  const ps0 = (p.priorSpouses || [])[0] || {};
  set(fields, 'Pt1Line38a_FamilyName', ps0.lastName);
  set(fields, 'Pt1Line38b_GivenName', ps0.firstName);
  set(fields, 'Pt1Line38c_MiddleName', ps0.middleName);
  set(fields, 'Pt1Line39_DateMarriageEnded', ps0.dateMarriageEnded);

  // Naturalization/citizenship (42..44)
  set(fields, 'Pt1Line42a_NaturalizationNumber', p.natzNumber);
  set(fields, 'Pt1Line42b_NaturalizationPlaceOfIssuance', p.natzPlace);
  set(fields, 'Pt1Line42c_DateOfIssuance', p.natzDate);
  set(fields, 'Pt1Line44_A_Number', p.aNumberAlt);

  // Prior I-129F (45–47)
  const pr0 = (p.priorI129f || [])[0] || {};
  set(fields, 'Pt1Line45a_FamilyNameLastName', pr0.lastName);
  set(fields, 'Pt1Line45b_GivenNameFirstName', pr0.firstName);
  set(fields, 'Pt1Line45c_MiddleName', pr0.middleName);
  set(fields, 'Pt1Line46_DateOfFilling', pr0.filingDate);
  set(fields, 'Pt1Line47_Result', pr0.uscisAction);

  // Residence since 18 (50–51)
  const rs18_0 = (p.residenceSince18 || [])[0] || {};
  const rs18_1 = (p.residenceSince18 || [])[1] || {};
  set(fields, 'Pt1Line50a_State', rs18_0.state);
  set(fields, 'Pt1Line50b_CountryOfCitzOrNationality', rs18_0.country);
  set(fields, 'Pt1Line51a_State', rs18_1.state);
  set(fields, 'Pt1Line51b_CountryOfCitzOrNationality', rs18_1.country);

  // Overflow: other names beyond first -> Part 8
  let slot = 0;
  slot = overflowToPart8FromNames(fields, p.otherNames || [], slot, '1', '1', '7');
}

function mapPart2(fields, model) {
  const b = model.beneficiary || {};
  const mail = b.mailing || {};
  const jobs = Array.isArray(b.employment) ? b.employment : [];

  // Legal name
  setNameTriplet(fields, 'Pt2Line1', b);

  // IDs & DOB
  set(fields, 'Pt2Line2_AlienNumber', b.aNumber);
  set(fields, 'Pt2Line3_SSN', b.ssn);
  set(fields, 'Pt2Line4_DateOfBirth', b.dob);

  // POB & citizenship
  set(fields, 'Pt2Line7_CityTownOfBirth', b.birthCity);
  set(fields, 'Pt2Line8_CountryOfBirth', b.birthCountry);
  set(fields, 'Pt2Line9_CountryofCitzOrNationality', b.citizenship);

  // Other names (first)
  if (Array.isArray(b.otherNames) && b.otherNames[0]) {
    setNameTriplet(fields, 'Pt2Line10', b.otherNames[0]);
  }

  // Mailing/current address + dates (11/14/15)
  set(fields, 'Pt2Line11_InCareOfName', mail.inCareOf);
  setAddress(fields, 'Pt2Line11', mail);
  setAddress(fields, 'Pt2Line14', mail);
  set(fields, 'Pt2Line15a_DateFrom', mail.from);
  set(fields, 'Pt2Line15b_ToFrom', mail.to);

  // Employment (we map two)
  const e0 = jobs[0] || {};
  const e1 = jobs[1] || {};
  set(fields, 'Pt2Line16_NameofEmployer', e0.employer);
  setAddress(fields, 'Pt2Line21', e0);
  set(fields, 'Pt2Line22_Occupation', e0.occupation);
  set(fields, 'Pt2Line23a_DateFrom', e0.from);
  set(fields, 'Pt2Line23b_ToFrom', e0.to);

  set(fields, 'Pt2Line20_NameofEmployer', e1.employer);
  setAddress(fields, 'Pt2Line21', e1);
  set(fields, 'Pt2Line22_Occupation', e1.occupation);
  set(fields, 'Pt2Line23a_DateFrom', e1.from);
  set(fields, 'Pt2Line23b_ToFrom', e1.to);

  // Last arrival / passport (38 a–h)
  const la = b.lastArrival || {};
  const pp = b.passports || {};
  set(fields, 'Pt2Line38a_LastArrivedAs', la.classOfAdmission);
  set(fields, 'Pt2Line38b_ArrivalDeparture', la.i94);
  set(fields, 'Pt2Line38c_DateofArrival', la.dateArrival);
  set(fields, 'Pt2Line38d_DateExpired', la.dateExpired);
  set(fields, 'Pt2Line38e_Passport', pp.passportNumber);
  set(fields, 'Pt2Line38f_TravelDoc', pp.travelDocNumber);
  set(fields, 'Pt2Line38g_CountryOfIssuance', pp.countryOfIssuance);
  set(fields, 'Pt2Line38h_ExpDate', pp.expDate);

  // Father/mother (40–43, 49–51)
  const bp0 = (b.parents || [])[0] || {};
  const bp1 = (b.parents || [])[1] || {};
  setNameTriplet(fields, 'Pt2Line40', bp0);
  set(fields, 'Pt2Line41_CountryOfBirth', bp0.birthCountry);
  set(fields, 'Pt2Line42_DateofBirth', bp0.dob);
  setYes(fields, 'Pt2Line43_Checkboxes_p6_ch2', bp0.living);

  setNameTriplet(fields, 'Pt2Line49', bp1);
  set(fields, 'Pt2Line50_Unit_p6_ch3', bp1.birthCountry); // your template has unusual naming; keep as-is
  setYes(fields, 'Pt2Line51_Checkboxes_p7_ch3', bp1.living);

  // Contact & relationship bits (46–55, 62)
  const bc = b.contact || {};
  set(fields, 'Pt2Line46_DayTimeTelephoneNumber', bc.dayPhone);
  set(fields, 'Pt2Line47_Unit_p6_ch3', bc.mobile);
  set(fields, 'Pt2Line52_Relationship', b.relationshipToPetitioner);
  setYes(fields, 'Pt2Line53_Checkboxes_p7_ch3', b.metInPersonYes);
  set(fields, 'Pt2Line54_Describe', b.metExplanation);
  set(fields, 'Pt2Line62a_CityTown', b.placeIntendMarryCity);
  set(fields, 'Pt2Line62b_Country', b.placeIntendMarryCountry);

  // Other names overflow -> Part 8
  let slot = 0;
  slot = overflowToPart8FromNames(fields, b.otherNames || [], slot, '4', '2', '10');
}

function mapPart3(fields, model) {
  // Relationship questions / IMB / “met in last 2 years?” etc.
  // Using your template field names:
  const r = model.relationship || {};
  // Example mappings. Toggle 'Yes' based on booleans you collect:
  setYes(fields, 'Pt3Line1_Checkboxes_p7_ch2', r.metInPersonYes);
  setYes(fields, 'P3Line2a_Checkboxes_p7_ch2', r.intlMarriageBrokerUsed);
  setYes(fields, 'P3Line2b_Checkboxes_p8_ch2', r.imbProvidedInfo);
  setYes(fields, 'P3Line2c_Checkboxes_p8_ch2', r.imbPaidFees);
  setYes(fields, 'Pt3Line3_Checkboxes_p8_ch3', r.requestWaiver);
  setYes(fields, 'Pt3Line5_Checkboxes_p8_ch4', r.over55OrMedical); // example checkbox

  // IMB details (56–61)
  const imb = (model.beneficiary && model.beneficiary.intlMarriageBroker) || {};
  set(fields, 'Pt2Line56_IMB_Name', imb.name);
  set(fields, 'Pt2Line57a_FamilyNameIMB', imb.contactLastName);
  set(fields, 'Pt2Line57b_GivenNameOfIMB', imb.contactFirstName);
  set(fields, 'Pt2Line58_OrganizationNameOfIMB', imb.org);
  set(fields, 'Pt2Line59_WebsiteOfIMB', imb.website);
  set(fields, 'Pt2Line60a_StreetNumberAndName', imb.street);
  set(fields, 'Pt2Line60b_Number', imb.unitNum);
  set(fields, 'Pt2Line60c_CityOrTown', imb.city);
  set(fields, 'Pt2Line60d_Province', imb.province);
  set(fields, 'Pt2Line60e_PostalCode', imb.postal);
  set(fields, 'Pt2Line60f_Country', imb.country);
  set(fields, 'Pt2Line61_DaytimeTelephoneNumber', imb.phone);
}

function mapPart4(fields, model) {
  // Physical characteristics (usually BENEFICIARY)
  const phys = (model.beneficiary && model.beneficiary.physical) || {};

  // Race (checkbox set — names from your list)
  setYes(fields, 'Pt4Line2_Checkbox_p8_White', phys.raceWhite);
  setYes(fields, 'Pt4Line2_Checkbox_p8_BlackOrAfricanAmerrican', phys.raceBlack);
  setYes(fields, 'Pt4Line2_Checkbox_p8_Asian', phys.raceAsian);
  setYes(fields, 'Pt4Line2_Checkbox_p8_AmericanIndianOrAlaskaNative', phys.raceNative);
  setYes(fields, 'Pt4Line2_Checkbox_p8_NativeHawaiianOrPacificIslander', phys.raceIslander);

  // Eye/Hair (your template includes hair checkbox group + one text?)
  setYes(fields, 'Pt4Line5_Checkbox_p8_ch9', phys.eyeColorOther); // example: if "Other"
  set(fields, 'Pt4Line6_HairColor_p8_ch9', phys.hairColorText);   // if your PDF needs text

  // Height
  set(fields, 'Pt4Line3_HeightFeet', phys.heightFeet);
  set(fields, 'Pt4Line3_HeightInches', phys.heightInches);
  // Some templates split inches digits
  set(fields, 'Pt4Line4_HeightInches1', phys.heightInches1);
  set(fields, 'Pt4Line4_HeightInches2', phys.heightInches2);
  set(fields, 'Pt4Line4_HeightInches3', phys.heightInches3);

  // Extra checkbox in Part 4
  setYes(fields, 'Pt4Line1_Checkbox_p8_ch2', phys.descOther);
}

function mapPart5(fields, model) {
  // Petitioner contact + signature
  const c = model.contact || {};
  set(fields, 'Pt5Line1_DaytimePhoneNumber1', c.dayPhone);
  set(fields, 'Pt5Line2_MobileNumber1', c.mobile);
  set(fields, 'Pt5Line3_Email', c.email);
  set(fields, 'Pt5Line4_DateOfSignature', c.signDate);
}

function mapPart6(fields, model) {
  // Interpreter
  const t = model.interpreter || {};
  set(fields, 'Pt6_NameOfLanguage', t.language);
  set(fields, 'Pt6Line1_InterpreterFamilyName', t.lastName);
  set(fields, 'Pt6Line1_InterpreterGivenName', t.firstName);
  set(fields, 'Pt6Line2_NameofBusinessorOrgName', t.org);
  // Phone appears split in template (p9_n1 / p9_n2) — fill what you have
  set(fields, 'Pt6Line4_InterpreterDaytimeTelephone_p9_n1', t.phone1);
  set(fields, 'Pt6Line4_InterpreterDaytimeTelephone_p9_n2', t.phone2);
  set(fields, 'Pt6Line5_Email', t.email);
  set(fields, 'Pt6Line6_DateofSignature', t.signDate);
}

function mapPart7(fields, model) {
  // Preparer
  const pr = model.preparer || {};
  set(fields, 'Pt7Line1_PreparerFamilyName', pr.lastName);
  set(fields, 'Pt7Line1b_PreparerGivenName', pr.firstName);
  set(fields, 'Pt7Line2_NameofBusinessorOrgName', pr.org);
  set(fields, 'Pt7Line3_DaytimePhoneNumber1', pr.phone);
  set(fields, 'Pt7Line4_PreparerMobileNumber', pr.mobile);
  set(fields, 'Pt7Line5_Email', pr.email);
  set(fields, 'Pt7Line6_DateofSignature', pr.signDate);
}

function mapPart8(fields, model) {
  // User-provided extra lines:
  const extras = Array.isArray(model.part8) ? model.part8 : [];
  let slot = 0;
  if (extras.length) {
    slot = overflowToPart8FromText(
      fields,
      extras.map(e => `${e.info || ''}`),
      slot,
      (extras[0]?.page || ''), (extras[0]?.part || ''), (extras[0]?.item || '')
    );
  }
}

/////////////////////////////////////////
// MAIN: Build fields + collect missing //
/////////////////////////////////////////

export function applyI129fMapping(model = {}) {
  const fields = {};
  const missing = [];

  // Parts 1–8
  mapPart1(fields, model);
  mapPart2(fields, model);
  mapPart3(fields, model);
  mapPart4(fields, model);
  mapPart5(fields, model);
  mapPart6(fields, model);
  mapPart7(fields, model);
  mapPart8(fields, model);

  // Minimal “missing” probe — expand as needed during testing
  const mustHave = [
    'petitioner.lastName', 'petitioner.firstName',
    'beneficiary.lastName', 'beneficiary.firstName',
  ];
  for (const k of mustHave) {
    const v = k.split('.').reduce((a, p) => (a ? a[p] : undefined), model);
    if (!v) missing.push(k);
  }

  return { fields, missing };
}

//////////////////////////////
// SECTION LIST (for UI)    //
//////////////////////////////

export const I129F_SECTIONS = [
  { key: 'p1_core', title: 'Part 1 — Petitioner (IDs & Names)' },
  { key: 'p1_mailing', title: 'Part 1 — Mailing Address' },
  { key: 'p1_addresses', title: 'Part 1 — Physical Addresses' },
  { key: 'p1_employment', title: 'Part 1 — Employment' },
  { key: 'p1_family', title: 'Part 1 — Parents & Prior Spouses' },
  { key: 'p2_core', title: 'Part 2 — Beneficiary (IDs & Names)' },
  { key: 'p2_mailing', title: 'Part 2 — Beneficiary: Mailing/Current Address' },
  { key: 'p2_employment', title: 'Part 2 — Beneficiary: Employment & Arrival/Passport' },
  { key: 'p2_parents', title: 'Part 2 — Beneficiary: Parents & Contact' },
  { key: 'p3_rel', title: 'Part 3 — Relationship Questions / IMB' },
  { key: 'p4_phys', title: 'Part 4 — Physical Characteristics' },
  { key: 'p5_contact', title: 'Part 5 — Petitioner Contact & Signature' },
  { key: 'p6_interp', title: 'Part 6 — Interpreter' },
  { key: 'p7_prep', title: 'Part 7 — Preparer' },
  { key: 'p8_addl', title: 'Part 8 — Additional Information' },
];
