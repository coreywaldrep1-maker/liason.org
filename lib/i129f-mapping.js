// lib/i129f-mapping.js
// Robust mapping for I-129F. Accepts either the “old” shape or the “new” wizard shape.
// Old:   saved.classification === 'k1'|'k3' and saved.k3FiledI130 === true|false|'yes'|'no'
// New:   saved.classification = { type: 'k1'|'k3', i130Filed: true|false|'yes'|'no' }

function get(obj, path, fallback = undefined) {
  try {
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj) ?? fallback;
  } catch {
    return fallback;
  }
}
const toBool = (v) => (typeof v === 'string' ? v.trim().toLowerCase() === 'yes' : !!v);
const safeLower = (v) => (typeof v === 'string' ? v.toLowerCase() : '');
const safeStr = (v) => (v == null ? '' : String(v));
const num = (v) => (typeof v === 'number' ? String(v) : v || '');
const cb = (v) => (toBool(v) ? 'Yes' : 'Off'); // checkbox
const yn = (v) => (toBool(v) ? 'Yes' : 'No');
const mmddyyyy = (v) => {
  if (!v) return '';
  try {
    const d = typeof v === 'string' ? new Date(v) : v;
    if (isNaN(d.getTime())) return '';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  } catch { return ''; }
};

function fullName(person = {}, format = 'first-middle-last') {
  const f = safeStr(person.first);
  const m = safeStr(person.middle);
  const l = safeStr(person.last);
  if (format === 'last-first') return [l, f].filter(Boolean).join(', ');
  return [f, m, l].filter(Boolean).join(' ');
}

function safePhone(p) {
  const s = safeStr(p).replace(/[^\d]/g, '').slice(0, 20);
  return s;
}
function safeZip(z) {
  const s = safeStr(z).trim();
  return s.length > 10 ? s.slice(0,10) : s;
}

function setMany(form, names, value) {
  names.forEach((n) => form[n] = safeStr(value));
}
function setManyChecks(form, names, on) {
  names.forEach((n) => form[n] = on ? 'Yes' : 'Off');
}

export function applyI129fMapping(savedIn = {}) {
  const saved = savedIn || {};
  const p1 = saved.petitioner || {};
  const p2 = saved.beneficiary || {};

  const form = {}; // <- this is the object your PDF filler consumes (key = exact PDF field name)

  /* ===== Part 1 — Basis for Classification (1–5) ===== */

  // Accept both shapes:
  // old: saved.classification === 'k1'|'k3', saved.k3FiledI130 === true|false|'yes'|'no'
  // new: saved.classification = { type: 'k1'|'k3', i130Filed: true|false|'yes'|'no' }
  const rawCls = saved && saved.classification;
  const cls = (typeof rawCls === 'string' ? rawCls : ((rawCls && rawCls.type) || '')).toLowerCase();

  // K-1 / K-2 (Line 1)
  setManyChecks(form, [
    'Pt1Line1','Pt1_Line1','Part1_Q1_Checkbox','Line1_Checkboxes_p1_ch1'
  ], cls === 'k1');

  // K-3 / K-4 (Line 2)
  setManyChecks(form, [
    'Pt1Line2','Pt1_Line2','Part1_Q2_Checkbox','Line2_Checkboxes_p2_ch1'
  ], cls === 'k3');

  // Numeric checks for 1 & 2, depending on some vendors’ templates
  setMany(form, ['Line1_K-1','Line1_Checkboxes_p1'], cls === 'k1' ? 'On' : 'Off');
  setMany(form, ['Line2_K-3','Line2_Checkboxes_p2'], cls === 'k3' ? 'On' : 'Off');

  // Is Form I-130 filed? (Line 5)
  const filedRaw = (rawCls && typeof rawCls === 'object') ? rawCls.i130Filed : (saved ? saved.k3FiledI130 : undefined);
  const filed = (typeof filedRaw === 'string') ? filedRaw.toLowerCase() === 'yes' : !!filedRaw;

  setManyChecks(form, [
    'Pt1Line5_Yes','Pt1_Line5_Yes','Line5_I130_Yes','Line5_Checkboxes_p0_ch1'
  ], cls === 'k3' && filed === true);
  setManyChecks(form, [
    'Pt1Line5_No','Pt1_Line5_No','Line5_I130_No','Line5_Checkboxes_p0_ch2'
  ], cls === 'k3' && filed === false);

  /* ===== Part 1 — Names (6–7) ===== */
  setMany(form, ['Pt1_Name_Family','Pt1_Line6_FamilyName','Part1_Q6a_FamilyName'], p1.last);
  setMany(form, ['Pt1_Name_Given','Pt1_Line6_GivenName','Part1_Q6b_GivenName'], p1.first);
  setMany(form, ['Pt1_Name_Middle','Pt1_Line6_MiddleName','Part1_Q6c_MiddleName'], p1.middle);

  const p1Other = (p1.otherNames || [])[0] || {};
  setMany(form, ['Pt1_Line7a_Family','Part1_Q7a_FamilyName'], p1Other.last);
  setMany(form, ['Pt1_Line7b_Given','Part1_Q7b_GivenName'], p1Other.first);
  setMany(form, ['Pt1_Line7c_Middle','Part1_Q7c_MiddleName'], p1Other.middle);

  /* ===== Part 1 — Addresses (8–16) ===== */
  const mail = p1.mailingAddress || {};
  setMany(form, ['Pt1_Line8_StreetNumberName'], mail.street);
  setMany(form, ['Pt1_Line9_AptSteFlr'], mail.unit);
  setMany(form, ['Pt1_Line10_CityOrTown'], mail.city);
  setMany(form, ['Pt1_Line11_State'], mail.state);
  setMany(form, ['Pt1_Line12_ZipCode'], safeZip(mail.zip));
  setMany(form, ['Pt1_Line13_Province'], mail.province);
  setMany(form, ['Pt1_Line14_PostalCode'], mail.postal);
  setMany(form, ['Pt1_Line15_Country'], mail.country);

  // Physical address (most recent)
  const phys0 = (p1.physicalAddresses || [])[0] || {};
  setMany(form, ['Pt1_Line16_StreetNumberName'], phys0.street);
  setMany(form, ['Pt1_Line17_AptSteFlr'], phys0.unit);
  setMany(form, ['Pt1_Line18_CityOrTown'], phys0.city);
  setMany(form, ['Pt1_Line19_State'], phys0.state);
  setMany(form, ['Pt1_Line20_ZipCode'], safeZip(phys0.zip));
  setMany(form, ['Pt1_Line21_Province'], phys0.province);
  setMany(form, ['Pt1_Line22_PostalCode'], phys0.postal);
  setMany(form, ['Pt1_Line23_Country'], phys0.country);
  setMany(form, ['Pt1_Line24_From_Date'], mmddyyyy(phys0.from));
  setMany(form, ['Pt1_Line25_To_Date'], mmddyyyy(phys0.to));

  /* ===== Part 1 — Demographics (26–35) ===== */
  setMany(form, ['Pt1_Line26_DateOfBirth'], mmddyyyy(p1.dob));
  setMany(form, ['Pt1_Line27_Sex_Male'], '');
  setMany(form, ['Pt1_Line27_Sex_Female'], '');
  setManyChecks(form, ['Pt1_Line27_Sex_Male','Part1_Q27_Male'], safeLower(p1.sex) === 'male');
  setManyChecks(form, ['Pt1_Line27_Sex_Female','Part1_Q27_Female'], safeLower(p1.sex) === 'female');

  setMany(form, ['Pt1_Line28a_CityTownOfBirth'], p1.pobCity);
  setMany(form, ['Pt1_Line28b_State'], p1.pobState);
  setMany(form, ['Pt1_Line28c_CountryOfBirth'], p1.pobCountry);
  setMany(form, ['Pt1_Line29_AlienNumber'], p1.aNumber);
  setMany(form, ['Pt1_Line30_OnlineAccNo'], p1.uscisOnline);
  setMany(form, ['Pt1_Line31_SSN'], p1.ssn);

  /* ===== Part 1 — Marital & Contact (32–35) ===== */
  const ms = safeLower(p1.maritalStatus);
  setManyChecks(form, ['Pt1_Line32_Single'], ms === 'single' || ms === 'never married');
  setManyChecks(form, ['Pt1_Line32_Married'], ms === 'married');
  setManyChecks(form, ['Pt1_Line32_Divorced'], ms === 'divorced');
  setManyChecks(form, ['Pt1_Line32_Widowed'], ms === 'widowed');

  setMany(form, ['Pt1_Line33_DayTelephone'], safePhone(p1.phone));
  setMany(form, ['Pt1_Line34_Mobile'], safePhone(p1.mobile));
  setMany(form, ['Pt1_Line35_Email'], p1.email);

  /* ===== Part 1 — Parents (36–43) ===== */
  const p1p1 = (p1.parents || [])[0] || {};
  const p1p2 = (p1.parents || [])[1] || {};

  setMany(form, ['Pt1_Line36a_Family'], p1p1.last);
  setMany(form, ['Pt1_Line36b_Given'], p1p1.first);
  setMany(form, ['Pt1_Line36c_Middle'], p1p1.middle);
  setMany(form, ['Pt1_Line37_DateOfBirth'], mmddyyyy(p1p1.dob));
  setMany(form, ['Pt1_Line38_Sex_Male'], '');
  setMany(form, ['Pt1_Line38_Sex_Female'], '');
  setManyChecks(form, ['Pt1_Line38_Sex_Male'], safeLower(p1p1.sex) === 'male');
  setManyChecks(form, ['Pt1_Line38_Sex_Female'], safeLower(p1p1.sex) === 'female');
  setMany(form, ['Pt1_Line39_CityTownOfBirth'], p1p1.pobCity);
  setMany(form, ['Pt1_Line40_State'], p1p1.pobState);
  setMany(form, ['Pt1_Line41_Country'], p1p1.pobCountry);

  setMany(form, ['Pt1_Line42a_Family'], p1p2.last);
  setMany(form, ['Pt1_Line42b_Given'], p1p2.first);
  setMany(form, ['Pt1_Line42c_Middle'], p1p2.middle);
  setMany(form, ['Pt1_Line43_DateOfBirth'], mmddyyyy(p1p2.dob));
  setMany(form, ['Pt1_Line44_Sex_Male'], '');
  setMany(form, ['Pt1_Line44_Sex_Female'], '');
  setManyChecks(form, ['Pt1_Line44_Sex_Male'], safeLower(p1p2.sex) === 'male');
  setManyChecks(form, ['Pt1_Line44_Sex_Female'], safeLower(p1p2.sex) === 'female');
  setMany(form, ['Pt1_Line45_CityTownOfBirth'], p1p2.pobCity);
  setMany(form, ['Pt1_Line46_State'], p1p2.pobState);
  setMany(form, ['Pt1_Line47_Country'], p1p2.pobCountry);

  /* ===== Part 2 — Beneficiary (1–8 etc.) ===== */
  setMany(form, ['Pt2_Line1a_Family'], p2.last);
  setMany(form, ['Pt2_Line1b_Given'], p2.first);
  setMany(form, ['Pt2_Line1c_Middle'], p2.middle);

  const bOther = (p2.otherNames || [])[0] || {};
  setMany(form, ['Pt2_Line2a_Family'], bOther.last);
  setMany(form, ['Pt2_Line2b_Given'], bOther.first);
  setMany(form, ['Pt2_Line2c_Middle'], bOther.middle);

  setManyChecks(form, ['Pt2_Line3_Sex_Male'], safeLower(p2.sex) === 'male');
  setManyChecks(form, ['Pt2_Line3_Sex_Female'], safeLower(p2.sex) === 'female');

  setMany(form, ['Pt2_Line4_DateOfBirth'], mmddyyyy(p2.dob));
  setMany(form, ['Pt2_Line5a_CityTownOfBirth'], p2.pobCity);
  setMany(form, ['Pt2_Line5b_State'], p2.pobState);
  setMany(form, ['Pt2_Line5c_Country'], p2.pobCountry);
  setMany(form, ['Pt2_Line6_AlienNumber'], p2.aNumber);
  setMany(form, ['Pt2_Line7_OnlineAccNo'], p2.uscisOnline);
  setMany(form, ['Pt2_Line8_SSN'], p2.ssn);

  // mailing / physical
  const bMail = p2.mailingAddress || {};
  setMany(form, ['Pt2_Line9_StreetNumberName'], bMail.street);
  setMany(form, ['Pt2_Line10_AptSteFlr'], bMail.unit);
  setMany(form, ['Pt2_Line11_CityOrTown'], bMail.city);
  setMany(form, ['Pt2_Line12_State'], bMail.state);
  setMany(form, ['Pt2_Line13_ZipCode'], safeZip(bMail.zip));
  setMany(form, ['Pt2_Line14_Province'], bMail.province);
  setMany(form, ['Pt2_Line15_PostalCode'], bMail.postal);
  setMany(form, ['Pt2_Line16_Country'], bMail.country);

  const bPhys0 = (p2.physicalAddresses || [])[0] || {};
  setMany(form, ['Pt2_Line17_StreetNumberName'], bPhys0.street);
  setMany(form, ['Pt2_Line18_AptSteFlr'], bPhys0.unit);
  setMany(form, ['Pt2_Line19_CityOrTown'], bPhys0.city);
  setMany(form, ['Pt2_Line20_State'], bPhys0.state);
  setMany(form, ['Pt2_Line21_ZipCode'], safeZip(bPhys0.zip));
  setMany(form, ['Pt2_Line22_Province'], bPhys0.province);
  setMany(form, ['Pt2_Line23_PostalCode'], bPhys0.postal);
  setMany(form, ['Pt2_Line24_Country'], bPhys0.country);

  /* ===== Interpreter (Part 7) ===== */
  const interp = saved.interpreter || {};
  setManyChecks(form, ['Part7_NoInterpreter'], !interp || !interp.first);
  setManyChecks(form, ['Part7_YesInterpreter'], !!interp && !!interp.first);

  setMany(form, ['Pt7_Line1a_Family'], interp.last);
  setMany(form, ['Pt7_Line1b_Given'], interp.first);
  setMany(form, ['Pt7_Line1c_Middle'], interp.middle);
  setMany(form, ['Pt7_Line2_BusinessOrg'], interp.company);
  const iAddr = interp.address || {};
  setMany(form, ['Pt7_Line3_StreetNumberName'], iAddr.street);
  setMany(form, ['Pt7_Line4_AptSteFlr'], iAddr.unit);
  setMany(form, ['Pt7_Line5_CityOrTown'], iAddr.city);
  setMany(form, ['Pt7_Line6_State'], iAddr.state);
  setMany(form, ['Pt7_Line7_ZipCode'], safeZip(iAddr.zip));
  setMany(form, ['Pt7_Line8_Province'], iAddr.province);
  setMany(form, ['Pt7_Line9_PostalCode'], iAddr.postal);
  setMany(form, ['Pt7_Line10_Country'], iAddr.country);
  setMany(form, ['Pt7_Line11_DayTelephone'], safePhone(interp.phone));
  setMany(form, ['Pt7_Line12_Mobile'], safePhone(interp.mobile));
  setMany(form, ['Pt7_Line13_Email'], interp.email);

  /* ===== Preparer (Part 8) ===== */
  const prep = saved.preparer || {};
  setManyChecks(form, ['Part8_NoPreparer'], !prep || !prep.first);
  setManyChecks(form, ['Part8_YesPreparer'], !!prep && !!prep.first);

  setMany(form, ['Pt8_Line1a_Family'], prep.last);
  setMany(form, ['Pt8_Line1b_Given'], prep.first);
  setMany(form, ['Pt8_Line1c_Middle'], prep.middle);
  setMany(form, ['Pt8_Line2_BusinessOrg'], prep.company);
  const prAddr = prep.address || {};
  setMany(form, ['Pt8_Line3_StreetNumberName'], prAddr.street);
  setMany(form, ['Pt8_Line4_AptSteFlr'], prAddr.unit);
  setMany(form, ['Pt8_Line5_CityOrTown'], prAddr.city);
  setMany(form, ['Pt8_Line6_State'], prAddr.state);
  setMany(form, ['Pt8_Line7_ZipCode'], safeZip(prAddr.zip));
  setMany(form, ['Pt8_Line8_Province'], prAddr.province);
  setMany(form, ['Pt8_Line9_PostalCode'], prAddr.postal);
  setMany(form, ['Pt8_Line10_Country'], prAddr.country);
  setMany(form, ['Pt8_Line11_DayTelephone'], safePhone(prep.phone));
  setMany(form, ['Pt8_Line12_Mobile'], safePhone(prep.mobile));
  setMany(form, ['Pt8_Line13_Email'], prep.email);

  /* ===== Part 8 Additional Information spillover (auto-append) ===== */
  // (Use this for overflow you already like)
  const overflow = [];
  // ...push any extra lines here if needed...
  setMany(form, ['Pt8_Line7_AdditionalInfo'], overflow.join('\n'));

  return form;
}

/* ===== Sections list for your All-Fields debug page ===== */
export const I129F_SECTIONS = [
  { id: 'part1', title: 'Part 1 - Petitioner' },
  { id: 'part2', title: 'Part 2 - Beneficiary' },
  { id: 'part7', title: 'Part 7 - Interpreter' },
  { id: 'part8', title: 'Part 8 - Preparer & Additional Info' },
];

/* ===== Optional: expose a list of fields you want to see in /api/i129f/pdf-inspect ===== */
export const I129F_DEBUG_FIELD_LIST = [
  // Put any exact PDF field names you want to verify first:
  'Pt1_Line1','Pt1_Line2','Pt1Line5_Yes','Pt1Line5_No',
  'Pt1_Line6_FamilyName','Pt1_Line6_GivenName','Pt1_Line6_MiddleName',
  'Pt1_Line10_CityOrTown','Pt1_Line12_ZipCode',
  'Pt1_Line27_Sex_Male','Pt1_Line27_Sex_Female',
  'Pt2_Line1a_Family','Pt2_Line3_Sex_Male','Pt2_Line3_Sex_Female',
  'Pt7_Line1a_Family','Pt8_Line1a_Family'
];

export default { applyI129fMapping, I129F_SECTIONS, I129F_DEBUG_FIELD_LIST };
