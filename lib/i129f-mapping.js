// lib/i129f-mapping.js
//
// Maps your JSON `form` to the I-129F AcroForm field names.
// - Direct map for most Part 1 & Part 2 fields (more soon).
// - Helper mappers (name/address/employment/date ranges).
// - Fallback: anything not directly mapped prints into Part 8 "Additional Info".
//
// Exported:
//   - applyI129fMapping(form, pdfForm)
//   - I129F_SECTIONS (for /flow/us/i-129f/all-fields debug page)

function get(obj, path) {
  if (!obj) return undefined;
  return path.split('.').reduce((acc, k) => (acc ? acc[k] : undefined), obj);
}

function has(obj, path) { return get(obj, path) !== undefined; }

function setText(fieldMap, name, val) {
  const f = fieldMap.get(name);
  if (!f) return false;
  try {
    if (f.setText) f.setText(val ?? '');
    else if (f.setValue) f.setValue(String(val ?? ''));
    return true;
  } catch {
    return false;
  }
}

function setCheck(fieldMap, name, on = true) {
  const f = fieldMap.get(name);
  if (!f) return false;
  try {
    if (on) {
      if (f.check) f.check();
      else if (f.select) f.select('Yes');
      else if (f.setText) f.setText('Yes');
    } else {
      if (f.uncheck) f.uncheck();
      else if (f.setText) f.setText('No');
    }
    return true;
  } catch {
    return false;
  }
}

function normalizeBool(v) {
  if (typeof v === 'boolean') return v;
  const s = String(v ?? '').trim().toLowerCase();
  return s === 'y' || s === 'yes' || s === 'true' || s === '1';
}

function fmtDate(v) {
  if (!v) return '';
  // Accept "YYYY-MM-DD" or "MM/DD/YYYY" already
  const s = String(v).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[2]}/${m[3]}/${m[1]}`;
  return s;
}

// --- Structure helpers ------------------------------------------------------

function mapName(fieldMap, baseTarget, nameObj = {}) {
  setText(fieldMap, `${baseTarget}a_FamilyName`, nameObj.lastName || '');
  setText(fieldMap, `${baseTarget}b_GivenName`, nameObj.firstName || '');
  setText(fieldMap, `${baseTarget}c_MiddleName`, nameObj.middleName || '');
}

function mapAddressBlock(fieldMap, targetPrefix, addr = {}) {
  // handles both US + foreign
  setText(fieldMap, `${targetPrefix}_StreetNumberName`, addr.street || '');
  if (fieldMap.has(`${targetPrefix}_Unit_p0_ch3`) || fieldMap.has(`${targetPrefix}_Unit_p1_ch3`) || fieldMap.has(`${targetPrefix}_Unit_p4_ch3`) || fieldMap.has(`${targetPrefix}_Unit_p5_ch3`) || fieldMap.has(`${targetPrefix}_Unit_p6_ch3`)) {
    // unit type checkbox/group varies; keep in raw text field if present
    setText(fieldMap, `${targetPrefix}_Unit_p0_ch3`, addr.unitType || '');
    setText(fieldMap, `${targetPrefix}_Unit_p1_ch3`, addr.unitType || '');
    setText(fieldMap, `${targetPrefix}_Unit_p4_ch3`, addr.unitType || '');
    setText(fieldMap, `${targetPrefix}_Unit_p5_ch3`, addr.unitType || '');
    setText(fieldMap, `${targetPrefix}_Unit_p6_ch3`, addr.unitType || '');
  }
  setText(fieldMap, `${targetPrefix}_AptSteFlrNumber`, addr.unitNum || '');
  setText(fieldMap, `${targetPrefix}_CityOrTown`, addr.city || '');
  setText(fieldMap, `${targetPrefix}_State`, addr.state || '');
  setText(fieldMap, `${targetPrefix}_ZipCode`, addr.zip || '');
  // foreign
  setText(fieldMap, `${targetPrefix}_Province`, addr.province || '');
  setText(fieldMap, `${targetPrefix}_PostalCode`, addr.postal || '');
  setText(fieldMap, `${targetPrefix}_Country`, addr.country || '');
}

function mapEmploymentBlock(fieldMap, block, lines) {
  // lines = { name: 'Pt1Line13_NameofEmployer', addressPrefix:'Pt1Line14', occupation:'Pt1Line15', from:'Pt1Line16a_DateFrom', to:'Pt1Line16b_ToFrom' }
  if (!block) return;
  setText(fieldMap, lines.name, block.employer || '');
  mapAddressBlock(fieldMap, lines.addressPrefix, block);
  setText(fieldMap, lines.occupation, block.occupation || '');
  setText(fieldMap, lines.from, fmtDate(block.from));
  setText(fieldMap, lines.to, fmtDate(block.to));
}

// spill anything else into Part 8 additional info
function spillToPart8(fieldMap, lines) {
  // There are Line3..Line7 blocks for Additional Info
  const slots = [
    { a:'Line3a_PageNumber', b:'Line3b_PartNumber', c:'Line3c_ItemNumber', d:'Line3d_AdditionalInfo' },
    { a:'Line4a_PageNumber', b:'Line4b_PartNumber', c:'Line4c_ItemNumber', d:'Line4d_AdditionalInfo' },
    { a:'Line5a_PageNumber', b:'Line5b_PartNumber', c:'Line5c_ItemNumber', d:'Line5d_AdditionalInfo' },
    { a:'Line6a_PageNumber', b:'Line6b_PartNumber', c:'Line6c_ItemNumber', d:'Line6d_AdditionalInfo' },
    { a:'Line7a_PageNumber', b:'Line7b_PartNumber', c:'Line7c_ItemNumber', d:'Line7d_AdditionalInfo' },
  ];

  let i = 0;
  for (const item of lines) {
    const s = slots[i++];
    if (!s) break;
    // Try to parse "PtX LineY" from the key if present
    // Fallback to Part=8, Item=“Unmapped”
    const match = item.hint?.match(/^Pt(\d+)Line(\w+)/i);
    const part = match ? match[1] : '8';
    const itemNo = match ? `Line${match[2]}` : 'Unmapped';
    setText(fieldMap, s.a, item.page || '—');
    setText(fieldMap, s.b, part);
    setText(fieldMap, s.c, itemNo);
    setText(fieldMap, s.d, `${item.key}: ${item.value}`);
  }
}

// --------------------------------------------------------------------------------

/**
 * Main entry — map JSON to PDF fields
 * @param {object} form - your saved/posted JSON
 * @param {import('pdf-lib').PDFForm} pdfForm
 */
export function applyI129fMapping(form = {}, pdfForm) {
  const fieldMap = new Map();
  for (const f of pdfForm.getFields()) {
    fieldMap.set(f.getName(), f);
  }

  // Keep track of values we couldn't place – we’ll dump them into Part 8
  const leftovers = [];

  function put(path, pdfField) {
    if (!has(form, path)) return;
    const val = get(form, path);
    const ok = setText(fieldMap, pdfField, val ?? '');
    if (!ok) leftovers.push({ key: path, value: val ?? '', hint: pdfField });
  }
  function putDate(path, pdfField) {
    if (!has(form, path)) return;
    const val = fmtDate(get(form, path));
    const ok = setText(fieldMap, pdfField, val);
    if (!ok) leftovers.push({ key: path, value: val, hint: pdfField });
  }
  function putBool(path, pdfField) {
    if (!has(form, path)) return;
    const val = normalizeBool(get(form, path));
    const ok = setCheck(fieldMap, pdfField, val);
    if (!ok) leftovers.push({ key: path, value: String(val), hint: pdfField });
  }

  // -----------------------
  // PART 1 — Petitioner
  // -----------------------

  // IDs
  put('petitioner.aNumber', 'Pt1Line1_AlienNumber');
  put('petitioner.uscisOnlineAcct', 'Pt1Line2_AcctIdentifier');
  put('petitioner.ssn', 'Pt1Line3_SSN');

  // Name (corrected to 6a–6c)
  mapName(fieldMap, 'Pt1Line6', form.petitioner);

  // Other names used — map first 1 set to 7a–7c
  if (form.petitioner?.otherNames && form.petitioner.otherNames[0]) {
    mapName(fieldMap, 'Pt1Line7', form.petitioner.otherNames[0]);
  }

  // Mailing address — Line 8a–8j
  mapAddressBlock(fieldMap, 'Pt1Line8', form.mailing || {});

  // Physical address history (map first three blocks: 9, 11, 14)
  const addrs = form.physicalAddresses || [];
  if (addrs[0]) mapAddressBlock(fieldMap, 'Pt1Line9', addrs[0]);
  putDate('physicalAddresses.0.from', 'Pt1Line10a_DateFrom');
  putDate('physicalAddresses.0.to',   'Pt1Line10b_DateFrom'); // (form's "to" — fieldname is odd, but present)

  if (addrs[1]) mapAddressBlock(fieldMap, 'Pt1Line11', addrs[1]);
  putDate('physicalAddresses.1.from', 'Pt1Line12a_DateFrom');
  putDate('physicalAddresses.1.to',   'Pt1Line12b_ToFrom');

  if (addrs[2]) mapAddressBlock(fieldMap, 'Pt1Line14', addrs[2]);

  // Employment (two blocks)
  const emps = form.employment || [];
  if (emps[0]) mapEmploymentBlock(fieldMap, emps[0], {
    name: 'Pt1Line13_NameofEmployer',
    addressPrefix: 'Pt1Line14',
    occupation: 'Pt1Line15_Occupation',
    from: 'Pt1Line16a_DateFrom',
    to:   'Pt1Line16b_ToFrom',
  });

  if (emps[1]) mapEmploymentBlock(fieldMap, emps[1], {
    name: 'Pt1Line17_NameofEmployer',
    addressPrefix: 'Pt1Line18',
    occupation: 'Pt1Line19_Occupation',
    from: 'Pt1Line20a_DateFrom',
    to:   'Pt1Line20b_ToFrom',
  });

  // Petitioner Demographics (Part 1 ~ Lines 21-37; wire the obvious ones)
  putBool('petitioner.sex.male', 'Pt1Line21_Checkbox_p2_ch2');               // Male
  putDate('petitioner.dob', 'Pt1Line22_DateofBirth');                         // DOB
  putBool('petitioner.usCitizen', 'Pt1Line23_Checkbox_p2_ch4');               // US Citizen? (checkbox set)
  put('petitioner.cityOfBirth', 'Pt1Line24_CityTownOfBirth');
  put('petitioner.stateOfBirth', 'Pt1Line25_ProvinceOrStateOfBirth');
  put('petitioner.countryOfBirth', 'Pt1Line26_CountryOfCitzOrNationality');

  // Parents (27–33)
  if (form.petitioner?.parents) {
    const p0 = form.petitioner.parents[0];
    if (p0) {
      mapName(fieldMap, 'Pt1Line27', p0);
      putDate('petitioner.parents.0.dob', 'Pt1Line28_DateofBirth');
      putBool('petitioner.parents.0.alive', 'Pt1Line29_Checkbox_p2_ch2'); // if you track
      put('petitioner.parents.0.citizenshipCountry', 'Pt1Line30_CountryOfCitzOrNationality');
      put('petitioner.parents.0.cityOfBirth', 'Pt1Line31_CityTownOfBirth');
      put('petitioner.parents.0.countryOfBirth', 'Pt1Line31_CountryOfCitzOrNationality');
    }
    const p1 = form.petitioner.parents[1];
    if (p1) {
      mapName(fieldMap, 'Pt1Line32', p1);
      putDate('petitioner.parents.1.dob', 'Pt1Line33_DateofBirth');
      putBool('petitioner.parents.1.alive', 'Pt1Line34_Checkbox_p2_ch2');
      put('petitioner.parents.1.citizenshipCountry', 'Pt1Line35_CountryOfCitzOrNationality');
      put('petitioner.parents.1.cityOfBirth', 'Pt1Line36a_CityTownOfBirth');
      put('petitioner.parents.1.countryOfBirth', 'Pt1Line36b_CountryOfCitzOrNationality');
      // "37" is checkboxes; wire if you track
    }
  }

  // Prior spouses (38–41)
  if (form.petitioner?.priorSpouses && form.petitioner.priorSpouses[0]) {
    mapName(fieldMap, 'Pt1Line38', form.petitioner.priorSpouses[0]);
    putDate('petitioner.priorSpouses.0.marriageEnded', 'Pt1Line39_DateMarriageEnded');
    // 40 checkbox, 41 birth info if tracked
  }

  // Naturalization / A-number / prior filings (42–47..)
  put('petitioner.natzNumber', 'Pt1Line42a_NaturalizationNumber');
  put('petitioner.natzPlace', 'Pt1Line42b_NaturalizationPlaceOfIssuance');
  putDate('petitioner.natzDate', 'Pt1Line42c_DateOfIssuance');

  put('petitioner.aNumber2', 'Pt1Line44_A_Number'); // if you keep a second A#
  if (form.petitioner?.priorI129f && form.petitioner.priorI129f[0]) {
    mapName(fieldMap, 'Pt1Line45', form.petitioner.priorI129f[0]);
    putDate('petitioner.priorI129f.0.date', 'Pt1Line46_DateOfFilling');
    put('petitioner.priorI129f.0.uscisAction', 'Pt1Line47_Result');
  }
  // 48 checkboxs – if you track, wire with putBool

  // State/country for some later lines (50–51)
  put('petitioner.stateResidence', 'Pt1Line50a_State');
  put('petitioner.countryResidence', 'Pt1Line50b_CountryOfCitzOrNationality');
  put('petitioner.stateMail', 'Pt1Line51a_State');
  put('petitioner.countryMail', 'Pt1Line51b_CountryOfCitzOrNationality');

  // -----------------------
  // PART 2 — Beneficiary
  // -----------------------

  // Name (correct spot: 1a–1c)
  mapName(fieldMap, 'Pt2Line1', form.beneficiary);

  // IDs
  put('beneficiary.aNumber', 'Pt2Line2_AlienNumber');
  put('beneficiary.ssn', 'Pt2Line3_SSN');
  putDate('beneficiary.dob', 'Pt2Line4_DateOfBirth');
  putBool('beneficiary.sex.male', 'Pt2Line5_Checkboxes_p3_ch2'); // M/F group
  putBool('beneficiary.maritalStatus.single', 'Pt2Line6_Checkboxes_p3_ch4'); // or track properly w/ options

  put('beneficiary.cityOfBirth', 'Pt2Line7_CityTownOfBirth');
  put('beneficiary.countryOfBirth', 'Pt2Line8_CountryOfBirth');
  put('beneficiary.citizenshipCountry', 'Pt2Line9_CountryofCitzOrNationality');

  // Other names used (10a–10c)
  if (form.beneficiary?.otherNames && form.beneficiary.otherNames[0]) {
    mapName(fieldMap, 'Pt2Line10', form.beneficiary.otherNames[0]);
  }

  // Mailing / Physical address (11,12,14)
  if (form.beneficiary?.mailing) {
    setText(fieldMap, 'Pt2Line11_InCareOfName', form.beneficiary.mailing.inCareOf || '');
    mapAddressBlock(fieldMap, 'Pt2Line11', form.beneficiary.mailing);
  }
  if (form.beneficiary?.physical) {
    mapAddressBlock(fieldMap, 'Pt2Line12', form.beneficiary.physical);
  }
  if (form.beneficiary?.prevPhysical) {
    mapAddressBlock(fieldMap, 'Pt2Line14', form.beneficiary.prevPhysical);
    putDate('beneficiary.prevPhysical.from', 'Pt2Line15a_DateFrom');
    putDate('beneficiary.prevPhysical.to',   'Pt2Line15b_ToFrom');
  }

  // Employment (16–23) — map two blocks
  const bEmps = form.beneficiary?.employment || [];
  if (bEmps[0]) {
    mapEmploymentBlock(fieldMap, bEmps[0], {
      name: 'Pt2Line16_NameofEmployer',
      addressPrefix: 'Pt2Line17',
      occupation: 'Pt2Line18_Occupation',
      from: 'Pt2Line19a_DateFrom',
      to:   'Pt2Line19b_ToFrom',
    });
  }
  if (bEmps[1]) {
    mapEmploymentBlock(fieldMap, bEmps[1], {
      name: 'Pt2Line20_NameofEmployer',
      addressPrefix: 'Pt2Line21',
      occupation: 'Pt2Line22_Occupation',
      from: 'Pt2Line23a_DateFrom',
      to:   'Pt2Line23b_ToFrom',
    });
  }

  // Beneficiary parents (24–35)
  if (form.beneficiary?.parents) {
    const bp0 = form.beneficiary.parents[0];
    if (bp0) {
      mapName(fieldMap, 'Pt2Line24', bp0);
      putBool('beneficiary.parents.0.alive', 'Pt2Line26_Checkbox_p5_ch2');
      put('beneficiary.parents.0.citizenshipCountry', 'Pt2Line27_CountryOfCitzOrNationality');
      put('beneficiary.parents.0.cityOfBirth', 'Pt2Line28a_CityTownOfBirth');
      put('beneficiary.parents.0.countryOfBirth', 'Pt2Line28b_CountryOfCitzOrNationality');
      mapAddressBlock(fieldMap, 'Pt2Line28c', { city: get(form,'beneficiary.parents.0.cityRes') || '' });
      setText(fieldMap, 'Pt2Line28d_Province', get(form,'beneficiary.parents.0.stateRes') || '');
      setText(fieldMap, 'Pt2Line28e_PostalCode', get(form,'beneficiary.parents.0.postalRes') || '');
      setText(fieldMap, 'Pt2Line28f_Country', get(form,'beneficiary.parents.0.countryRes') || '');
    }
    const bp1 = form.beneficiary.parents[1];
    if (bp1) {
      mapName(fieldMap, 'Pt2Line29', bp1);
      putDate('beneficiary.parents.1.dob', 'Pt2Line30_DateofBirth');
      putBool('beneficiary.parents.1.alive', 'Pt2Line31_Checkbox_p5_ch2');
      put('beneficiary.parents.1.citizenshipCountry', 'Pt2Line32_CountryOfCitzOrNationality');
      put('beneficiary.parents.1.cityOfBirth', 'Pt2Line33a_CityTownOfBirth');
      put('beneficiary.parents.1.countryOfBirth', 'Pt2Line33b_CountryOfCitzOrNationality');
      putBool('beneficiary.parents.1.livesWithYou', 'Pt2Line34_Checkboxes_p5_ch2');
    }
  }

  // Prior marriages / I-129F filings (35–37)
  if (form.beneficiary?.priorSpouses && form.beneficiary.priorSpouses[0]) {
    mapName(fieldMap, 'Pt2Line35', form.beneficiary.priorSpouses[0]);
    putDate('beneficiary.priorSpouses.0.ended', 'Pt2Line35a_DateMarriageEnded');
  }
  putBool('beneficiary.criminalHistory', 'Pt2Line37_Checkboxes_p5_ch2');

  // Entry info (38a–38h)
  put('beneficiary.entry.class', 'Pt2Line38a_LastArrivedAs');
  put('beneficiary.entry.i94', 'Pt2Line38b_ArrivalDeparture');
  putDate('beneficiary.entry.arrival', 'Pt2Line38c_DateofArrival');
  putDate('beneficiary.entry.i94Expiry', 'Pt2Line38d_DateExpired');
  put('beneficiary.entry.passportNumber', 'Pt2Line38e_Passport');
  put('beneficiary.entry.travelDocNumber', 'Pt2Line38f_TravelDoc');
  put('beneficiary.entry.issuanceCountry', 'Pt2Line38g_CountryOfIssuance');
  putDate('beneficiary.entry.docExpiry', 'Pt2Line38h_ExpDate');

  // Current status / contact (39–47..)
  putBool('beneficiary.presentInUS', 'Pt2Line39_Checkboxes_p6_ch2');
  mapName(fieldMap, 'Pt2Line40', form.beneficiary?.priorSpouse || {});
  put('beneficiary.birthCountry', 'Pt2Line41_CountryOfBirth');
  putDate('beneficiary.priorSpouseDob', 'Pt2Line42_DateofBirth');
  putBool('beneficiary.childrenInUS', 'Pt2Line43_Checkboxes_p6_ch2');

  // US contact addresses / phones (45–50)
  mapAddressBlock(fieldMap, 'Pt2Line45', form.beneficiary?.usAddress || {});
  setText(fieldMap, 'Pt2Line46_DayTimeTelephoneNumber', get(form, 'beneficiary.usPhone') || '');
  mapAddressBlock(fieldMap, 'Pt2Line47', form.beneficiary?.foreignAddress || {});
  setText(fieldMap, 'Pt2Line48_DaytimeTelephoneNum', get(form, 'beneficiary.foreignPhone') || '');

  // Another US address (50)
  mapAddressBlock(fieldMap, 'Pt2Line50', form.beneficiary?.altUSAddress || {});
  setText(fieldMap, 'Pt2Line50_Unit_p6_ch3', get(form, 'beneficiary.altUSAddress.unitType') || '');

  // Relationship facts (51–55) – wire basics
  setText(fieldMap, 'Pt2Line51_Checkboxes_p7_ch3', get(form, 'relationship.priorMeeting') ? 'Yes' : 'No');
  setText(fieldMap, 'Pt2Line52_Relationship', get(form, 'relationship.type') || '');
  setText(fieldMap, 'Pt2Line53_Checkboxes_p7_ch3', get(form, 'relationship.metWithin2Years') ? 'Yes' : 'No');
  setText(fieldMap, 'Pt2Line54_Describe', get(form, 'relationship.howMetDescribe') || '');
  setText(fieldMap, 'Pt2Line55_Checkboxes_p7_ch2', get(form, 'relationship.inPerson') ? 'Yes' : 'No');

  // US intended residence (62)
  setText(fieldMap, 'Pt2Line62a_CityTown', get(form, 'beneficiary.intendedCity') || '');
  setText(fieldMap, 'Pt2Line62b_Country', get(form, 'beneficiary.intendedCountry') || '');

  // -----------------------
  // PART 3–7 placeholders (signatures, interpreter, preparer, biometrics)
  // -----------------------
  // Wire easy ones if present in your JSON
  setText(fieldMap, 'Pt5Line1_DaytimePhoneNumber1', get(form, 'petitioner.contact.dayPhone') || '');
  setText(fieldMap, 'Pt5Line2_MobileNumber1', get(form, 'petitioner.contact.mobile') || '');
  setText(fieldMap, 'Pt5Line3_Email', get(form, 'petitioner.contact.email') || '');
  setText(fieldMap, 'Pt5Line4_DateOfSignature', fmtDate(get(form, 'petitioner.signatureDate')) || '');

  setText(fieldMap, 'Pt6Line1_InterpreterFamilyName', get(form, 'interpreter.lastName') || '');
  setText(fieldMap, 'Pt6Line1_InterpreterGivenName', get(form, 'interpreter.firstName') || '');
  setText(fieldMap, 'Pt6Line2_NameofBusinessorOrgName', get(form, 'interpreter.org') || '');
  setText(fieldMap, 'Pt6Line4_InterpreterDaytimeTelephone_p9_n1', get(form, 'interpreter.phone1') || '');
  setText(fieldMap, 'Pt6Line4_InterpreterDaytimeTelephone_p9_n2', get(form, 'interpreter.phone2') || '');
  setText(fieldMap, 'Pt6Line5_Email', get(form, 'interpreter.email') || '');
  setText(fieldMap, 'Pt6_NameOfLanguage', get(form, 'interpreter.language') || '');
  setText(fieldMap, 'Pt6Line6_DateofSignature', fmtDate(get(form, 'interpreter.signatureDate')) || '');

  setText(fieldMap, 'Pt7Line1_PreparerFamilyName', get(form, 'preparer.lastName') || '');
  setText(fieldMap, 'Pt7Line1b_PreparerGivenName', get(form, 'preparer.firstName') || '');
  setText(fieldMap, 'Pt7Line2_NameofBusinessorOrgName', get(form, 'preparer.org') || '');
  setText(fieldMap, 'Pt7Line3_DaytimePhoneNumber1', get(form, 'preparer.phone') || '');
  setText(fieldMap, 'Pt7Line4_PreparerMobileNumber', get(form, 'preparer.mobile') || '');
  setText(fieldMap, 'Pt7Line5_Email', get(form, 'preparer.email') || '');
  setText(fieldMap, 'Pt7Line6_DateofSignature', fmtDate(get(form, 'preparer.signatureDate')) || '');

  // -----------------------
  // SPILL UNMAPPED TO PART 8
  // -----------------------
  // Walk the JSON and push anything we didn’t try above.
  const ignoreTop = new Set([
    // already handled tops; prevents dumping huge trees we’ve mapped
    'petitioner','mailing','physicalAddresses','employment',
    'beneficiary','relationship','interpreter','preparer'
  ]);

  function walk(obj, base = '') {
    if (obj && typeof obj === 'object') {
      if (Array.isArray(obj)) {
        obj.forEach((v, i) => walk(v, `${base}[${i}]`));
        return;
      }
      for (const k of Object.keys(obj)) {
        const next = base ? `${base}.${k}` : k;
        if (!base && ignoreTop.has(k)) continue; // skip – already mapped
        walk(obj[k], next);
      }
      return;
    }
    // primitive
    leftovers.push({ key: base, value: obj, hint: 'Pt8 Additional Info' });
  }
  walk(form);

  if (leftovers.length) {
    spillToPart8(fieldMap, leftovers.slice(0, 5)); // we have 5 extra lines on form
  }
}

// ---------------------------------------------------------------------------
// For your /flow/us/i-129f/all-fields debug page (keeps it building).
// You can expand this list with any JSON paths you want to probe.
export const I129F_SECTIONS = [
  {
    title: 'Part 1 — Petitioner: Identity',
    fields: [
      'petitioner.aNumber',
      'petitioner.uscisOnlineAcct',
      'petitioner.ssn',
      'petitioner.lastName',
      'petitioner.firstName',
      'petitioner.middleName',
      'petitioner.otherNames[0].lastName',
      'petitioner.otherNames[0].firstName',
      'petitioner.otherNames[0].middleName',
      'petitioner.dob',
      'petitioner.sex.male',
      'petitioner.usCitizen',
      'petitioner.cityOfBirth',
      'petitioner.stateOfBirth',
      'petitioner.countryOfBirth',
    ],
  },
  {
    title: 'Part 1 — Mailing & Physical',
    fields: [
      'mailing.street','mailing.unitType','mailing.unitNum',
      'mailing.city','mailing.state','mailing.zip','mailing.province','mailing.postal','mailing.country',
      'physicalAddresses[0].street','physicalAddresses[0].from','physicalAddresses[0].to',
      'physicalAddresses[1].street','physicalAddresses[1].from','physicalAddresses[1].to',
      'physicalAddresses[2].street',
    ],
  },
  {
    title: 'Part 1 — Employment',
    fields: [
      'employment[0].employer','employment[0].street','employment[0].occupation','employment[0].from','employment[0].to',
      'employment[1].employer','employment[1].street','employment[1].occupation','employment[1].from','employment[1].to',
    ],
  },
  {
    title: 'Part 2 — Beneficiary: Identity',
    fields: [
      'beneficiary.lastName','beneficiary.firstName','beneficiary.middleName',
      'beneficiary.aNumber','beneficiary.ssn','beneficiary.dob','beneficiary.sex.male',
      'beneficiary.cityOfBirth','beneficiary.countryOfBirth','beneficiary.citizenshipCountry',
      'beneficiary.otherNames[0].lastName',
    ],
  },
  {
    title: 'Part 2 — Addresses & Employment',
    fields: [
      'beneficiary.mailing.street','beneficiary.physical.street',
      'beneficiary.prevPhysical.street','beneficiary.prevPhysical.from','beneficiary.prevPhysical.to',
      'beneficiary.employment[0].employer','beneficiary.employment[0].from','beneficiary.employment[0].to',
      'beneficiary.employment[1].employer','beneficiary.employment[1].from','beneficiary.employment[1].to',
    ],
  },
];
