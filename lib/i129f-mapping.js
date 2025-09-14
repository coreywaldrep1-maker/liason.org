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
  // accept "YYYY-MM-DD" or Date
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
    // field not present (or not text) — ignore
  }
}

/** If checkbox/radio mapping is needed later */
function checkBox(form, name, on = true) {
  try {
    const cb = form.getCheckBox(name);
    on ? cb.check() : cb.uncheck();
  } catch {}
}

/**
 * Main mapper: write from saved JSON -> PDF AcroForm
 * Call from /api/i129f/pdf after you've loaded the saved row & PDF form.
 */
export function applyI129fMapping(saved, form) {
  if (!saved) return;

  // --------------------------
  // PART 1 — PETITIONER
  // --------------------------

  // Names (Your correct requirement: Pt1Line6a–6c are the Petitioner’s legal name)
  setText(form, 'Pt1Line6a_FamilyName',  get(saved, 'petitioner.lastName'));
  setText(form, 'Pt1Line6b_GivenName',   get(saved, 'petitioner.firstName'));
  setText(form, 'Pt1Line6c_MiddleName',  get(saved, 'petitioner.middleName'));

  // Other Names Used (first alias goes to Pt1Line7a–7c)
  setText(form, 'Pt1Line7a_FamilyName',  get(saved, 'petitioner.otherNames[0].lastName'));
  setText(form, 'Pt1Line7b_GivenName',   get(saved, 'petitioner.otherNames[0].firstName'));
  setText(form, 'Pt1Line7c_MiddleName',  get(saved, 'petitioner.otherNames[0].middleName'));

  // Mailing Address (Pt1 Line 8)
  setText(form, 'Pt1Line8_InCareofName',       get(saved, 'mailing.inCareOf'));
  setText(form, 'Pt1Line8_StreetNumberName',   get(saved, 'mailing.street'));
  setText(form, 'Pt1Line8_AptSteFlrNumber',    get(saved, 'mailing.unitNum'));
  setText(form, 'Pt1Line8_CityOrTown',         get(saved, 'mailing.city'));
  setText(form, 'Pt1Line8_State',              get(saved, 'mailing.state'));
  setText(form, 'Pt1Line8_ZipCode',            get(saved, 'mailing.zip'));
  setText(form, 'Pt1Line8_Province',           get(saved, 'mailing.province'));
  setText(form, 'Pt1Line8_PostalCode',         get(saved, 'mailing.postal'));
  setText(form, 'Pt1Line8_Country',            get(saved, 'mailing.country'));

  // Optional: if you store mailing.unitType like "Apt/Ste/Flr", we try to stuff it if field exists
  setText(form, 'Pt1Line8_Unit_p0_ch3',        get(saved, 'mailing.unitType')); // if your PDF exposes this as text

  // Physical address history (Lines 9–12) – we’ll map the first two addresses if present
  // Address #1 → Lines 9 + 10 dates
  setText(form, 'Pt1Line9_StreetNumberName',   get(saved, 'physicalAddresses[0].street'));
  setText(form, 'Pt1Line9_AptSteFlrNumber',    get(saved, 'physicalAddresses[0].unitNum'));
  setText(form, 'Pt1Line9_CityOrTown',         get(saved, 'physicalAddresses[0].city'));
  setText(form, 'Pt1Line9_State',              get(saved, 'physicalAddresses[0].state'));
  setText(form, 'Pt1Line9_ZipCode',            get(saved, 'physicalAddresses[0].zip'));
  setText(form, 'Pt1Line9_Province',           get(saved, 'physicalAddresses[0].province'));
  setText(form, 'Pt1Line9_PostalCode',         get(saved, 'physicalAddresses[0].postal'));
  setText(form, 'Pt1Line9_Country',            get(saved, 'physicalAddresses[0].country'));
  setText(form, 'Pt1Line10a_DateFrom',         fmtDate(get(saved, 'physicalAddresses[0].from')));
  setText(form, 'Pt1Line10b_DateFrom',         fmtDate(get(saved, 'physicalAddresses[0].to'))); // PDF label uses "ToFrom" on some revs

  // Address #2 → Lines 11 + 12 dates
  setText(form, 'Pt1Line11_StreetNumberName',  get(saved, 'physicalAddresses[1].street'));
  setText(form, 'Pt1Line11_AptSteFlrNumber',   get(saved, 'physicalAddresses[1].unitNum'));
  setText(form, 'Pt1Line11_CityOrTown',        get(saved, 'physicalAddresses[1].city'));
  setText(form, 'Pt1Line11_State',             get(saved, 'physicalAddresses[1].state'));
  setText(form, 'Pt1Line11_ZipCode',           get(saved, 'physicalAddresses[1].zip'));
  setText(form, 'Pt1Line11_Province',          get(saved, 'physicalAddresses[1].province'));
  setText(form, 'Pt1Line11_PostalCode',        get(saved, 'physicalAddresses[1].postal'));
  setText(form, 'Pt1Line11_Country',           get(saved, 'physicalAddresses[1].country'));
  setText(form, 'Pt1Line12a_DateFrom',         fmtDate(get(saved, 'physicalAddresses[1].from')));
  setText(form, 'Pt1Line12b_ToFrom',           fmtDate(get(saved, 'physicalAddresses[1].to')));

  // Employment #1 → Lines 13–16
  setText(form, 'Pt1Line13_NameofEmployer',    get(saved, 'employment[0].employer'));
  setText(form, 'Pt1Line14_StreetNumberName',  get(saved, 'employment[0].street'));
  setText(form, 'Pt1Line14_AptSteFlrNumber',   get(saved, 'employment[0].unitNum'));
  setText(form, 'Pt1Line14_CityOrTown',        get(saved, 'employment[0].city'));
  setText(form, 'Pt1Line14_State',             get(saved, 'employment[0].state'));
  setText(form, 'Pt1Line14_ZipCode',           get(saved, 'employment[0].zip'));
  setText(form, 'Pt1Line14_Province',          get(saved, 'employment[0].province'));
  setText(form, 'Pt1Line14_PostalCode',        get(saved, 'employment[0].postal'));
  setText(form, 'Pt1Line14_Country',           get(saved, 'employment[0].country'));
  setText(form, 'Pt1Line15_Occupation',        get(saved, 'employment[0].occupation'));
  setText(form, 'Pt1Line16a_DateFrom',         fmtDate(get(saved, 'employment[0].from')));
  setText(form, 'Pt1Line16b_ToFrom',           fmtDate(get(saved, 'employment[0].to')));

  // Employment #2 → Lines 17–20
  setText(form, 'Pt1Line17_NameofEmployer',    get(saved, 'employment[1].employer'));
  setText(form, 'Pt1Line18_StreetNumberName',  get(saved, 'employment[1].street'));
  setText(form, 'Pt1Line18_AptSteFlrNumber',   get(saved, 'employment[1].unitNum'));
  setText(form, 'Pt1Line18_CityOrTown',        get(saved, 'employment[1].city'));
  setText(form, 'Pt1Line18_State',             get(saved, 'employment[1].state'));
  setText(form, 'Pt1Line18_ZipCode',           get(saved, 'employment[1].zip'));
  setText(form, 'Pt1Line18_Province',          get(saved, 'employment[1].province'));
  setText(form, 'Pt1Line18_PostalCode',        get(saved, 'employment[1].postal'));
  setText(form, 'Pt1Line18_Country',           get(saved, 'employment[1].country'));
  setText(form, 'Pt1Line19_Occupation',        get(saved, 'employment[1].occupation'));
  setText(form, 'Pt1Line20a_DateFrom',         fmtDate(get(saved, 'employment[1].from')));
  setText(form, 'Pt1Line20b_ToFrom',           fmtDate(get(saved, 'employment[1].to')));

  // …(You can continue Part 1 lines 21+ here as needed)

  // --------------------------
  // PART 2 — BENEFICIARY
  // --------------------------
  setText(form, 'Pt2Line1a_FamilyName',        get(saved, 'beneficiary.lastName'));
  setText(form, 'Pt2Line1b_GivenName',         get(saved, 'beneficiary.firstName'));
  setText(form, 'Pt2Line1c_MiddleName',        get(saved, 'beneficiary.middleName'));

  setText(form, 'Pt2Line2_AlienNumber',        get(saved, 'beneficiary.aNumber'));
  setText(form, 'Pt2Line3_SSN',                get(saved, 'beneficiary.ssn'));
  setText(form, 'Pt2Line4_DateOfBirth',        fmtDate(get(saved, 'beneficiary.dob')));
  // sex, marital status, etc. are usually checkboxes — skip for now to avoid type errors

  setText(form, 'Pt2Line7_CityTownOfBirth',    get(saved, 'beneficiary.birthCity'));
  setText(form, 'Pt2Line8_CountryOfBirth',     get(saved, 'beneficiary.birthCountry'));
  setText(form, 'Pt2Line9_CountryofCitzOrNationality', get(saved, 'beneficiary.citizenship'));

  // Other names used (first alias)
  setText(form, 'Pt2Line10a_FamilyName',       get(saved, 'beneficiary.otherNames[0].lastName'));
  setText(form, 'Pt2Line10b_GivenName',        get(saved, 'beneficiary.otherNames[0].firstName'));
  setText(form, 'Pt2Line10c_MiddleName',       get(saved, 'beneficiary.otherNames[0].middleName'));

  // Beneficiary addresses (Pt2 Line 11 + 14 and date ranges 15)
  setText(form, 'Pt2Line11_InCareOfName',      get(saved, 'beneficiary.mailing.inCareOf'));
  setText(form, 'Pt2Line11_StreetNumberName',  get(saved, 'beneficiary.mailing.street'));
  setText(form, 'Pt2Line11_AptSteFlrNumber',   get(saved, 'beneficiary.mailing.unitNum'));
  setText(form, 'Pt2Line11_CityOrTown',        get(saved, 'beneficiary.mailing.city'));
  setText(form, 'Pt2Line11_State',             get(saved, 'beneficiary.mailing.state'));
  setText(form, 'Pt2Line11_ZipCode',           get(saved, 'beneficiary.mailing.zip'));
  setText(form, 'Pt2Line11_Province',          get(saved, 'beneficiary.mailing.province'));
  setText(form, 'Pt2Line11_PostalCode',        get(saved, 'beneficiary.mailing.postal'));
  setText(form, 'Pt2Line11_Country',           get(saved, 'beneficiary.mailing.country'));

  setText(form, 'Pt2Line14_StreetNumberName',  get(saved, 'beneficiary.physical[0].street'));
  setText(form, 'Pt2Line14_AptSteFlrNumber',   get(saved, 'beneficiary.physical[0].unitNum'));
  setText(form, 'Pt2Line14_CityOrTown',        get(saved, 'beneficiary.physical[0].city'));
  setText(form, 'Pt2Line14_State',             get(saved, 'beneficiary.physical[0].state'));
  setText(form, 'Pt2Line14_ZipCode',           get(saved, 'beneficiary.physical[0].zip'));
  setText(form, 'Pt2Line14_Province',          get(saved, 'beneficiary.physical[0].province'));
  setText(form, 'Pt2Line14_PostalCode',        get(saved, 'beneficiary.physical[0].postal'));
  setText(form, 'Pt2Line14_Country',           get(saved, 'beneficiary.physical[0].country'));

  setText(form, 'Pt2Line15a_DateFrom',         fmtDate(get(saved, 'beneficiary.physical[0].from')));
  setText(form, 'Pt2Line15b_ToFrom',           fmtDate(get(saved, 'beneficiary.physical[0].to')));

  // Employment #1 (beneficiary)
  setText(form, 'Pt2Line16_NameofEmployer',    get(saved, 'beneficiary.employment[0].employer'));
  setText(form, 'Pt2Line17_StreetNumberName',  get(saved, 'beneficiary.employment[0].street'));
  setText(form, 'Pt2Line17_AptSteFlrNumber',   get(saved, 'beneficiary.employment[0].unitNum'));
  setText(form, 'Pt2Line17_CityOrTown',        get(saved, 'beneficiary.employment[0].city'));
  setText(form, 'Pt2Line17_State',             get(saved, 'beneficiary.employment[0].state'));
  setText(form, 'Pt2Line17_ZipCode',           get(saved, 'beneficiary.employment[0].zip'));
  setText(form, 'Pt2Line17_Province',          get(saved, 'beneficiary.employment[0].province'));
  setText(form, 'Pt2Line17_PostalCode',        get(saved, 'beneficiary.employment[0].postal'));
  setText(form, 'Pt2Line17_Country',           get(saved, 'beneficiary.employment[0].country'));
  setText(form, 'Pt2Line18_Occupation',        get(saved, 'beneficiary.employment[0].occupation'));
  setText(form, 'Pt2Line19a_DateFrom',         fmtDate(get(saved, 'beneficiary.employment[0].from')));
  setText(form, 'Pt2Line19b_ToFrom',           fmtDate(get(saved, 'beneficiary.employment[0].to')));

  // …continue Part 2 fields as you add UI for them

  // NOTE: Checkboxes / radios (e.g., sex, marital status, Yes/No items) can be added
  // in a second pass using `checkBox(form, 'FieldName', true)`, once we confirm the field names.
}

/**
 * If you want to expose the list of fields you’re mapping (for the /all-fields page),
 * export them so you can iterate in the UI. Optional.
 */
export const I129F_DEBUG_FIELD_LIST = [
  // A light list so the /all-fields page can render something predictable
  // — extend as needed
  'Pt1Line6a_FamilyName',
  'Pt1Line6b_GivenName',
  'Pt1Line6c_MiddleName',
  'Pt1Line7a_FamilyName',
  'Pt1Line7b_GivenName',
  'Pt1Line7c_MiddleName',
  'Pt1Line8_StreetNumberName',
  'Pt1Line8_AptSteFlrNumber',
  'Pt1Line8_CityOrTown',
  'Pt1Line8_State',
  'Pt1Line8_ZipCode',

  'Pt1Line9_StreetNumberName',
  'Pt1Line10a_DateFrom',
  'Pt1Line10b_DateFrom',

  'Pt1Line13_NameofEmployer',
  'Pt1Line14_StreetNumberName',
  'Pt1Line15_Occupation',
  'Pt1Line16a_DateFrom',
  'Pt1Line16b_ToFrom',

  'Pt2Line1a_FamilyName',
  'Pt2Line1b_GivenName',
  'Pt2Line1c_MiddleName',
  'Pt2Line2_AlienNumber',
  'Pt2Line3_SSN',
  'Pt2Line4_DateOfBirth',
  'Pt2Line7_CityTownOfBirth',
  'Pt2Line8_CountryOfBirth',
  'Pt2Line9_CountryofCitzOrNationality',
  'Pt2Line10a_FamilyName',
  'Pt2Line10b_GivenName',
  'Pt2Line10c_MiddleName',
  'Pt2Line14_StreetNumberName',
  'Pt2Line15a_DateFrom',
  'Pt2Line15b_ToFrom',
  'Pt2Line16_NameofEmployer',
  'Pt2Line17_StreetNumberName',
  'Pt2Line18_Occupation',
  'Pt2Line19a_DateFrom',
  'Pt2Line19b_ToFrom',
];
