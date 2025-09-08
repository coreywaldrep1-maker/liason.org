// lib/i129f-mapping.js

/** Guard fill to avoid throwing if a field ID doesn’t exist */
function set(form, fieldId, value) {
  try {
    if (!fieldId || value == null || value === '') return;
    const f = form.getTextField(fieldId);
    if (f) f.setText(String(value));
  } catch {}
}

function fmtDate(yyyyMmDd) {
  // input from <input type="date"> as "YYYY-MM-DD", output "MM/DD/YYYY"
  if (!yyyyMmDd || typeof yyyyMmDd !== 'string' || yyyyMmDd.length < 10) return '';
  const [y, m, d] = yyyyMmDd.split('-');
  if (!y || !m || !d) return '';
  return `${m}/${d}/${y}`;
}

/**
 * Apply JSON -> PDF mapping
 * Supports:
 * - petitioner names + other names used (first row)
 * - mailing
 * - physical addresses (up to 4)
 * - employers (up to 2)
 */
export function applyI129fMapping(data, form) {
  const pet = data?.petitioner || {};
  const mailing = data?.mailing || {};
  const addrs = Array.isArray(data?.addresses) ? data.addresses : [];
  const emps  = Array.isArray(data?.employers) ? data.employers : [];

  // --- Petitioner (Part 1 names)
  set(form, 'Pt1Line7a_FamilyName', pet.lastName);
  set(form, 'Pt1Line7b_GivenName',  pet.firstName);
  set(form, 'Pt1Line7c_MiddleName', pet.middleName);

  // Other names used – map the first one (I-129F has a single row on p1, line 6)
  const other0 = Array.isArray(pet.otherNames) && pet.otherNames[0] ? pet.otherNames[0] : null;
  if (other0) {
    set(form, 'Pt1Line6a_FamilyName', other0.lastName);
    set(form, 'Pt1Line6b_GivenName',  other0.firstName);
    set(form, 'Pt1Line6c_MiddleName', other0.middleName);
  }

  // --- Mailing (Part 1, Line 8)
  set(form, 'Pt1Line8_StreetNumberName', mailing.street);
  set(form, 'Pt1Line8_Unit_p0_ch3',      mailing.unitType);     // text field in this template
  set(form, 'Pt1Line8_AptSteFlrNumber',  mailing.unitNum);
  set(form, 'Pt1Line8_CityOrTown',       mailing.city);
  set(form, 'Pt1Line8_State',            mailing.state);
  set(form, 'Pt1Line8_ZipCode',          mailing.zip);

  // --- Physical address history (Part 1 lines 9, 11, 14, 18 + date ranges 10a/10b/12a/12b)
  // Address #1 -> line 9; dates into 10a / 10b (this PDF has odd suffixes; we just populate)
  if (addrs[0]) {
    const a = addrs[0];
    set(form, 'Pt1Line9_StreetNumberName', a.street);
    set(form, 'Pt1Line9_Unit_p1_ch3',      a.unitType);
    set(form, 'Pt1Line9_AptSteFlrNumber',  a.unitNum);
    set(form, 'Pt1Line9_CityOrTown',       a.city);
    set(form, 'Pt1Line9_State',            a.state);
    set(form, 'Pt1Line9_ZipCode',          a.zip);
    set(form, 'Pt1Line10a_DateFrom',       fmtDate(a.from));
    set(form, 'Pt1Line10b_DateFrom',       fmtDate(a.to));
  }
  // Address #2 -> line 11; dates into 12a / 12b
  if (addrs[1]) {
    const a = addrs[1];
    set(form, 'Pt1Line11_StreetNumberName', a.street);
    set(form, 'Pt1Line11_Unit_p1_ch3',      a.unitType);
    set(form, 'Pt1Line11_AptSteFlrNumber',  a.unitNum);
    set(form, 'Pt1Line11_CityOrTown',       a.city);
    set(form, 'Pt1Line11_State',            a.state);
    set(form, 'Pt1Line11_ZipCode',          a.zip);
    set(form, 'Pt1Line12a_DateFrom',        fmtDate(a.from));
    set(form, 'Pt1Line12b_ToFrom',          fmtDate(a.to));
  }
  // Address #3 -> line 14 (no explicit dates listed next to it in your field dump)
  if (addrs[2]) {
    const a = addrs[2];
    set(form, 'Pt1Line14_StreetNumberName', a.street);
    set(form, 'Pt1Line14_Unit_p1_ch3',      a.unitType);
    set(form, 'Pt1Line14_AptSteFlrNumber',  a.unitNum);
    set(form, 'Pt1Line14_CityOrTown',       a.city);
    set(form, 'Pt1Line14_State',            a.state);
    set(form, 'Pt1Line14_ZipCode',          a.zip);
  }
  // Address #4 -> line 18 (again, no matching date fields listed; we’ll fill address only)
  if (addrs[3]) {
    const a = addrs[3];
    set(form, 'Pt1Line18_StreetNumberName', a.street);
    set(form, 'Pt1Line18_Unit_p1_ch3',      a.unitType);
    set(form, 'Pt1Line18_AptSteFlrNumber',  a.unitNum);
    set(form, 'Pt1Line18_CityOrTown',       a.city);
    set(form, 'Pt1Line18_State',            a.state);
    set(form, 'Pt1Line18_ZipCode',          a.zip);
  }

  // --- Employment history (Part 1 lines 13–20)
  // Employer #1 – lines 13/14/15 + dates 16a/16b
  if (emps[0]) {
    const e = emps[0];
    set(form, 'Pt1Line13_NameofEmployer',   e.name);
    set(form, 'Pt1Line15_Occupation',       e.occupation);

    set(form, 'Pt1Line14_StreetNumberName', e.street);
    set(form, 'Pt1Line14_Unit_p1_ch3',      e.unitType);
    set(form, 'Pt1Line14_AptSteFlrNumber',  e.unitNum);
    set(form, 'Pt1Line14_CityOrTown',       e.city);
    set(form, 'Pt1Line14_State',            e.state);
    set(form, 'Pt1Line14_ZipCode',          e.zip);

    set(form, 'Pt1Line16a_DateFrom',        fmtDate(e.from));
    set(form, 'Pt1Line16b_ToFrom',          fmtDate(e.to));
  }

  // Employer #2 – lines 17/18/19 + dates 20a/20b
  if (emps[1]) {
    const e = emps[1];
    set(form, 'Pt1Line17_NameofEmployer',   e.name);
    set(form, 'Pt1Line19_Occupation',       e.occupation);

    set(form, 'Pt1Line18_StreetNumberName', e.street);
    set(form, 'Pt1Line18_Unit_p1_ch3',      e.unitType);
    set(form, 'Pt1Line18_AptSteFlrNumber',  e.unitNum);
    set(form, 'Pt1Line18_CityOrTown',       e.city);
    set(form, 'Pt1Line18_State',            e.state);
    set(form, 'Pt1Line18_ZipCode',          e.zip);

    set(form, 'Pt1Line20a_DateFrom',        fmtDate(e.from));
    set(form, 'Pt1Line20b_ToFrom',          fmtDate(e.to));
  }

  // (We’ll expand Beneficiary, Part 2+ next pass.)
}
