// lib/i129f-map.js
export function mapFormToFields(form) {
  const out = {};

  // relationship
  const isK1 = (form.relationship?.classification || 'K1') === 'K1';
  out['Pt1Line4a_Checkboxes_p0_ch2'] = isK1 ? 'Yes' : 'Off';
  out['Pt1Line4b_Checkboxes_p0_ch2'] = !isK1 ? 'Yes' : 'Off';

  // petitioner name
  out['Pt1Line6a_FamilyName'] = form.petitioner?.name?.last || '';
  out['Pt1Line6b_GivenName'] = form.petitioner?.name?.first || '';
  out['Pt1Line6c_MiddleName'] = form.petitioner?.name?.middle || '';

  // beneficiary info
  out['Pt2Line1a_FamilyName'] = form.beneficiary?.name?.last || '';
  out['Pt2Line1b_GivenName'] = form.beneficiary?.name?.first || '';
  out['Pt2Line1c_MiddleName'] = form.beneficiary?.name?.middle || '';
  
  // Add more field mappings as needed...

  return out;
}
