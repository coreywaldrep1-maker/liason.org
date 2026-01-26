// lib/pdf/fillI129F.js
// Fills the I-129F template PDF using pdf-lib.
// Supports BOTH:
//  1) "Renamed" field names like Petitioner_..., Beneficiary_... (your Excel naming)
//  2) "Original" field names like Pt1Line..., Pt2Line... (older template)
// Also forces appearance regeneration so filled values actually SHOW in PDF viewers.

import path from "node:path";
import { readFile, access } from "node:fs/promises";
import { constants as FS } from "node:fs";
import { PDFDocument, StandardFonts } from "pdf-lib";

// Optional fallback mapping for older templates (safe if file exists in your repo)
let buildPdfDataFallback = null;
try {
  // If you have this helper, we use it when template fields look like Pt1Line...
  // eslint-disable-next-line import/no-unresolved
  ({ buildPdfData: buildPdfDataFallback } = await import("@/lib/i129f-map.js"));
} catch {
  buildPdfDataFallback = null;
}

const CANDIDATE_PDFS = [
  "public/forms/i-129f.pdf",
  "public/i-129f.pdf",
  "public/us/i-129f.pdf",
];

async function resolveTemplatePath() {
  for (const rel of CANDIDATE_PDFS) {
    const p = path.join(process.cwd(), rel);
    try {
      await access(p, FS.R_OK);
      return p;
    } catch {}
  }
  // default guess
  return path.join(process.cwd(), CANDIDATE_PDFS[0]);
}

function deepGet(obj, dotted, fallback = "") {
  try {
    if (!obj || !dotted) return fallback;
    const parts = dotted.split(".");
    let cur = obj;
    for (const p of parts) {
      if (cur == null) return fallback;
      cur = cur[p];
    }
    return cur ?? fallback;
  } catch {
    return fallback;
  }
}

function fmtDate(v) {
  if (!v) return "";
  const s = String(v).trim();
  // If already looks like MM/DD/YYYY, keep it
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
  // Convert YYYY-MM-DD -> MM/DD/YYYY
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[2]}/${m[3]}/${m[1]}`;
  return s;
}

// Safely set a field by name, regardless of type (text, checkbox, radio, dropdown).
function safeSetField(form, name, value) {
  if (!name) return false;

  // Checkbox intent (value === true/false)
  const isBool = typeof value === "boolean";

  try {
    if (isBool) {
      // Try checkbox
      try {
        const cb = form.getCheckBox(name);
        value ? cb.check() : cb.uncheck();
        return true;
      } catch {}
      // Try radio group (rare)
      try {
        const rg = form.getRadioGroup(name);
        if (value) rg.select(rg.getOptions()?.[0] ?? "Yes");
        return true;
      } catch {}
      return false;
    }

    const text = value == null ? "" : String(value);

    // Try text first
    try {
      const tf = form.getTextField(name);
      tf.setText(text);
      return true;
    } catch {}

    // Try dropdown
    try {
      const dd = form.getDropdown(name);
      dd.select(text);
      return true;
    } catch {}

    // Try checkbox with "truthy" strings
    try {
      const cb = form.getCheckBox(name);
      const on = /^(yes|true|1|x|checked)$/i.test(text.trim());
      on ? cb.check() : cb.uncheck();
      return true;
    } catch {}

    // Try radio
    try {
      const rg = form.getRadioGroup(name);
      rg.select(text);
      return true;
    } catch {}

    return false;
  } catch {
    return false;
  }
}

/**
 * Best-effort “smart fill” for your Excel-renamed fields.
 * Instead of requiring an exact mapping table for hundreds of fields,
 * we infer targets by tokens inside the field name (Petitioner, Beneficiary, Address_1, Employer_2, etc).
 * This gets you populated PDFs NOW so you can quickly see what’s working/missing,
 * and then we can hard-map any stubborn fields afterward.
 */
function inferValueForRenamedField(fieldName, data) {
  const n = String(fieldName || "").toLowerCase();

  const petitioner = data?.petitioner ?? data?.i129f?.petitioner ?? {};
  const beneficiary = data?.beneficiary ?? data?.i129f?.beneficiary ?? {};

  const pMail =
    data?.mailing ??
    petitioner?.mailing ??
    petitioner?.mailingAddress ??
    data?.i129f?.mailing ??
    {};

  const pPhys =
    data?.physicalAddresses ??
    petitioner?.physicalAddresses ??
    data?.i129f?.physicalAddresses ??
    [];

  const pEmp =
    data?.employment ??
    petitioner?.employment ??
    data?.i129f?.employment ??
    [];

  const pParents = petitioner?.parents ?? data?.parents ?? [];

  const bMail = beneficiary?.mailing ?? beneficiary?.mailingAddress ?? {};
  const bEmp = beneficiary?.employment ?? [];
  const bParents = beneficiary?.parents ?? [];

  // Helpers
  const unitTypeIs = (val, want) =>
    String(val || "").toLowerCase().startsWith(want);

  // ---------------------------
  // Petitioner core identifiers
  // ---------------------------
  if (n.includes("petitioner") && n.includes("alien") && n.includes("registration"))
    return deepGet(petitioner, "aNumber", deepGet(petitioner, "anumber", ""));

  if (n.includes("petitioner") && n.includes("uscis") && n.includes("online"))
    return deepGet(petitioner, "uscisOnlineAccount", deepGet(petitioner, "onlineAccount", ""));

  if (n.includes("petitioner") && n.includes("social") && n.includes("security"))
    return deepGet(petitioner, "ssn", "");

  // K-1 / K-3 checkboxes (your field names typically include k1/k3)
  if (n.includes("petitioner") && n.includes("request") && n.includes("k1"))
    return true;
  if (n.includes("petitioner") && n.includes("request") && n.includes("k3"))
    return false;

  // ---------------------------
  // Petitioner name
  // ---------------------------
  if (n.includes("petitioner") && n.includes("family") && n.includes("name") && (n.includes("last") || n.includes("family_name_last")))
    return deepGet(petitioner, "lastName", "");

  if (n.includes("petitioner") && n.includes("given") && n.includes("name") && (n.includes("first") || n.includes("given_name_first")))
    return deepGet(petitioner, "firstName", "");

  if (n.includes("petitioner") && n.includes("middle") && n.includes("name") && !n.includes("parent"))
    return deepGet(petitioner, "middleName", "");

  // Other names used (we fill first “other name” only for now)
  const pOther = Array.isArray(petitioner?.otherNames) ? petitioner.otherNames : [];
  if (n.includes("petitioner") && n.includes("other_names") && n.includes("family"))
    return deepGet(pOther[0] || {}, "lastName", "");
  if (n.includes("petitioner") && n.includes("other_names") && n.includes("given"))
    return deepGet(pOther[0] || {}, "firstName", "");
  if (n.includes("petitioner") && n.includes("other_names") && n.includes("middle"))
    return deepGet(pOther[0] || {}, "middleName", "");

  // ---------------------------
  // Petitioner mailing address (“in care of” block)
  // ---------------------------
  const inPetitionerMailBlock =
    n.includes("petitioner") &&
    (n.includes("in_care") || n.includes("in care") || n.includes("mailing"));

  if (inPetitionerMailBlock && n.includes("in_care_of_name"))
    return deepGet(pMail, "inCareOf", deepGet(pMail, "inCareOfName", ""));

  if (inPetitionerMailBlock && n.includes("street"))
    return deepGet(pMail, "street", "");

  if (inPetitionerMailBlock && (n.includes("apt_ste_flr") || n.includes("aptste") || n.includes("suite_floor") || n.includes("number_page")))
    return deepGet(pMail, "unitNumber", deepGet(pMail, "unitNum", ""));

  if (inPetitionerMailBlock && n.includes("apt_checkbox"))
    return unitTypeIs(deepGet(pMail, "unitType", ""), "apt");
  if (inPetitionerMailBlock && (n.includes("ste_checkbox") || n.includes("suite_checkbox")))
    return unitTypeIs(deepGet(pMail, "unitType", ""), "ste");
  if (inPetitionerMailBlock && (n.includes("flr_checkbox") || n.includes("floor_checkbox")))
    return unitTypeIs(deepGet(pMail, "unitType", ""), "flr");

  if (inPetitionerMailBlock && n.includes("city"))
    return deepGet(pMail, "city", "");
  if (inPetitionerMailBlock && n.includes("state"))
    return deepGet(pMail, "state", "");
  if (inPetitionerMailBlock && n.includes("zip"))
    return deepGet(pMail, "zip", "");
  if (inPetitionerMailBlock && n.includes("province"))
    return deepGet(pMail, "province", "");
  if (inPetitionerMailBlock && n.includes("postal"))
    return deepGet(pMail, "postalCode", deepGet(pMail, "postal", ""));
  if (inPetitionerMailBlock && n.includes("country"))
    return deepGet(pMail, "country", "");

  // Mailing same as physical yes/no checkboxes
  if (n.includes("petitioner") && n.includes("mailing") && n.includes("same_as_physical") && n.includes("checkbox_yes"))
    return !!deepGet(petitioner, "sameAsPhysical", deepGet(pMail, "sameAsPhysical", false));
  if (n.includes("petitioner") && n.includes("mailing") && n.includes("same_as_physical") && n.includes("checkbox_no"))
    return !deepGet(petitioner, "sameAsPhysical", deepGet(pMail, "sameAsPhysical", false));

  // ---------------------------
  // Petitioner address history 1 & 2
  // ---------------------------
  const addrIndex =
    n.includes("address_1") ? 0 :
    n.includes("address_2") ? 1 :
    null;

  if (addrIndex != null && n.includes("petitioner") && n.includes("history")) {
    const a = pPhys?.[addrIndex] ?? {};

    if (n.includes("street")) return deepGet(a, "street", "");
    if (n.includes("apt_ste_flr") || n.includes("suite_floor") || n.includes("number")) {
      // unit number text field
      if (!n.includes("checkbox")) return deepGet(a, "unitNumber", deepGet(a, "unitNum", ""));
    }

    if (n.includes("apt_checkbox")) return unitTypeIs(deepGet(a, "unitType", ""), "apt");
    if (n.includes("ste_checkbox") || n.includes("suite_checkbox")) return unitTypeIs(deepGet(a, "unitType", ""), "ste");
    if (n.includes("flr_checkbox") || n.includes("floor_checkbox")) return unitTypeIs(deepGet(a, "unitType", ""), "flr");

    if (n.includes("city")) return deepGet(a, "city", "");
    if (n.includes("state")) return deepGet(a, "state", "");
    if (n.includes("zip")) return deepGet(a, "zip", "");
    if (n.includes("province")) return deepGet(a, "province", "");
    if (n.includes("postal")) return deepGet(a, "postalCode", deepGet(a, "postal", ""));
    if (n.includes("country")) return deepGet(a, "country", "");

    if (n.includes("datefrom") || n.includes("start_date") || n.includes("from"))
      return fmtDate(deepGet(a, "from", deepGet(a, "dateFrom", "")));
    if (n.includes("dateto") || n.includes("end_date") || n.includes("to"))
      return fmtDate(deepGet(a, "to", deepGet(a, "dateTo", "")));
  }

  // ---------------------------
  // Petitioner employment history 1 & 2
  // ---------------------------
  const empIndex =
    (n.includes("employment") || n.includes("employement") || n.includes("employment_history"))
      ? (n.includes("history_1") ? 0 : n.includes("history_2") ? 1 : null)
      : null;

  if (empIndex != null && n.includes("petitioner")) {
    const e = pEmp?.[empIndex] ?? {};

    if (n.includes("nameofemployer") || (n.includes("name") && n.includes("employer")))
      return deepGet(e, "employer", deepGet(e, "name", deepGet(e, "employerName", "")));

    if (n.includes("street")) return deepGet(e, "street", "");
    if ((n.includes("apt_ste_flr") || n.includes("aptste") || n.includes("suite_floor") || n.includes("number")) && !n.includes("checkbox"))
      return deepGet(e, "unitNumber", deepGet(e, "unitNum", ""));

    if (n.includes("apt_checkbox")) return unitTypeIs(deepGet(e, "unitType", ""), "apt");
    if (n.includes("ste_checkbox") || n.includes("suite_checkbox")) return unitTypeIs(deepGet(e, "unitType", ""), "ste");
    if (n.includes("flr_checkbox") || n.includes("floor_checkbox")) return unitTypeIs(deepGet(e, "unitType", ""), "flr");

    if (n.includes("city")) return deepGet(e, "city", "");
    if (n.includes("state")) return deepGet(e, "state", "");
    if (n.includes("zip")) return deepGet(e, "zip", "");
    if (n.includes("province")) return deepGet(e, "province", "");
    if (n.includes("postal")) return deepGet(e, "postalCode", deepGet(e, "postal", ""));
    if (n.includes("country")) return deepGet(e, "country", "");

    if (n.includes("occupation")) return deepGet(e, "occupation", "");

    if (n.includes("start_date") || n.includes("datefrom") || n.includes("from"))
      return fmtDate(deepGet(e, "from", deepGet(e, "startDate", "")));
    if (n.includes("end_date") || n.includes("dateto") || n.includes("to"))
      return fmtDate(deepGet(e, "to", deepGet(e, "endDate", "")));
  }

  // ---------------------------
  // Beneficiary name & basics
  // ---------------------------
  if (n.includes("beneficiary") && n.includes("family") && n.includes("name") && (n.includes("last") || n.includes("family_name_last")))
    return deepGet(beneficiary, "lastName", "");
  if (n.includes("beneficiary") && n.includes("given") && n.includes("name") && (n.includes("first") || n.includes("given_name_first")))
    return deepGet(beneficiary, "firstName", "");
  if (n.includes("beneficiary") && n.includes("middle") && n.includes("name") && !n.includes("parent"))
    return deepGet(beneficiary, "middleName", "");

  if (n.includes("beneficiary") && n.includes("a_number"))
    return deepGet(beneficiary, "aNumber", "");
  if (n.includes("beneficiary") && n.includes("social") && n.includes("security"))
    return deepGet(beneficiary, "ssn", "");
  if (n.includes("beneficiary") && n.includes("date") && n.includes("birth"))
    return fmtDate(deepGet(beneficiary, "dob", ""));

  if (n.includes("beneficiary") && n.includes("city") && n.includes("birth"))
    return deepGet(beneficiary, "birthCity", deepGet(beneficiary, "cityOfBirth", ""));
  if (n.includes("beneficiary") && n.includes("country") && n.includes("birth"))
    return deepGet(beneficiary, "birthCountry", deepGet(beneficiary, "countryOfBirth", ""));
  if (n.includes("beneficiary") && (n.includes("citizenship") || n.includes("nationality")))
    return deepGet(beneficiary, "nationality", "");

  // Beneficiary previously in the U.S. yes/no (your renamed fields often include checkbox_yes/checkbox_no)
  if (n.includes("beneficiary") && n.includes("previously") && n.includes("us") && n.includes("checkbox_yes"))
    return !!deepGet(beneficiary, "inUS", false);
  if (n.includes("beneficiary") && n.includes("previously") && n.includes("us") && n.includes("checkbox_no"))
    return !deepGet(beneficiary, "inUS", false);

  // Beneficiary admission/passport block (class, i94, dates, passport)
  if (n.includes("beneficiary") && n.includes("classofadmission"))
    return deepGet(beneficiary, "classOfAdmission", "");
  if (n.includes("beneficiary") && n.includes("i94"))
    return deepGet(beneficiary, "i94", "");
  if (n.includes("beneficiary") && n.includes("arrival"))
    return fmtDate(deepGet(beneficiary, "arrivalDate", ""));
  if (n.includes("beneficiary") && (n.includes("expires") || n.includes("expiration")) && n.includes("status"))
    return fmtDate(deepGet(beneficiary, "statusExpires", ""));
  if (n.includes("beneficiary") && n.includes("passport") && n.includes("number"))
    return deepGet(beneficiary, "passportNumber", "");
  if (n.includes("beneficiary") && (n.includes("travel") || n.includes("document")) && n.includes("number"))
    return deepGet(beneficiary, "travelDocNumber", "");
  if (n.includes("beneficiary") && n.includes("passport") && n.includes("country"))
    return deepGet(beneficiary, "passportCountry", "");
  if (n.includes("beneficiary") && n.includes("passport") && n.includes("expiration"))
    return fmtDate(deepGet(beneficiary, "passportExpiration", ""));

  // Beneficiary mailing address
  const inBeneficiaryMailBlock =
    n.includes("beneficiary") &&
    (n.includes("mailing") || n.includes("in_care"));

  if (inBeneficiaryMailBlock && n.includes("in_care_of"))
    return deepGet(bMail, "inCareOf", deepGet(bMail, "inCareOfName", ""));
  if (inBeneficiaryMailBlock && n.includes("street"))
    return deepGet(bMail, "street", "");
  if (inBeneficiaryMailBlock && (n.includes("apt_ste_flr") || n.includes("suite_floor") || n.includes("number")) && !n.includes("checkbox"))
    return deepGet(bMail, "unitNumber", deepGet(bMail, "unitNum", ""));
  if (inBeneficiaryMailBlock && n.includes("apt_checkbox"))
    return unitTypeIs(deepGet(bMail, "unitType", ""), "apt");
  if (inBeneficiaryMailBlock && (n.includes("ste_checkbox") || n.includes("suite_checkbox")))
    return unitTypeIs(deepGet(bMail, "unitType", ""), "ste");
  if (inBeneficiaryMailBlock && (n.includes("flr_checkbox") || n.includes("floor_checkbox")))
    return unitTypeIs(deepGet(bMail, "unitType", ""), "flr");
  if (inBeneficiaryMailBlock && n.includes("city"))
    return deepGet(bMail, "city", "");
  if (inBeneficiaryMailBlock && n.includes("state"))
    return deepGet(bMail, "state", "");
  if (inBeneficiaryMailBlock && n.includes("zip"))
    return deepGet(bMail, "zip", "");
  if (inBeneficiaryMailBlock && n.includes("province"))
    return deepGet(bMail, "province", "");
  if (inBeneficiaryMailBlock && n.includes("postal"))
    return deepGet(bMail, "postalCode", deepGet(bMail, "postal", ""));
  if (inBeneficiaryMailBlock && n.includes("country"))
    return deepGet(bMail, "country", "");

  // Beneficiary employment (best-effort using Employer_1 / Employer_2 tokens)
  if (n.includes("beneficiary") && n.includes("employer_")) {
    const idx = n.includes("employer_1") ? 0 : n.includes("employer_2") ? 1 : null;
    if (idx != null) {
      const e = bEmp?.[idx] ?? {};
      if (n.includes("nameofemployer") || (n.includes("name") && n.includes("employer")))
        return deepGet(e, "employer", deepGet(e, "name", deepGet(e, "employerName", "")));
      if (n.includes("street")) return deepGet(e, "street", "");
      if ((n.includes("apt_ste_flr") || n.includes("suite_floor") || n.includes("number")) && !n.includes("checkbox"))
        return deepGet(e, "unitNumber", deepGet(e, "unitNum", ""));
      if (n.includes("apt_checkbox")) return unitTypeIs(deepGet(e, "unitType", ""), "apt");
      if (n.includes("ste_checkbox") || n.includes("suite_checkbox")) return unitTypeIs(deepGet(e, "unitType", ""), "ste");
      if (n.includes("flr_checkbox") || n.includes("floor_checkbox")) return unitTypeIs(deepGet(e, "unitType", ""), "flr");
      if (n.includes("city")) return deepGet(e, "city", "");
      if (n.includes("state")) return deepGet(e, "state", "");
      if (n.includes("zip")) return deepGet(e, "zip", "");
      if (n.includes("province")) return deepGet(e, "province", "");
      if (n.includes("postal")) return deepGet(e, "postalCode", deepGet(e, "postal", ""));
      if (n.includes("country")) return deepGet(e, "country", "");
      if (n.includes("occupation")) return deepGet(e, "occupation", "");
      if (n.includes("start_date") || n.includes("datefrom") || n.includes("from"))
        return fmtDate(deepGet(e, "from", deepGet(e, "startDate", "")));
      if (n.includes("end_date") || n.includes("dateto") || n.includes("to"))
        return fmtDate(deepGet(e, "to", deepGet(e, "endDate", "")));
    }
  }

  // Parents (Petitioner_Parent_1 / _2, Beneficiary_Parent_1 / _2)
  if (n.includes("petitioner_parent_")) {
    const idx = n.includes("parent_1") ? 0 : n.includes("parent_2") ? 1 : null;
    if (idx != null) {
      const pr = pParents?.[idx] ?? {};
      if (n.includes("family")) return deepGet(pr, "lastName", "");
      if (n.includes("given")) return deepGet(pr, "firstName", "");
      if (n.includes("middle")) return deepGet(pr, "middleName", "");
      if (n.includes("dateofbirth") || (n.includes("date") && n.includes("birth"))) return fmtDate(deepGet(pr, "dob", ""));
      if (n.includes("sex") && n.includes("male")) return unitTypeIs(deepGet(pr, "sex", ""), "m") || /male/i.test(deepGet(pr, "sex", ""));
      if (n.includes("sex") && n.includes("female")) return unitTypeIs(deepGet(pr, "sex", ""), "f") || /female/i.test(deepGet(pr, "sex", ""));
      if (n.includes("countryofbirth") || (n.includes("country") && n.includes("birth"))) return deepGet(pr, "countryBirth", deepGet(pr, "birthCountry", ""));
      if (n.includes("residence") && n.includes("city")) return deepGet(pr, "currentCity", deepGet(pr, "currentCityCountry", ""));
      if (n.includes("residence") && n.includes("country")) return deepGet(pr, "currentCountry", deepGet(pr, "currentCityCountry", ""));
    }
  }

  if (n.includes("beneficiary_parent_")) {
    const idx = n.includes("parent_1") ? 0 : n.includes("parent_2") ? 1 : null;
    if (idx != null) {
      const pr = bParents?.[idx] ?? {};
      if (n.includes("family")) return deepGet(pr, "lastName", "");
      if (n.includes("given")) return deepGet(pr, "firstName", "");
      if (n.includes("middle")) return deepGet(pr, "middleName", "");
      if (n.includes("dateofbirth") || (n.includes("date") && n.includes("birth"))) return fmtDate(deepGet(pr, "dob", ""));
      if (n.includes("sex") && n.includes("male")) return unitTypeIs(deepGet(pr, "sex", ""), "m") || /male/i.test(deepGet(pr, "sex", ""));
      if (n.includes("sex") && n.includes("female")) return unitTypeIs(deepGet(pr, "sex", ""), "f") || /female/i.test(deepGet(pr, "sex", ""));
      if (n.includes("countryofbirth") || (n.includes("country") && n.includes("birth"))) return deepGet(pr, "countryBirth", deepGet(pr, "birthCountry", ""));
      if (n.includes("residence") && n.includes("city")) return deepGet(pr, "currentCity", deepGet(pr, "currentCityCountry", ""));
      if (n.includes("residence") && n.includes("country")) return deepGet(pr, "currentCountry", deepGet(pr, "currentCityCountry", ""));
    }
  }

  // Contact info (Petitioners_Contact_Information_...)
  if (n.includes("petitioners_contact_information") && n.includes("daytime_phone"))
    return deepGet(data, "contact.daytimePhone", deepGet(data, "petitioner.daytimePhone", ""));
  if (n.includes("petitioners_contact_information") && n.includes("mobile"))
    return deepGet(data, "contact.mobile", deepGet(data, "petitioner.mobile", ""));
  if (n.includes("petitioners_contact_information") && n.includes("email"))
    return deepGet(data, "contact.email", deepGet(data, "petitioner.email", ""));

  // Interpreter / Preparer (best effort)
  if (n.includes("interpreter_")) {
    const it = data?.interpreter ?? {};
    if (n.includes("family")) return deepGet(it, "lastName", "");
    if (n.includes("given")) return deepGet(it, "firstName", "");
    if (n.includes("business")) return deepGet(it, "business", "");
    if (n.includes("daytime_phone")) return deepGet(it, "phone", "");
    if (n.includes("mobile")) return deepGet(it, "mobile", "");
    if (n.includes("email")) return deepGet(it, "email", "");
    if (n.includes("date") && n.includes("signature")) return fmtDate(deepGet(it, "signDate", ""));
  }

  if (n.includes("prepare_") || n.includes("preparer_")) {
    const pr = data?.preparer ?? {};
    if (n.includes("family")) return deepGet(pr, "lastName", "");
    if (n.includes("given")) return deepGet(pr, "firstName", "");
    if (n.includes("business")) return deepGet(pr, "business", "");
    if (n.includes("daytime_phone")) return deepGet(pr, "phone", "");
    if (n.includes("mobile")) return deepGet(pr, "mobile", "");
    if (n.includes("email")) return deepGet(pr, "email", "");
    if (n.includes("date") && n.includes("signature")) return fmtDate(deepGet(pr, "signDate", ""));
  }

  return null;
}

export async function fillI129FPdf(inputData = {}) {
  const templatePath = await resolveTemplatePath();
  const pdfBytes = await readFile(templatePath);

  const pdfDoc = await PDFDocument.load(pdfBytes, {
    updateMetadata: true,
    ignoreEncryption: true,
  });

  const form = pdfDoc.getForm();

  // Detect which naming style is present in the PDF
  const fieldObjs = form.getFields();
  const fieldNames = fieldObjs.map((f) => f.getName());
  const hasRenamed = fieldNames.some((nm) =>
    /^(Petitioner_|Beneficiary_|Interpreter_|Prepare_|Preparer_)/i.test(nm)
  );

  // Fill
  if (hasRenamed) {
    // Smart fill: infer value by tokens in field name (works with your Excel naming)
    for (const f of fieldObjs) {
      const name = f.getName();
      const v = inferValueForRenamedField(name, inputData);
      if (v === null || v === undefined || v === "") continue;
      safeSetField(form, name, v);
    }
  } else if (typeof buildPdfDataFallback === "function") {
    // Older template: use your existing Pt1Line mapping helper if present
    const mapped = buildPdfDataFallback(inputData) || {};
    for (const [pdfField, v] of Object.entries(mapped)) {
      safeSetField(form, pdfField, v);
    }
  } else {
    // Nothing we can confidently do
    // (You can still use /api/i129f/pdf-inspect to see template field names.)
  }

  // IMPORTANT: regenerate appearances so values SHOW in viewers
  try {
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    form.updateFieldAppearances(font);
  } catch {}

  // Optional: flatten (makes filled text always visible, but removes editability)
  // If you want to keep fields editable, leave this commented out.
  // try { form.flatten(); } catch {}

  const out = await pdfDoc.save();
  return Buffer.from(out);
}

export default fillI129FPdf;
