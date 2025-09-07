// lib/i129f-mapping.js
// Map your wizard JSON -> PDF field names
export const WIZARD_TO_PDF = {
  // Petitioner (Part 1 names)
  'petitioner.lastName': 'Pt1Line7a_FamilyName',
  'petitioner.firstName': 'Pt1Line7b_GivenName',
  'petitioner.middleName': 'Pt1Line7c_MiddleName',

  // Mailing (Part 1, Line 8)
  'mailing.street': 'Pt1Line8_StreetNumberName',
  'mailing.unitType': 'Pt1Line8_Unit_p0_ch3',        // PDF uses a weird name; if it doesn’t show, we’ll revisit
  'mailing.unitNum': 'Pt1Line8_AptSteFlrNumber',
  'mailing.city': 'Pt1Line8_CityOrTown',
  'mailing.state': 'Pt1Line8_State',
  'mailing.zip': 'Pt1Line8_ZipCode',
  // add more as we go...
};

// Flatten nested object with "a.b.c" keys
export function flatten(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}
