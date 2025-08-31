// lib/i129fFieldMap.js
//
// Logical keys (your app/wizard data) -> PDF AcroForm field names
// based on the fields discovered in the "USCIS I-129F 2025.pdf".
//
// Notes:
// - Text fields map 1:1 to PDF text fields.
// - Checkboxes/radios: we only store the field *name* here; the API
//   will "check()" or "uncheck()" them using pdf-lib so you don't need
//   to know the "On" value.
// - You can safely extend this object over time.

export const I129F_FIELD_MAP = {
  // ---------- PART 1: You (Petitioner) ----------
  text: {
    // IDs / numbers
    petitioner_alien_number: 'Pt1Line1_AlienNumber',
    petitioner_uscis_online_acct: 'Pt1Line2_AcctIdentifier',
    petitioner_ssn: 'Pt1Line3_SSN',

    // Your legal name
    petitioner_last: 'Pt1Line6a_FamilyName',
    petitioner_first: 'Pt1Line6b_GivenName',
    petitioner_middle: 'Pt1Line6c_MiddleName',

    // Other name used (first set)
    petitioner_other_last: 'Pt1Line7a_FamilyName',
    petitioner_other_first: 'Pt1Line7b_GivenName',
    petitioner_other_middle: 'Pt1Line7c_MiddleName',

    // Mailing address
    mail_in_care_of: 'Pt1Line8_InCareofName',
    mail_street: 'Pt1Line8_StreetNumberName',
    mail_unit_number: 'Pt1Line8_AptSteFlrNumber',
    mail_city: 'Pt1Line8_CityOrTown',
    mail_state: 'Pt1Line8_State',
    mail_zip: 'Pt1Line8_ZipCode',
    mail_province: 'Pt1Line8_Province',
    mail_postal: 'Pt1Line8_PostalCode',
    mail_country: 'Pt1Line8_Country',

    // Physical address 1
    phys1_street: 'Pt1Line9_StreetNumberName',
    phys1_unit_number: 'Pt1Line9_AptSteFlrNumber',
    phys1_city: 'Pt1Line9_CityOrTown',
    phys1_state: 'Pt1Line9_State',
    phys1_zip: 'Pt1Line9_ZipCode',
    phys1_province: 'Pt1Line9_Province',
    phys1_postal: 'Pt1Line9_PostalCode',
    phys1_country: 'Pt1Line9_Country',

    // Physical address 2 (if used)
    phys2_street: 'Pt1Line11_StreetNumberName',
    phys2_unit_number: 'Pt1Line11_AptSteFlrNumber',
    phys2_city: 'Pt1Line11_CityOrTown',
    phys2_state: 'Pt1Line11_State',
    phys2_zip: 'Pt1Line11_ZipCode',
    phys2_province: 'Pt1Line11_Province',
    phys2_postal: 'Pt1Line11_PostalCode',
    phys2_country: 'Pt1Line11_Country',

    // Employment (Employer 1)
    emp1_name: 'Pt1Line13_NameofEmployer',
    emp1_street: 'Pt1Line14_StreetNumberName',
    emp1_unit_number: 'Pt1Line14_AptSteFlrNumber',
    emp1_city: 'Pt1Line14_CityOrTown',
    emp1_state: 'Pt1Line14_State',
    emp1_zip: 'Pt1Line14_ZipCode',
    emp1_province: 'Pt1Line14_Province',
    emp1_postal: 'Pt1Line14_PostalCode',
    emp1_country: 'Pt1Line14_Country',
    emp1_occupation: 'Pt1Line15_Occupation',
    emp1_date_from: 'Pt1Line16a_DateFrom',
    emp1_date_to: 'Pt1Line16b_ToFrom',

    // Employment (Employer 2)
    emp2_name: 'Pt1Line17_NameofEmployer',
    emp2_street: 'Pt1Line18_StreetNumberName',
    emp2_unit_number: 'Pt1Line18_AptSteFlrNumber',
    emp2_city: 'Pt1Line18_CityOrTown',
    emp2_state: 'Pt1Line18_State',
    emp2_zip: 'Pt1Line18_ZipCode',
    emp2_province: 'Pt1Line18_Province',
    emp2_postal: 'Pt1Line18_PostalCode',
    emp2_country: 'Pt1Line18_Country',
    emp2_occupation: 'Pt1Line19_Occupation',
    emp2_date_from: 'Pt2Line19a_DateFrom', // (present in PDF’s list)
    emp2_date_to: 'Pt2Line19b_ToFrom',

    // DOB / Birthplace / Citizenship (you)
    petitioner_dob: 'Pt1Line22_DateofBirth',
    petitioner_birth_city: 'Pt1Line24_CityTownOfBirth',
    petitioner_birth_state_province: 'Pt1Line25_ProvinceOrStateOfBirth',
    petitioner_birth_country: 'Pt1Line26_CountryOfCitzOrNationality', // field name in list uses “CitzOrNationality”
  },

  // Radios / checkboxes (we’ll “check”/“uncheck” in code)
  checks: {
    // 4. Classification request (K-1 vs K-3)
    class_k1: 'Pt1Line4a_Checkboxes_p0_ch2',
    // If your PDF gives a distinct field for 4.b (K-3), add it here when you see it:
    // class_k3: 'Pt1Line4b_Checkboxes_p0_ch2', // add if present

    // 5. Filed I-130 for K-3?
    k3_i130_filed: 'Pt1Line5_Checkboxes_p0_ch2',

    // 8.j Mailing same as physical
    mailing_same_as_physical: 'Pt1Line8j_Checkboxes_p0_ch2',
  },
};
