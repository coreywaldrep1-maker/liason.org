// lib/i129f-mapping.js
// Fills your *renamed* AcroForm fields (from the Excel sheet) from your saved wizard shape.
// Key export: applyI129fMapping(saved, form)

function normName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function asStr(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function asYes(v) {
  if (v === true) return true;
  if (v === false) return false;
  const s = String(v || "").trim().toLowerCase();
  return ["yes", "y", "true", "1", "on", "checked"].includes(s);
}

function asUSDate(v) {
  if (!v) return "";
  if (v instanceof Date && !isNaN(v.getTime())) {
    const mm = String(v.getMonth() + 1).padStart(2, "0");
    const dd = String(v.getDate()).padStart(2, "0");
    const yyyy = String(v.getFullYear());
    return `${mm}/${dd}/${yyyy}`;
  }
  const s = String(v).trim();

  // already MM/DD/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(s)) {
    const [m, d, yRaw] = s.split("/");
    const mm = String(m).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    let yyyy = String(yRaw);
    if (yyyy.length === 2) yyyy = Number(yyyy) >= 70 ? `19${yyyy}` : `20${yyyy}`;
    return `${mm}/${dd}/${yyyy}`;
  }

  // ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [yyyy, mm, dd] = s.split("-");
    return `${mm}/${dd}/${yyyy}`;
  }

  // try Date parse
  const d = new Date(s);
  if (!isNaN(d.getTime())) return asUSDate(d);

  return s;
}

function pick(arr, idx) {
  return Array.isArray(arr) ? arr[idx] || {} : {};
}

function unitTypeMatches(unitType, want) {
  const u = String(unitType || "").trim().toLowerCase();
  const w = String(want || "").trim().toLowerCase();
  if (!u || !w) return false;
  // accept Apt/Apartment, Ste/Suite, Flr/Floor
  if (w.startsWith("apt")) return u.startsWith("apt");
  if (w.startsWith("ste") || w.startsWith("sui")) return u.startsWith("ste") || u.startsWith("sui");
  if (w.startsWith("flr") || w.startsWith("flo")) return u.startsWith("flr") || u.startsWith("flo");
  return u === w;
}

function setPdfField(field, value) {
  if (value === null || value === undefined) return false;

  const ctor = field?.constructor?.name || "";
  const has = (m) => typeof field?.[m] === "function";

  try {
    // Checkboxes
    if (ctor.includes("CheckBox") || has("check") || has("uncheck")) {
      const vBool =
        typeof value === "boolean"
          ? value
          : (() => {
              const s = String(value).trim().toLowerCase();
              if (["no", "false", "0", ""].includes(s)) return false;
              if (["yes", "true", "1", "on", "checked"].includes(s)) return true;
              return Boolean(s);
            })();

      if (vBool) field.check();
      else field.uncheck();
      return true;
    }

    // Radio groups / dropdowns
    if (ctor.includes("RadioGroup") || ctor.includes("Dropdown") || has("select")) {
      let v = value;
      if (typeof v === "boolean") v = v ? "Yes" : "No";
      v = String(v ?? "").trim();
      if (!v) return false;

      try {
        field.select(v);
        return true;
      } catch {
        // Some PDFs use "On" for yes-like selections
        try {
          field.select("On");
          return true;
        } catch {
          return false;
        }
      }
    }

    // Text fields
    if (ctor.includes("Text") || has("setText")) {
      const t = String(value ?? "");
      field.setText(t);
      return true;
    }

    // Fallback
    if (has("setText")) {
      field.setText(String(value ?? ""));
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

// Core inference: map your saved wizard shape to your renamed field names
function inferValueForField(fieldName, saved) {
  const n = normName(fieldName);

  const P = saved?.petitioner || {};
  const M = saved?.mailing || {};
  const ADDRS = Array.isArray(saved?.physicalAddresses) ? saved.physicalAddresses : [];
  const EMP = Array.isArray(saved?.employment) ? saved.employment : [];
  const C = saved?.classification || {};

  const B = saved?.beneficiary || {};
  const BM = B?.mailing || {};
  const BP = B?.physicalAddress || {};
  const BEMP = Array.isArray(B?.employment) ? B.employment : [];
  const BPAR = Array.isArray(B?.parents) ? B.parents : [];

  const PPAR = Array.isArray(P?.parents) ? P.parents : [];

  const I = saved?.interpreter || {};
  const R = saved?.preparer || {}; // "R" for preparer (avoid collision)

  // -----------------------------
  // Petitioner: numbers & class
  // -----------------------------
  if (n.includes("petitioner_alien_registration") && n.includes("num_1")) return asStr(P.aNumber || "");
  if (n.includes("petitioner_uscis_online") && n.includes("num_2")) return asStr(P.uscisOnlineAccount || "");
  if (n.includes("petitioner_social_security") && n.includes("num_3")) return asStr(P.ssn || "");

  // Classification checkboxes (K1/K3) — from Excel 4.a / 4.b
  if (n.includes("petitioner_request_beneficiary_k1")) return C.type === "k1";
  if (n.includes("petitioner_request_beneficiary_k3")) return C.type === "k3";

  // I-130 filed yes/no (only relevant for K-3) — Excel #5
  if (n.includes("filed_i130") && n.includes("yes")) return C.type === "k3" && asYes(C.i130Filed);
  if (n.includes("filed_i130") && n.includes("no")) return C.type === "k3" && !asYes(C.i130Filed);
  if (n.includes("filed_i130")) return C.type === "k3" ? (asYes(C.i130Filed) ? "Yes" : "No") : "";

  // -----------------------------
  // Petitioner: name
  // -----------------------------
  if (n.includes("petitioner_family_name_last_name") && n.includes("6a")) return asStr(P.lastName || "");
  if (n.includes("petitioner_given_name_first_name") && n.includes("6b")) return asStr(P.firstName || "");
  if (n.includes("petitioner_middle") && n.includes("6_c")) return asStr(P.middleName || "");

  // Other names used (first row only)
  if (n.includes("petitioner_other_names_used") && n.includes("family") && n.includes("7a"))
    return asStr(pick(P.otherNames, 0).lastName || "");
  if (n.includes("petitioner_other_names_used") && n.includes("given") && (n.includes("7_b") || n.includes("7b")))
    return asStr(pick(P.otherNames, 0).firstName || "");
  if (n.includes("petitioner_other_names_used") && n.includes("middle") && (n.includes("7_c") || n.includes("7c")))
    return asStr(pick(P.otherNames, 0).middleName || "");

  // -----------------------------
  // Petitioner: mailing address (Part 1 #8)
  // -----------------------------
  if (n.includes("petitioner_in_care_of_name") && n.includes("8_a")) return asStr(M.inCareOf || "");
  if (n.includes("petitioner_street_number") && n.includes("8_b")) return asStr(M.street || "");

  // unit type checkboxes + unit number
  if (n.includes("in_care_of_apt_checkbox") && n.includes("8_c")) return unitTypeMatches(M.unitType, "Apt");
  if (n.includes("in_care_of_ste_checkbox") && n.includes("8_c")) return unitTypeMatches(M.unitType, "Ste");
  if (n.includes("in_care_of_flr_checkbox") && n.includes("8_c")) return unitTypeMatches(M.unitType, "Flr");
  if (n.includes("apt_ste_flr") && n.includes("number") && n.includes("8_c")) return asStr(M.unitNum || "");

  if (n.includes("petitioner_in_care_of_city") && n.includes("8_d")) return asStr(M.city || "");
  if (n.includes("petitioner_in_care_of_state") && n.includes("8_e")) return asStr(M.state || "");
  if (n.includes("petitioner_in_care_of_zip") && n.includes("8_f")) return asStr(M.zip || "");
  if (n.includes("petitioner_in_care_of_province") && n.includes("8_g")) return asStr(M.province || "");
  if (n.includes("petitioner_in_care_of_postal") && n.includes("8_h")) return asStr(M.postal || "");
  if (n.includes("petitioner_in_care_of_country") && n.includes("8_i")) return asStr(M.country || "");

  // Mailing same as physical yes/no
  if (n.includes("same_as_physical") && n.includes("yes")) return !!M.sameAsPhysical;
  if (n.includes("same_as_physical") && n.includes("no")) return !M.sameAsPhysical;
  if (n.includes("same_as_physical")) return M.sameAsPhysical ? "Yes" : "No";

  // -----------------------------
  // Petitioner: address history arrays (physicalAddresses[0..])
  // Excel uses Address_1_History..., Address_2_History...
  // -----------------------------
  const addrMatch = n.match(/petitioner_address_(\d+)_history_/);
  if (addrMatch) {
    const idx = Math.max(0, Number(addrMatch[1]) - 1);
    const A = pick(ADDRS, idx);

    if (n.includes("_street") || n.includes("_street_numb") || n.includes("_street_number")) return asStr(A.street || "");

    // unit type checkboxes + number
    if (n.includes("apt_checkbox")) return unitTypeMatches(A.unitType, "Apt");
    if (n.includes("ste_checkbox")) return unitTypeMatches(A.unitType, "Ste");
    if (n.includes("flr_checkbox")) return unitTypeMatches(A.unitType, "Flr");
    if (n.includes("apt_suite_floor_number") || (n.includes("apt_ste_flr") && n.includes("num")))
      return asStr(A.unitNum || "");

    if (n.includes("_city")) return asStr(A.city || "");
    if (n.includes("_state")) return asStr(A.state || "");
    if (n.includes("_zipcode") || n.includes("_zip_code") || n.endsWith("_zip")) return asStr(A.zip || "");
    if (n.includes("_province")) return asStr(A.province || "");
    if (n.includes("_postal")) return asStr(A.postal || "");
    if (n.includes("_country")) return asStr(A.country || "");
    if (n.includes("datefrom") || n.includes("from_page")) return asUSDate(A.from || "");
    if (n.includes("dateto") || n.includes("to_page")) return asUSDate(A.to || "");

    return null;
  }

  // -----------------------------
  // Petitioner: employment history arrays (employment[0..])
  // Excel uses employment_History_1..., etc
  // -----------------------------
  const empMatch = n.match(/petitioner_employment_history_(\d+)_/);
  if (empMatch) {
    const idx = Math.max(0, Number(empMatch[1]) - 1);
    const E = pick(EMP, idx);

    if (n.includes("nameofemployer") || n.includes("name_of_employer")) return asStr(E.employer || "");
    if (n.includes("street")) return asStr(E.street || "");

    if (n.includes("apt_checkbox")) return unitTypeMatches(E.unitType, "Apt");
    if (n.includes("ste_checkbox")) return unitTypeMatches(E.unitType, "Ste");
    if (n.includes("flr_checkbox")) return unitTypeMatches(E.unitType, "Flr");
    if (n.includes("apt_ste_flr") && (n.includes("num") || n.includes("number"))) return asStr(E.unitNum || "");

    if (n.includes("city")) return asStr(E.city || "");
    if (n.includes("state")) return asStr(E.state || "");
    if (n.includes("zip")) return asStr(E.zip || "");
    if (n.includes("province")) return asStr(E.province || "");
    if (n.includes("postal")) return asStr(E.postal || "");
    if (n.includes("country")) return asStr(E.country || "");
    if (n.includes("occupation")) return asStr(E.occupation || "");
    if (n.includes("datefrom") || n.includes("startdate") || n.includes("from")) return asUSDate(E.from || "");
    if (n.includes("dateto") || n.includes("enddate") || n.includes("to")) return asUSDate(E.to || "");

    return null;
  }

  // -----------------------------
  // Petitioner: DOB / sex / phones / email
  // (names vary; handle common tokens)
  // -----------------------------
  if (n.includes("petitioner_date_of_birth") || (n.includes("petitioner") && n.includes("dob")))
    return asUSDate(P.dob || "");

  if (n.includes("petitioner_city") && n.includes("birth")) return asStr(P.cityBirth || "");
  if (n.includes("petitioner_province") && n.includes("birth")) return asStr(P.provinceBirth || "");
  if (n.includes("petitioner_country") && n.includes("birth")) return asStr(P.countryBirth || "");

  if (n.includes("petitioner_sex_checkbox_male")) return String(P.sex || "").toLowerCase() === "male";
  if (n.includes("petitioner_sex_checkbox_female")) return String(P.sex || "").toLowerCase() === "female";
  if (n.includes("petitioner_sex") && !n.includes("checkbox")) return asStr(P.sex || "");

  if (n.includes("petitioner_daytime_phone") || (n.includes("petitioner") && n.includes("phone") && !n.includes("mobile")))
    return asStr(P.phone || "");
  if (n.includes("petitioner_mobile")) return asStr(P.mobile || "");
  if (n.includes("petitioner_email")) return asStr(P.email || "");

  // -----------------------------
  // Petitioner: parents (Parent_1 / Parent_2)
  // -----------------------------
  const pparMatch = n.match(/petitioner_parent_(\d+)_/);
  if (pparMatch) {
    const idx = Math.max(0, Number(pparMatch[1]) - 1);
    const X = pick(PPAR, idx);

    if (n.includes("family")) return asStr(X.lastName || "");
    if (n.includes("given")) return asStr(X.firstName || "");
    if (n.includes("middle")) return asStr(X.middleName || "");
    if (n.includes("dateofbirth") || n.includes("dob")) return asUSDate(X.dob || "");

    if (n.includes("sex") && n.includes("male")) return String(X.sex || "").toLowerCase() === "male";
    if (n.includes("sex") && n.includes("female")) return String(X.sex || "").toLowerCase() === "female";
    if (n.includes("sex") && !n.includes("male") && !n.includes("female")) return asStr(X.sex || "");

    if (n.includes("countryofbirth")) return asStr(X.countryBirth || "");
    if (n.includes("citytownvillage") && n.includes("residence")) return asStr(X.currentCityCountry || "");
    if (n.includes("country_residence")) return asStr(X.currentCityCountry || "");

    return null;
  }

  // Naturalization certificate fields (you capture natzNumber/place/date)
  if (n.includes("petitioner_certificate_number")) return asStr(P.natzNumber || "");
  if (n.includes("petitioner_place_of_issuance") || n.includes("place_of_issuance")) return asStr(P.natzPlace || "");
  if (n.includes("petitioner_date_of_issuance") || n.includes("date_of_issuance")) return asUSDate(P.natzDate || "");

  // -----------------------------
  // Beneficiary: identity
  // -----------------------------
  if (n.includes("beneficiary_family_name") && n.includes("1_a")) return asStr(B.lastName || "");
  if (n.includes("beneficiary_given_name") && n.includes("1_b")) return asStr(B.firstName || "");
  if (n.includes("beneficiary_middle_name") && n.includes("1_c")) return asStr(B.middleName || "");

  if (n.includes("beneficiary_a_number")) return asStr(B.aNumber || "");
  if (n.includes("beneficiary_social_security")) return asStr(B.ssn || "");
  if (n.includes("beneficiary_date_of_birth") || (n.includes("beneficiary") && n.includes("dob")))
    return asUSDate(B.dob || "");

  if (n.includes("beneficiary_sex_checkbox_male")) return String(B.sex || "").toLowerCase() === "male";
  if (n.includes("beneficiary_sex_checkbox_female")) return String(B.sex || "").toLowerCase() === "female";
  if (n.includes("beneficiary_sex") && !n.includes("checkbox")) return asStr(B.sex || "");

  if (n.includes("beneficiary_city") && n.includes("birth")) return asStr(B.cityBirth || "");
  if (n.includes("beneficiary_country") && n.includes("birth")) return asStr(B.countryBirth || "");
  if (n.includes("beneficiary_citizenship_country") || n.includes("beneficiary_nationality"))
    return asStr(B.nationality || "");

  // Beneficiary other names used (first row only)
  if (n.includes("beneficiary_other_names_used") && n.includes("family")) return asStr(pick(B.otherNames, 0).lastName || "");
  if (n.includes("beneficiary_other_names_used") && n.includes("given")) return asStr(pick(B.otherNames, 0).firstName || "");
  if (n.includes("beneficiary_other_names_used") && n.includes("middle")) return asStr(pick(B.otherNames, 0).middleName || "");

  // -----------------------------
  // Beneficiary: mailing address (Part 2 mailing)
  // -----------------------------
  if (n.includes("beneficiary_mailing_address_in_care_of_name")) return asStr(BM.inCareOf || "");
  if (n.includes("beneficiary_mailing_address_in_care_of_street")) return asStr(BM.street || "");
  if (n.includes("beneficiary_mailing_address_in_care_of_apt") && n.includes("checkbox")) return unitTypeMatches(BM.unitType, "Apt");
  if (n.includes("beneficiary_mailing_address_in_care_of_ste") && n.includes("checkbox")) return unitTypeMatches(BM.unitType, "Ste");
  if (n.includes("beneficiary_mailing_address_in_care_of_flr") && n.includes("checkbox")) return unitTypeMatches(BM.unitType, "Flr");
  if (n.includes("beneficiary_mailing_address_in_care_of_apt_ste_flr") && (n.includes("num") || n.includes("number")))
    return asStr(BM.unitNum || "");
  if (n.includes("beneficiary_mailing_address_in_care_of_city")) return asStr(BM.city || "");
  if (n.includes("beneficiary_mailing_address_in_care_of_state")) return asStr(BM.state || "");
  if (n.includes("beneficiary_mailing_address_in_care_of_zip")) return asStr(BM.zip || "");
  if (n.includes("beneficiary_mailing_address_in_care_of_province")) return asStr(BM.province || "");
  if (n.includes("beneficiary_mailing_address_in_care_of_postal")) return asStr(BM.postal || "");
  if (n.includes("beneficiary_mailing_address_in_care_of_country")) return asStr(BM.country || "");

  // -----------------------------
  // Beneficiary: intended U.S. address (your wizard has beneficiary.physicalAddress)
  // -----------------------------
  if (n.includes("beneficiary_address_in_united_states_where_address_intends_to_live_street"))
    return asStr(BP.street || "");
  if (n.includes("beneficiary_address_in_united_states_where_address_intends_to_live_apt__checkbox"))
    return unitTypeMatches(BP.unitType, "Apt");
  if (n.includes("beneficiary_address_in_united_states_where_address_intends_to_live_ste_checkbox"))
    return unitTypeMatches(BP.unitType, "Ste");
  if (n.includes("beneficiary_address_in_united_states_where_address_intends_to_live_flr_checkbox"))
    return unitTypeMatches(BP.unitType, "Flr");
  if (n.includes("beneficiary_address_in_united_states_where_address_intends_to_live_apt_ste_flr_num"))
    return asStr(BP.unitNum || "");
  if (n.includes("beneficiary_address_in_united_states_where_address_intends_to_live_city"))
    return asStr(BP.city || "");
  if (n.includes("beneficiary_address_in_united_states_where_address_intends_to_live_state"))
    return asStr(BP.state || "");
  if (n.includes("beneficiary_address_in_united_states_where_address_intends_to_live_zip"))
    return asStr(BP.zip || "");

  // -----------------------------
  // Beneficiary: employment (Employer_1 / Employer_2)
  // -----------------------------
  const bEmpMatch = n.match(/beneficiary_employer_(\d+)_/);
  if (bEmpMatch) {
    const idx = Math.max(0, Number(bEmpMatch[1]) - 1);
    const E = pick(BEMP, idx);

    if (n.includes("nameofemployer") || n.includes("nameofemployer") || n.includes("address_nameofemployer"))
      return asStr(E.employer || "");

    if (n.includes("street")) return asStr(E.street || "");

    if (n.includes("apt_checkbox")) return unitTypeMatches(E.unitType, "Apt");
    if (n.includes("ste_checkbox")) return unitTypeMatches(E.unitType, "Ste");
    if (n.includes("flr_checkbox")) return unitTypeMatches(E.unitType, "Flr");
    if (n.includes("apt_ste_flr") && (n.includes("num") || n.includes("field") || n.includes("number")))
      return asStr(E.unitNum || "");

    if (n.includes("city")) return asStr(E.city || "");
    if (n.includes("state")) return asStr(E.state || "");
    if (n.includes("zip")) return asStr(E.zip || "");
    if (n.includes("province")) return asStr(E.province || "");
    if (n.includes("postal")) return asStr(E.postal || "");
    if (n.includes("country")) return asStr(E.country || "");
    if (n.includes("occupation")) return asStr(E.occupation || "");
    if (n.includes("startdate") || n.includes("datefrom") || n.includes("from")) return asUSDate(E.from || "");
    if (n.includes("enddate") || n.includes("dateto") || n.includes("to")) return asUSDate(E.to || "");

    return null;
  }

  // -----------------------------
  // Beneficiary: parents (Parent_1 / Parent_2)
  // -----------------------------
  const bParMatch = n.match(/beneficiary_parent_(\d+)_/);
  if (bParMatch) {
    const idx = Math.max(0, Number(bParMatch[1]) - 1);
    const X = pick(BPAR, idx);

    if (n.includes("lastname") || n.includes("last_name")) return asStr(X.lastName || "");
    if (n.includes("firstname") || n.includes("first_name")) return asStr(X.firstName || "");
    if (n.includes("middlename") || n.includes("middle_name")) return asStr(X.middleName || "");
    if (n.includes("dateofbirth") || n.includes("date_of_birth") || n.includes("dob")) return asUSDate(X.dob || "");

    if (n.includes("sex") && n.includes("male")) return String(X.sex || "").toLowerCase() === "male";
    if (n.includes("sex") && n.includes("female")) return String(X.sex || "").toLowerCase() === "female";
    if (n.includes("sex") && !n.includes("male") && !n.includes("female")) return asStr(X.sex || "");

    if (n.includes("country_of_birth") || n.includes("country_of_bi")) return asStr(X.countryBirth || "");
    if (n.includes("city_ton_vill") || n.includes("city_town_vill")) return asStr(X.currentCityCountry || "");
    if (n.includes("country_of__r") || n.includes("country_resid")) return asStr(X.currentCityCountry || "");

    return null;
  }

  // -----------------------------
  // Beneficiary: in U.S. status + passport/travel docs (your wizard has these fields)
  // Field names vary a lot; match by tokens
  // -----------------------------
  if (n.includes("beneficiary_in_us")) return asStr(B.inUS || "");
  if (n.includes("i_94") || n.includes("i94")) return asStr(B.i94 || "");
  if (n.includes("class_of_admission")) return asStr(B.classOfAdmission || "");
  if (n.includes("status_expires")) return asUSDate(B.statusExpires || "");
  if (n.includes("arrival_date")) return asUSDate(B.arrivalDate || "");

  if (n.includes("passport_number")) return asStr(B.passportNumber || "");
  if (n.includes("passport_country")) return asStr(B.passportCountry || "");
  if (n.includes("passport_expiration")) return asUSDate(B.passportExpiration || "");
  if (n.includes("travel_doc_number")) return asStr(B.travelDocNumber || "");

  // -----------------------------
  // Interpreter (Parts 6/7 vary)
  // -----------------------------
  if (n.startsWith("interpreter_")) {
    if (n.includes("language")) return asStr(I.language || "");
    if (n.includes("email")) return asStr(I.email || "");
    if (n.includes("sign") && n.includes("date")) return asUSDate(I.signDate || "");
    if (n.includes("family") || n.includes("last")) return asStr(I.lastName || "");
    if (n.includes("given") || n.includes("first")) return asStr(I.firstName || "");
    if (n.includes("business")) return asStr(I.business || "");
    if (n.includes("phone1") || (n.includes("phone") && n.includes("1"))) return asStr(I.phone1 || "");
    if (n.includes("phone2") || (n.includes("phone") && n.includes("2"))) return asStr(I.phone2 || "");
  }

  // -----------------------------
  // Preparer (your sheet uses "Prepare_*" in places; support both)
  // -----------------------------
  if (n.startsWith("prepare_") || n.startsWith("preparer_")) {
    if (n.includes("sign") && n.includes("date")) return asUSDate(R.signDate || "");
    if (n.includes("email")) return asStr(R.email || "");
    if (n.includes("business")) return asStr(R.business || "");
    if (n.includes("mobile")) return asStr(R.mobile || "");
    if (n.includes("phone")) return asStr(R.phone || "");
    if (n.includes("family") || n.includes("last")) return asStr(R.lastName || "");
    if (n.includes("given") || n.includes("first")) return asStr(R.firstName || "");
  }

  // -----------------------------
  // Part 8 additional info (your wizard has part8.line3d etc)
  // -----------------------------
  if (n.includes("part_8") || n.includes("part8") || n.includes("additional")) {
    if (n.includes("line3d")) return asStr(saved?.part8?.line3d || "");
    if (n.includes("line4d")) return asStr(saved?.part8?.line4d || "");
    if (n.includes("line5d")) return asStr(saved?.part8?.line5d || "");
    if (n.includes("line6d")) return asStr(saved?.part8?.line6d || "");
  }

  return null;
}

// Exported debug shortlist (update to your renamed field names)
export const I129F_DEBUG_FIELD_LIST = [
  "Petitioner_Alien_Registration_page_1_Num_1",
  "Petitioner_USCIS_Online_Acct_Num_page_1_Num_2",
  "Petitioner_Social_Security_Num_page_1_Num_3",
  "Petitioner_Family_Name_Last_Name_page1_6a",
  "Petitioner_Given_Name_First_Name_page1_6b",
  "Beneficiary_Family_Name_Last_Name_page4_1.a.",
  "Beneficiary_Given_Name_First_Name_page4_1.b",
  "Beneficiary_Date_Of_Birth_page4_4",
];

// Main export used by /api/i129f/pdf-inspect and your pdf route
export function applyI129fMapping(saved = {}, form) {
  if (!form || typeof form.getFields !== "function") {
    // if someone calls without a form, do nothing safely
    return { ok: false, error: "No pdf-lib form provided" };
  }

  const fields = form.getFields();
  let filledCount = 0;

  for (const field of fields) {
    const name = field.getName?.() || "";
    if (!name) continue;

    const val = inferValueForField(name, saved);
    if (val === null || val === undefined) continue;

    // Don’t spam the PDF with "undefined"/"null"
    if (typeof val === "string" && val.trim() === "") continue;

    const did = setPdfField(field, val);
    if (did) filledCount++;
  }

  return { ok: true, filledCount, totalFields: fields.length };
}
