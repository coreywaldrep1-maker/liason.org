// lib/i129f-mapping.js

/** Safe getter */
function get(obj, path) {
  return path.split('.').reduce((a, k) => (a && a[k] !== undefined ? a[k] : undefined), obj);
}

/** coerce yes/no/boolean-ish to true/false for checkbox */
function toBool(v) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return ['y', 'yes', 'true', '1', 'checked', 'on'].includes(s);
  }
  return false;
}

/** Minimal date normalizer -> mm/dd/yyyy if possible */
function asDate(v) {
  if (!v) return;
  const s = String(v).trim();
  if (!s) return;
  // already mm/dd/yyyy?
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
  // yyyy-mm-dd -> mm/dd/yyyy
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[2]}/${m[3]}/${m[1]}`;
  return s; // best effort
}

/**
 * Helper to push extra content into Part 8 continuation blocks.
 * The I-129F has named blocks like Line3/Line4/Line5/Line6/Line7 with a/b/c/d fields.
 */
function makePart8Accumulator(out) {
  const slots = [
    'Line3', 'Line4', 'Line5', 'Line6', 'Line7'
  ];
  let idx = 0;
  return function push({ page = '', part = '', item = '', text = '' }) {
    if (!text || idx >= slots.length) return;
    const base = slots[idx++];
    out[`${base}a_PageNumber`]   = String(page);
    out[`${base}b_PartNumber`]   = String(part);
    out[`${base}c_ItemNumber`]   = String(item);
    out[`${base}d_AdditionalInfo`] = String(text);
  };
}

/**
 * Turn your nested wizard form into { PDF_FIELD_NAME: value }
 * Supports Parts 1–8. Unknown/missing fields are skipped safely.
 */
export function applyI129fMapping(form = {}) {
  const out = {};
  const pushPart8 = makePart8Accumulator(out);

  // tiny helper that preserves booleans (for checkboxes) but stringifies others
  function set(pdfField, value) {
    if (value === undefined || value === null || value === '') return;
    if (typeof value === 'boolean') { out[pdfField] = value; return; }
    out[pdfField] = String(value);
  }

  // =========================
  // PART 1 — PETITIONER
  // =========================

  // IDs
  set('Pt1Line1_AlienNumber', get(form, 'petitioner.aNumber'));
  set('Pt1Line2_AcctIdentifier', get(form, 'petitioner.uscisAccount'));
  set('Pt1Line3_SSN', get(form, 'petitioner.ssn'));

  // Citizenship/US national? (best guess -> booleans you keep in your wizard)
  set('Pt1Line4a_Checkboxes_p0_ch2', toBool(get(form, 'petitioner.isUSCitizen')));
  set('Pt1Line5_Checkboxes_p0_ch2',  toBool(get(form, 'petitioner.isUSNational')));

  // Current legal name (L6)
  set('Pt1Line6a_FamilyName',  get(form, 'petitioner.lastName'));
  set('Pt1Line6b_GivenName',   get(form, 'petitioner.firstName'));
  set('Pt1Line6c_MiddleName',  get(form, 'petitioner.middleName'));

  // Other names used (first row shows on page; overflow -> Part 8)
  set('Pt1Line7a_FamilyName',  get(form, 'petitioner.otherNames.0.lastName'));
  set('Pt1Line7b_GivenName',   get(form, 'petitioner.otherNames.0.firstName'));
  set('Pt1Line7c_MiddleName',  get(form, 'petitioner.otherNames.0.middleName'));

  // If more than 1 "other name", continue in Part 8
  const morePetOther = get(form, 'petitioner.otherNames') || [];
  morePetOther.slice(1).forEach((n, i) => {
    const text = `Additional petitioner name #${i+2}: ${[n.lastName, n.firstName, n.middleName].filter(Boolean).join(', ')}`;
    pushPart8({ page:'1', part:'1', item:'7', text });
  });

  // Mailing address (L8)
  set('Pt1Line8_InCareofName',       get(form, 'mailing.inCareOf'));
  set('Pt1Line8_StreetNumberName',   get(form, 'mailing.street'));
  set('Pt1Line8_Unit_p0_ch3',        get(form, 'mailing.unitType')); // Apt/Ste/Flr
  set('Pt1Line8_AptSteFlrNumber',    get(form, 'mailing.unitNum'));
  set('Pt1Line8_CityOrTown',         get(form, 'mailing.city'));
  set('Pt1Line8_State',              get(form, 'mailing.state'));
  set('Pt1Line8_ZipCode',            get(form, 'mailing.zip'));
  set('Pt1Line8_Province',           get(form, 'mailing.province'));
  set('Pt1Line8_PostalCode',         get(form, 'mailing.postal'));
  set('Pt1Line8_Country',            get(form, 'mailing.country'));
  set('Pt1Line8j_Checkboxes_p0_ch2', toBool(get(form, 'mailing.isForeign')));

  // Physical address history (map 3 rows on form; overflow -> Part 8)
  const phys = get(form, 'physicalAddresses') || [];
  const A = phys[0] || {};
  set('Pt1Line9_StreetNumberName', A.street);
  set('Pt1Line9_Unit_p1_ch3',      A.unitType);
  set('Pt1Line9_AptSteFlrNumber',  A.unitNum);
  set('Pt1Line9_CityOrTown',       A.city);
  set('Pt1Line9_State',            A.state);
  set('Pt1Line9_ZipCode',          A.zip);
  set('Pt1Line9_Province',         A.province);
  set('Pt1Line9_PostalCode',       A.postal);
  set('Pt1Line9_Country',          A.country);
  set('Pt1Line10a_DateFrom',       asDate(A.from));
  set('Pt1Line10b_DateFrom',       asDate(A.to));

  const B = phys[1] || {};
  set('Pt1Line11_StreetNumberName', B.street);
  set('Pt1Line11_Unit_p1_ch3',      B.unitType);
  set('Pt1Line11_AptSteFlrNumber',  B.unitNum);
  set('Pt1Line11_CityOrTown',       B.city);
  set('Pt1Line11_State',            B.state);
  set('Pt1Line11_ZipCode',          B.zip);
  set('Pt1Line11_Province',         B.province);
  set('Pt1Line11_PostalCode',       B.postal);
  set('Pt1Line11_Country',          B.country);
  set('Pt1Line12a_DateFrom',        asDate(B.from));
  set('Pt1Line12b_ToFrom',          asDate(B.to));

  const C = phys[2] || {};
  set('Pt1Line14_StreetNumberName', C.street);
  set('Pt1Line14_Unit_p1_ch3',      C.unitType);
  set('Pt1Line14_AptSteFlrNumber',  C.unitNum);
  set('Pt1Line14_CityOrTown',       C.city);
  set('Pt1Line14_State',            C.state);
  set('Pt1Line14_ZipCode',          C.zip);
  set('Pt1Line14_Province',         C.province);
  set('Pt1Line14_PostalCode',       C.postal);
  set('Pt1Line14_Country',          C.country);

  // overflow addresses -> Part 8
  phys.slice(3).forEach((p, i) => {
    const text = `Additional physical address #${i+4}: ${[
      p.street,
      p.unitType ? `${p.unitType} ${p.unitNum||''}`.trim() : '',
      p.city, p.state, p.zip, p.province, p.postal, p.country
    ].filter(Boolean).join(', ')} (from ${asDate(p.from)||''} to ${asDate(p.to)||''})`;
    pushPart8({ page:'1', part:'1', item:'9-16', text });
  });

  // Employment (two slots on form; overflow -> Part 8)
  const jobs = get(form, 'employment') || [];
  const J1 = jobs[0] || {};
  set('Pt1Line13_NameofEmployer', J1.employer);
  set('Pt1Line15_Occupation',     J1.occupation);
  set('Pt1Line16a_DateFrom',      asDate(J1.from));
  set('Pt1Line16b_ToFrom',        asDate(J1.to));

  const J2 = jobs[1] || {};
  set('Pt1Line17_NameofEmployer',     J2.employer);
  set('Pt1Line18_StreetNumberName',   J2.street);
  set('Pt1Line18_Unit_p1_ch3',        J2.unitType);
  set('Pt1Line18_AptSteFlrNumber',    J2.unitNum);
  set('Pt1Line18_CityOrTown',         J2.city);
  set('Pt1Line18_State',              J2.state);
  set('Pt1Line18_ZipCode',            J2.zip);
  set('Pt1Line18_Province',           J2.province);
  set('Pt1Line18_PostalCode',         J2.postal);
  set('Pt1Line18_Country',            J2.country);
  set('Pt1Line19_Occupation',         J2.occupation);
  set('Pt1Line20a_DateFrom',          asDate(J2.from));
  set('Pt1Line20b_ToFrom',            asDate(J2.to));

  jobs.slice(2).forEach((j, i) => {
    const text = `Additional employment #${i+3}: ${j.employer||''}, ${j.occupation||''}, ${j.city||''} ${j.state||''} ${j.country||''} (from ${asDate(j.from)||''} to ${asDate(j.to)||''})`;
    pushPart8({ page:'1', part:'1', item:'13-20', text });
  });

  // Marital & status (best-effort boolean placeholders if you store them)
  set('Pt1Line20_Checkboxes_p2_ch2', toBool(get(form, 'petitioner.currentlyEmployed'))); // placeholder
  set('Pt1Line21_Checkbox_p2_ch2',   toBool(get(form, 'petitioner.everFiledI129F')));
  set('Pt1Line23_Checkbox_p2_ch4',   toBool(get(form, 'petitioner.hasCriminalHistory')));
  set('Pt1Line29_Checkbox_p2_ch2',   toBool(get(form, 'petitioner.childrenInUS')));
  set('Pt1Line34_Checkbox_p2_ch2',   toBool(get(form, 'petitioner.everMarried')));
  set('Pt1Line37_Checkboxes_p2_ch2', toBool(get(form, 'petitioner.currentMarriageValid')));
  set('Pt1Line40_Checkbox_p2_ch3',   toBool(get(form, 'petitioner.metInLast2Years')));

  // Prior spouse (first slot)
  set('Pt1Line38a_FamilyName',         get(form, 'petitioner.priorSpouses.0.lastName'));
  set('Pt1Line38b_GivenName',          get(form, 'petitioner.priorSpouses.0.firstName'));
  set('Pt1Line38c_MiddleName',         get(form, 'petitioner.priorSpouses.0.middleName'));
  set('Pt1Line39_DateMarriageEnded',   asDate(get(form, 'petitioner.priorSpouses.0.dateMarriageEnded')));

  // Naturalization/A-number etc.
  set('Pt1Line42a_NaturalizationNumber',         get(form, 'petitioner.natzNumber'));
  set('Pt1Line42b_NaturalizationPlaceOfIssuance',get(form, 'petitioner.natzPlace'));
  set('Pt1Line42c_DateOfIssuance',               asDate(get(form, 'petitioner.natzDate')));
  set('Pt1Line44_A_Number',                      get(form, 'petitioner.aNumber'));

  // Parents (name/date/birthplace are on the form in Part 1 / early Part 2)
  set('Pt1Line32a_FamilyName', get(form, 'petitioner.parents.0.lastName'));
  set('Pt1Line32b_GivenName',  get(form, 'petitioner.parents.0.firstName'));
  set('Pt1Line32c_MiddleName', get(form, 'petitioner.parents.0.middleName'));
  set('Pt1Line33_DateofBirth', asDate(get(form, 'petitioner.parents.0.dob')));
  set('Pt1Line34_Checkbox_p2_ch2', toBool(get(form, 'petitioner.parents.0.living')));
  set('Pt1Line35_CountryOfCitzOrNationality', get(form, 'petitioner.parents.0.birthCountry'));
  set('Pt1Line36a_CityTownOfBirth', get(form, 'petitioner.parents.0.birthCity'));
  set('Pt1Line36b_CountryOfCitzOrNationality', get(form, 'petitioner.parents.0.birthCountry'));

  set('Pt1Line27a_FamilyName', get(form, 'petitioner.parents.1.lastName'));
  set('Pt1Line27b_GivenName',  get(form, 'petitioner.parents.1.firstName'));
  set('Pt1Line27c_MiddleName', get(form, 'petitioner.parents.1.middleName'));
  set('Pt1Line28_DateofBirth', asDate(get(form, 'petitioner.parents.1.dob')));
  set('Pt1Line30_CountryOfCitzOrNationality', get(form, 'petitioner.parents.1.birthCountry'));
  set('Pt1Line31_CityTownOfBirth',            get(form, 'petitioner.parents.1.birthCity'));

  // Residence since 18
  set('Pt1Line50a_State', get(form, 'petitioner.residenceSince18.0.state'));
  set('Pt1Line50b_CountryOfCitzOrNationality', get(form, 'petitioner.residenceSince18.0.country'));
  set('Pt1Line51a_State', get(form, 'petitioner.residenceSince18.1.state'));
  set('Pt1Line51b_CountryOfCitzOrNationality', get(form, 'petitioner.residenceSince18.1.country'));

  // =========================
  // PART 2 — BENEFICIARY
  // =========================

  set('Pt2Line1a_FamilyName',  get(form, 'beneficiary.lastName'));
  set('Pt2Line1b_GivenName',   get(form, 'beneficiary.firstName'));
  set('Pt2Line1c_MiddleName',  get(form, 'beneficiary.middleName'));
  set('Pt2Line2_AlienNumber',  get(form, 'beneficiary.aNumber'));
  set('Pt2Line3_SSN',          get(form, 'beneficiary.ssn'));
  set('Pt2Line4_DateOfBirth',  asDate(get(form, 'beneficiary.dob')));

  // Gender / status (best-effort)
  set('Pt2Line5_Checkboxes_p3_ch2', toBool(get(form, 'beneficiary.isMale')));
  set('Pt2Line6_Checkboxes_p3_ch4', toBool(get(form, 'beneficiary.married')));

  // Birth & citizenship
  set('Pt2Line7_CityTownOfBirth',       get(form, 'beneficiary.birthCity'));
  set('Pt2Line8_CountryOfBirth',        get(form, 'beneficiary.birthCountry'));
  set('Pt2Line9_CountryofCitzOrNationality', get(form, 'beneficiary.citizenship'));

  // Other names (first row)
  set('Pt2Line10a_FamilyName', get(form, 'beneficiary.otherNames.0.lastName'));
  set('Pt2Line10b_GivenName',  get(form, 'beneficiary.otherNames.0.firstName'));
  set('Pt2Line10c_MiddleName', get(form, 'beneficiary.otherNames.0.middleName'));

  // Beneficiary address blocks (11 + 14 with 15 dates)
  set('Pt2Line11_InCareOfName',     get(form, 'beneficiary.mailing.inCareOf'));
  set('Pt2Line11_StreetNumberName', get(form, 'beneficiary.mailing.street'));
  set('Pt2Line11_Unit_p4_ch3',      get(form, 'beneficiary.mailing.unitType'));
  set('Pt2Line11_AptSteFlrNumber',  get(form, 'beneficiary.mailing.unitNum'));
  set('Pt2Line11_CityOrTown',       get(form, 'beneficiary.mailing.city'));
  set('Pt2Line11_State',            get(form, 'beneficiary.mailing.state'));
  set('Pt2Line11_ZipCode',          get(form, 'beneficiary.mailing.zip'));
  set('Pt2Line11_Province',         get(form, 'beneficiary.mailing.province'));
  set('Pt2Line11_PostalCode',       get(form, 'beneficiary.mailing.postal'));
  set('Pt2Line11_Country',          get(form, 'beneficiary.mailing.country'));
  set('Pt2Line15a_DateFrom',        asDate(get(form, 'beneficiary.mailing.from')));
  set('Pt2Line15b_ToFrom',          asDate(get(form, 'beneficiary.mailing.to')));

  // Physical address (12)
  set('Pt2Line12_StreetNumberName', get(form, 'beneficiary.physical.street'));
  set('Pt2Line12_Unit_p4_ch3',      get(form, 'beneficiary.physical.unitType'));
  set('Pt2Line12_AptSteFlrNumber',  get(form, 'beneficiary.physical.unitNum'));
  set('Pt2Line12_CityOrTown',       get(form, 'beneficiary.physical.city'));
  set('Pt2Line12_State',            get(form, 'beneficiary.physical.state'));
  set('Pt2Line12_ZipCode',          get(form, 'beneficiary.physical.zip'));
  set('Pt2Line12_Province',         get(form, 'beneficiary.physical.province'));
  set('Pt2Line12_PostalCode',       get(form, 'beneficiary.physical.postal'));
  set('Pt2Line12_Country',          get(form, 'beneficiary.physical.country'));

  // Employment 1 (16–19)
  const be = get(form, 'beneficiary.employment') || [];
  const BE1 = be[0] || {};
  set('Pt2Line16_NameofEmployer', BE1.employer);
  set('Pt2Line17_StreetNumberName', BE1.street);
  set('Pt2Line17_Unit_p4_ch3',      BE1.unitType);
  set('Pt2Line17_AptSteFlrNumber',  BE1.unitNum);
  set('Pt2Line17_CityOrTown',       BE1.city);
  set('Pt2Line17_State',            BE1.state);
  set('Pt2Line17_ZipCode',          BE1.zip);
  set('Pt2Line17_Province',         BE1.province);
  set('Pt2Line17_PostalCode',       BE1.postal);
  set('Pt2Line17_Country',          BE1.country);
  set('Pt2Line18_Occupation',       BE1.occupation);
  set('Pt2Line19a_DateFrom',        asDate(BE1.from));
  set('Pt2Line19b_ToFrom',          asDate(BE1.to));

  // Employment 2 (20–23)
  const BE2 = be[1] || {};
  set('Pt2Line20_NameofEmployer', BE2.employer);
  set('Pt2Line21_StreetNumberName', BE2.street);
  set('Pt2Line21_Unit_p5_ch3',      BE2.unitType);
  set('Pt2Line21_AptSteFlrNumber',  BE2.unitNum);
  set('Pt2Line21_CityOrTown',       BE2.city);
  set('Pt2Line21_State',            BE2.state);
  set('Pt2Line21_ZipCode',          BE2.zip);
  set('Pt2Line21_Province',         BE2.province);
  set('Pt2Line21_PostalCode',       BE2.postal);
  set('Pt2Line21_Country',          BE2.country);
  set('Pt2Line22_Occupation',       BE2.occupation);
  set('Pt2Line23a_DateFrom',        asDate(BE2.from));
  set('Pt2Line23b_ToFrom',          asDate(BE2.to));

  // Parents (first)
  set('Pt2Line29a_FamilyName', get(form, 'beneficiary.parents.0.lastName'));
  set('Pt2Line29b_GivenName',  get(form, 'beneficiary.parents.0.firstName'));
  set('Pt2Line29c_MiddleName', get(form, 'beneficiary.parents.0.middleName'));
  set('Pt2Line30_DateofBirth', asDate(get(form, 'beneficiary.parents.0.dob')));
  set('Pt2Line31_CityTownOfBirth', get(form, 'beneficiary.parents.0.birthCity'));
  set('Pt2Line32_CountryOfCitzOrNationality', get(form, 'beneficiary.parents.0.birthCountry'));

  // Parents (second)
  set('Pt2Line24a_FamilyName', get(form, 'beneficiary.parents.1.lastName'));
  set('Pt2Line24b_GivenName',  get(form, 'beneficiary.parents.1.firstName'));
  set('Pt2Line24c_MiddleName', get(form, 'beneficiary.parents.1.middleName'));
  set('Pt2Line26_Checkbox_p5_ch2', toBool(get(form, 'beneficiary.parents.1.living')));
  set('Pt2Line27_CountryOfCitzOrNationality', get(form, 'beneficiary.parents.1.birthCountry'));
  set('Pt2Line28a_CityTownOfBirth', get(form, 'beneficiary.parents.1.birthCity'));
  set('Pt2Line28b_CountryOfCitzOrNationality', get(form, 'beneficiary.parents.1.birthCountry'));

  // Arrival / Passport (38a–h)
  set('Pt2Line38a_LastArrivedAs',        get(form, 'beneficiary.lastArrival.classOfAdmission'));
  set('Pt2Line38b_ArrivalDeparture',     get(form, 'beneficiary.lastArrival.i94'));
  set('Pt2Line38c_DateofArrival',        asDate(get(form, 'beneficiary.lastArrival.dateArrival')));
  set('Pt2Line38d_DateExpired',          asDate(get(form, 'beneficiary.lastArrival.dateExpired')));
  set('Pt2Line38e_Passport',             get(form, 'beneficiary.passports.passportNumber'));
  set('Pt2Line38f_TravelDoc',            get(form, 'beneficiary.passports.travelDocNumber'));
  set('Pt2Line38g_CountryOfIssuance',    get(form, 'beneficiary.passports.countryOfIssuance'));
  set('Pt2Line38h_ExpDate',              asDate(get(form, 'beneficiary.passports.expDate')));

  // Contact
  set('Pt2Line46_DayTimeTelephoneNumber', get(form, 'beneficiary.contact.dayPhone'));

  // Reln & IMBRA misc (51–55)
  set('Pt2Line51_Checkboxes_p7_ch3', toBool(get(form, 'beneficiary.metInPerson')));
  set('Pt2Line52_Relationship',       get(form, 'relationship.type')); // e.g., "K-1 fiancé(e)"
  set('Pt2Line53_Checkboxes_p7_ch3',  toBool(get(form, 'relationship.metThroughIMB')));
  set('Pt2Line54_Describe',           get(form, 'relationship.howMetShort'));
  set('Pt2Line55_Checkboxes_p7_ch2',  toBool(get(form, 'beneficiary.inUS')));

  // Location (62)
  set('Pt2Line62a_CityTown', get(form, 'sign.city'));
  set('Pt2Line62b_Country',  get(form, 'sign.country'));

  // =========================
  // PART 3 — INFORMATION ABOUT MARRIAGE (IMBRA etc.)
  // (Checkboxes skeleton — wire to your wizard if/when you collect them)
  // =========================
  set('Pt3Line1_Checkboxes_p7_ch2',   toBool(get(form, 'imbra.hasPriorConvictions')));
  set('P3Line2a_Checkboxes_p7_ch2',   toBool(get(form, 'imbra.hasFiledBefore')));
  set('P3Line2b_Checkboxes_p8_ch2',   toBool(get(form, 'imbra.exempt1')));
  set('P3Line2c_Checkboxes_p8_ch2',   toBool(get(form, 'imbra.exempt2')));
  set('Pt3Line3_Checkboxes_p8_ch3',   toBool(get(form, 'imbra.disclosedToBeneficiary')));
  set('Pt3Line5_Checkboxes_p8_ch4',   toBool(get(form, 'imbra.requestedWaiver')));

  // =========================
  // PART 4 — PHYSICAL DESCRIPTION (Beneficiary)
  // =========================
  // Height (feet/inches)
  set('Pt4Line3_HeightFeet',    get(form, 'beneficiary.physical.heightFeet'));
  set('Pt4Line3_HeightInches',  get(form, 'beneficiary.physical.heightInches'));
  // Eye/hair/race (use your enums/booleans)
  set('Pt4Line5_Checkbox_p8_ch9',                  toBool(get(form, 'beneficiary.physical.eye.hasGlasses'))); // placeholder
  set('Pt4Line6_HairColor_p8_ch9',                 get(form, 'beneficiary.physical.hairColor'));
  set('Pt4Line2_Checkbox_p8_White',                toBool(get(form, 'beneficiary.physical.race.white')));
  set('Pt4Line2_Checkbox_p8_Asian',                toBool(get(form, 'beneficiary.physical.race.asian')));
  set('Pt4Line2_Checkbox_p8_BlackOrAfricanAmerrican', toBool(get(form, 'beneficiary.physical.race.black')));
  set('Pt4Line2_Checkbox_p8_AmericanIndianOrAlaskaNative', toBool(get(form, 'beneficiary.physical.race.native')));
  set('Pt4Line2_Checkbox_p8_NativeHawaiianOrPacificIslander', toBool(get(form, 'beneficiary.physical.race.pacific')));

  // =========================
  // PART 5 — PETITIONER CONTACT & SIGNATURE
  // =========================
  set('Pt5Line1_DaytimePhoneNumber1', get(form, 'petitioner.contact.dayPhone'));
  set('Pt5Line2_MobileNumber1',       get(form, 'petitioner.contact.mobile'));
  set('Pt5Line3_Email',               get(form, 'petitioner.contact.email'));
  set('Pt5Line4_DateOfSignature',     asDate(get(form, 'petitioner.signatureDate')));

  // =========================
  // PART 6 — INTERPRETER
  // =========================
  set('Pt6Line1_InterpreterFamilyName',   get(form, 'interpreter.lastName'));
  set('Pt6Line1_InterpreterGivenName',    get(form, 'interpreter.firstName'));
  set('Pt6Line2_NameofBusinessorOrgName', get(form, 'interpreter.org'));
  set('Pt6_NameOfLanguage',               get(form, 'interpreter.language'));
  set('Pt6Line4_InterpreterDaytimeTelephone_p9_n1', get(form, 'interpreter.phone1'));
  set('Pt6Line4_InterpreterDaytimeTelephone_p9_n2', get(form, 'interpreter.phone2'));
  set('Pt6Line5_Email',                   get(form, 'interpreter.email'));
  set('Pt6Line6_DateofSignature',         asDate(get(form, 'interpreter.signatureDate')));

  // =========================
  // PART 7 — PREPARER
  // =========================
  set('Pt7Line1_PreparerFamilyName', get(form, 'preparer.lastName'));
  set('Pt7Line1b_PreparerGivenName', get(form, 'preparer.firstName'));
  set('Pt7Line2_NameofBusinessorOrgName', get(form, 'preparer.org'));
  set('Pt7Line3_DaytimePhoneNumber1', get(form, 'preparer.phone'));
  set('Pt7Line4_PreparerMobileNumber', get(form, 'preparer.mobile'));
  set('Pt7Line5_Email',                get(form, 'preparer.email'));
  set('Pt7Line6_DateofSignature',      asDate(get(form, 'preparer.signatureDate')));

  // =========================
  // PART 8 — ADDITIONAL INFORMATION
  // =========================
  // If your wizard has explicit continuation entries, fill them:
  const cont = get(form, 'continuations') || [];
  cont.forEach((c) => {
    pushPart8({
      page: c.page || '',
      part: c.part || '',
      item: c.item || '',
      text: c.text || ''
    });
  });

  // Also: auto-continue if beneficiary.otherNames has >1
  const moreBenOther = get(form, 'beneficiary.otherNames') || [];
  moreBenOther.slice(1).forEach((n, i) => {
    const text = `Additional beneficiary name #${i+2}: ${[n.lastName, n.firstName, n.middleName].filter(Boolean).join(', ')}`;
    pushPart8({ page:'4', part:'2', item:'10', text });
  });

  // Allow manual overrides (escape hatch)
  const manual = get(form, 'pdfOverrides') || {};
  Object.entries(manual).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  });

  return out;
}
