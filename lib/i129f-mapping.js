// lib/i129f-mapping.js

/** Simple helpers */
const mmddyyyy = (v = '') => {
  // Accepts 'YYYY-MM-DD' and returns 'MM/DD/YYYY'
  if (!v) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (m) return `${m[2]}/${m[3]}/${m[1]}`;
  return v; // already human format
};

function setText(form, fieldName, value) {
  if (value == null || value === '') return;
  try {
    const f = form.getTextField(fieldName);
    f.setText(String(value));
  } catch {
    // ignore missing field
  }
}

/**
 * Map your saved JSON shape -> PDF AcroForm fields.
 * Start small (fields you already collect), then extend.
 */
export function applyI129fMapping(saved, form) {
  if (!saved || typeof saved !== 'object') return;

  const p = saved.petitioner || {};
  const pName = p.name || {};
  const pAddr0 = (p.addresses && p.addresses[0]) || {};
  const pEmp0 = (p.employments && p.employments[0]) || {};

  const b = saved.beneficiary || {};
  const bName = b.name || {};
  const bAddr0 = (b.addresses && b.addresses[0]) || {};
  const bEmp0 = (b.employments && b.employments[0]) || {};

  /* ---------------- Part 1 — Petitioner (names) ---------------- */
  setText(form, 'Pt1Line7a_FamilyName', pName.lastName);
  setText(form, 'Pt1Line7b_GivenName',  pName.firstName);
  setText(form, 'Pt1Line7c_MiddleName', pName.middleName);

  // IDs / birth
  setText(form, 'Pt1Line1_AlienNumber', p.aNumber);
  setText(form, 'Pt1Line3_SSN',         p.ssn);
  setText(form, 'Pt1Line11_DateofBirth', mmddyyyy(p.dob));
  setText(form, 'Pt1Line24_CityTownOfBirth',   p.birth?.city);
  setText(form, 'Pt1Line25_ProvinceOrStateOfBirth', p.birth?.state);
  setText(form, 'Pt1Line26_CountryOfCitzOrNationality', p.birth?.country);

  // Mailing address (current)
  setText(form, 'Pt1Line8_InCareofName',       ''); // optional
  setText(form, 'Pt1Line8_StreetNumberName',   pAddr0.street);
  setText(form, 'Pt1Line8_Unit_p0_ch3',        pAddr0.unitType); // text in this PDF
  setText(form, 'Pt1Line8_AptSteFlrNumber',    pAddr0.unitNum);
  setText(form, 'Pt1Line8_CityOrTown',         pAddr0.city);
  setText(form, 'Pt1Line8_State',              pAddr0.state);
  setText(form, 'Pt1Line8_ZipCode',            pAddr0.zip);
  setText(form, 'Pt1Line8_Province',           pAddr0.province);
  setText(form, 'Pt1Line8_PostalCode',         pAddr0.postal);
  setText(form, 'Pt1Line8_Country',            pAddr0.country);

  // Prior address (example mapping to Line 9)
  if (saved.petitioner?.addresses?.[1]) {
    const a1 = saved.petitioner.addresses[1];
    setText(form, 'Pt1Line9_StreetNumberName', a1.street);
    setText(form, 'Pt1Line9_AptSteFlrNumber',  a1.unitNum);
    setText(form, 'Pt1Line9_CityOrTown',       a1.city);
    setText(form, 'Pt1Line9_State',            a1.state);
    setText(form, 'Pt1Line9_ZipCode',          a1.zip);
    setText(form, 'Pt1Line9_Province',         a1.province);
    setText(form, 'Pt1Line9_PostalCode',       a1.postal);
    setText(form, 'Pt1Line9_Country',          a1.country);
    // dates
    setText(form, 'Pt1Line10a_DateFrom', mmddyyyy(a1.from));
    setText(form, 'Pt1Line10b_DateFrom', mmddyyyy(a1.to));
  }

  // Employment (current)
  setText(form, 'Pt1Line13_NameofEmployer', pEmp0.employerName);
  setText(form, 'Pt1Line14_StreetNumberName', pEmp0.street);
  setText(form, 'Pt1Line14_AptSteFlrNumber',  pEmp0.unitNum);
  setText(form, 'Pt1Line14_CityOrTown',       pEmp0.city);
  setText(form, 'Pt1Line14_State',            pEmp0.state);
  setText(form, 'Pt1Line14_ZipCode',          pEmp0.zip);
  setText(form, 'Pt1Line14_Province',         pEmp0.province);
  setText(form, 'Pt1Line14_PostalCode',       pEmp0.postal);
  setText(form, 'Pt1Line14_Country',          pEmp0.country);
  setText(form, 'Pt1Line15_Occupation',       pEmp0.occupation);
  setText(form, 'Pt1Line16a_DateFrom',        mmddyyyy(pEmp0.from));
  setText(form, 'Pt1Line16b_ToFrom',          mmddyyyy(pEmp0.to));

  /* ---------------- Part 2 — Beneficiary (names) ---------------- */
  setText(form, 'Pt2Line1a_FamilyName', bName.lastName);
  setText(form, 'Pt2Line1b_GivenName',  bName.firstName);
  setText(form, 'Pt2Line1c_MiddleName', bName.middleName);

  setText(form, 'Pt2Line2_AlienNumber', b.aNumber);
  setText(form, 'Pt2Line3_SSN',         b.ssn);
  setText(form, 'Pt2Line4_DateOfBirth', mmddyyyy(b.dob));
  setText(form, 'Pt2Line7_CityTownOfBirth', b.birth?.city);
  setText(form, 'Pt2Line8_CountryOfBirth',  b.birth?.country);
  setText(form, 'Pt2Line9_CountryofCitzOrNationality', b.nationality);

  // Beneficiary mailing / current address
  setText(form, 'Pt2Line11_InCareOfName',       ''); // optional
  setText(form, 'Pt2Line11_StreetNumberName',   bAddr0.street);
  setText(form, 'Pt2Line11_AptSteFlrNumber',    bAddr0.unitNum);
  setText(form, 'Pt2Line11_CityOrTown',         bAddr0.city);
  setText(form, 'Pt2Line11_State',              bAddr0.state);
  setText(form, 'Pt2Line11_ZipCode',            bAddr0.zip);
  setText(form, 'Pt2Line11_Province',           bAddr0.province);
  setText(form, 'Pt2Line11_PostalCode',         bAddr0.postal);
  setText(form, 'Pt2Line11_Country',            bAddr0.country);

  // Beneficiary employer (example)
  setText(form, 'Pt2Line16_NameofEmployer', bEmp0.employerName);
  setText(form, 'Pt2Line18_StreetNumberName', bEmp0.street);
  setText(form, 'Pt2Line18_AptSteFlrNumber',  bEmp0.unitNum);
  setText(form, 'Pt2Line18_CityOrTown',       bEmp0.city);
  setText(form, 'Pt2Line18_State',            bEmp0.state);
  setText(form, 'Pt2Line18_ZipCode',          bEmp0.zip);
  setText(form, 'Pt2Line18_Province',         bEmp0.province);
  setText(form, 'Pt2Line18_PostalCode',       bEmp0.postal);
  setText(form, 'Pt2Line18_Country',          bEmp0.country);
  setText(form, 'Pt2Line18_Occupation',       bEmp0.occupation);
  setText(form, 'Pt2Line19a_DateFrom',        mmddyyyy(bEmp0.from));
  setText(form, 'Pt2Line19b_ToFrom',          mmddyyyy(bEmp0.to));

  // Contact (Part 5 petitioner)
  setText(form, 'Pt5Line1_DaytimePhoneNumber1', p.contact?.daytimePhone);
  setText(form, 'Pt5Line2_MobileNumber1',      p.contact?.mobile);
  setText(form, 'Pt5Line3_Email',              p.contact?.email);
  setText(form, 'Pt5Line4_DateOfSignature',    mmddyyyy(saved.signatures?.petitioner?.date));

  // Interpreter (Part 6) — sample
  if (saved.interpreter?.used === 'yes') {
    setText(form, 'Pt6Line1_InterpreterFamilyName', saved.interpreter?.name?.lastName);
    setText(form, 'Pt6Line1_InterpreterGivenName',  saved.interpreter?.name?.firstName);
    setText(form, 'Pt6Line2_NameofBusinessorOrgName', saved.interpreter?.business);
    setText(form, 'Pt6Line4_InterpreterDaytimeTelephone_p9_n1', saved.interpreter?.daytimePhone);
    setText(form, 'Pt6Line5_Email', saved.interpreter?.email);
    setText(form, 'Pt6_NameOfLanguage', saved.interpreter?.language);
    setText(form, 'Pt6Line6_DateofSignature', mmddyyyy(saved.interpreter?.date));
  }

  // Preparer (Part 7) — sample
  if (saved.preparer?.used === 'yes') {
    setText(form, 'Pt7Line1_PreparerFamilyName', saved.preparer?.name?.lastName);
    setText(form, 'Pt7Line1b_PreparerGivenName', saved.preparer?.name?.firstName);
    setText(form, 'Pt7Line2_NameofBusinessorOrgName', saved.preparer?.business);
    setText(form, 'Pt7Line3_DaytimePhoneNumber1', saved.preparer?.daytimePhone);
    setText(form, 'Pt7Line4_PreparerMobileNumber', saved.preparer?.mobile);
    setText(form, 'Pt7Line5_Email', saved.preparer?.email);
    setText(form, 'Pt7Line6_DateofSignature', mmddyyyy(saved.preparer?.date));
  }

  // NOTE: As we add more UI fields, extend this mapping with the 341 names you printed from /api/i129f/fields
}
