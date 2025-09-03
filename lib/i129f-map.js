// Minimal starter mapping that matches your collected fields.
// Add more as you expose more questions in the wizard.
export function toPdfFields(form = {}) {
  const out = {};

  // relationship
  const isK1 = (form.relationship?.classification || 'K1') === 'K1';
  out['Pt1Line4a_Checkboxes_p0_ch2'] = isK1 ? 'Yes' : 'Off';
  out['Pt1Line4b_Checkboxes_p0_ch2'] = !isK1 ? 'Yes' : 'Off';
  if (!isK1) {
    out['Pt1Line5_Checkboxes_p0_ch2'] = form.relationship?.i130Filed ? 'Yes' : 'No';
  }

  // petitioner name
  out['Pt1Line6a_FamilyName'] = form.petitioner?.name?.last || '';
  out['Pt1Line6b_GivenName']  = form.petitioner?.name?.first || '';
  out['Pt1Line6c_MiddleName'] = form.petitioner?.name?.middle || '';

  // petitioner numbers
  out['Pt1Line1_AlienNumber'] = form.petitioner?.aNumber || '';
  out['Pt1Line2_AcctIdentifier'] = form.petitioner?.uscisAccount || '';
  out['Pt1Line3_SSN'] = form.petitioner?.ssn || '';

  // mailing same as physical
  out['Pt1Line8j_Checkboxes_p0_ch2'] = form.petitioner?.mailingSameAsPhysical ? 'Yes' : 'No';

  // mailing address
  const m = form.petitioner?.mailing || {};
  out['Pt1Line8_InCareofName']      = m.inCareOf || '';
  out['Pt1Line8_StreetNumberName']  = m.street || '';
  out['Pt1Line8_Unit_p0_ch3']       = m.unitType ? 'Yes' : 'Off'; // presence tick (varies by template)
  out['Pt1Line8_AptSteFlrNumber']   = m.unitNumber || '';
  out['Pt1Line8_CityOrTown']        = m.city || '';
  out['Pt1Line8_State']             = m.state || m.province || '';
  out['Pt1Line8_ZipCode']           = m.zip || m.postalCode || '';
  out['Pt1Line8_Province']          = m.province || '';
  out['Pt1Line8_PostalCode']        = m.postalCode || '';
  out['Pt1Line8_Country']           = m.country || '';

  // beneficiary basics
  out['Pt2Line1a_FamilyName']       = form.beneficiary?.name?.last || '';
  out['Pt2Line1b_GivenName']        = form.beneficiary?.name?.first || '';
  out['Pt2Line1c_MiddleName']       = form.beneficiary?.name?.middle || '';
  out['Pt2Line4_DateOfBirth']       = form.beneficiary?.dob || '';
  out['Pt2Line7_CityTownOfBirth']   = form.beneficiary?.birth?.city || '';
  out['Pt2Line8_CountryOfBirth']    = form.beneficiary?.birth?.country || '';
  out['Pt2Line9_CountryofCitzOrNationality'] = form.beneficiary?.citizenship || '';

  return out;
}
