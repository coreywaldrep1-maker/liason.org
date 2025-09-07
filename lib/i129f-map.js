// lib/i129f-map.js
// Map your wizard data -> PDF field names
// We'll start with the tabs you already have and expand.
export function buildPdfData(form) {
  const out = {};

  // Helper: simple copy if present
  const put = (pdfName, value) => {
    if (value == null) return;
    const v = String(value).trim();
    if (v) out[pdfName] = v;
  };

  // --- Petitioner (Part 1 names) ---
  put('Pt1Line7a_FamilyName',  form?.petitioner?.lastName);
  put('Pt1Line7b_GivenName',   form?.petitioner?.firstName);
  put('Pt1Line7c_MiddleName',  form?.petitioner?.middleName);

  // --- Mailing Address (Part 1, line 8) ---
  put('Pt1Line8_StreetNumberName', form?.mailing?.street);
  put('Pt1Line8_Unit_p0_ch3',      form?.mailing?.unitType);   // text field in your dump
  put('Pt1Line8_AptSteFlrNumber',  form?.mailing?.unitNum);
  put('Pt1Line8_CityOrTown',       form?.mailing?.city);
  put('Pt1Line8_State',            form?.mailing?.state);
  put('Pt1Line8_ZipCode',          form?.mailing?.zip);

  // --- Beneficiary (Part 2 names) ---
  put('Pt2Line1a_FamilyName', form?.beneficiary?.lastName);
  put('Pt2Line1b_GivenName',  form?.beneficiary?.firstName);
  put('Pt2Line1c_MiddleName', form?.beneficiary?.middleName);

  // --- Relationship & History (put into “Additional info” areas for now) ---
  put('Pt3Line4b_AdditionalInformation', form?.history?.howMet);
  put('Line3d_AdditionalInfo',           form?.history?.dates);
  put('Line4d_AdditionalInfo',           form?.history?.priorMarriages);

  return out;
}
