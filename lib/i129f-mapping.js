// lib/i129f-mapping.js
// Uses your remapped field names from i-129f_Names_Fields.pdf.xlsx
// Safe-string coercion everywhere (no .toLowerCase() on non-strings)

const S = (v) => (v == null ? '' : String(v));
const L = (v) => S(v).toLowerCase();
const is = (v, x) => L(v) === L(x);
const dt = (v) => {
  if (!v) return '';
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      const [y,m,d] = v.split('-'); return `${m}/${d}/${y}`;
    }
    if (/^\d{1,2}\/\d{1,2}\/(\d{2}|\d{4})$/.test(v)) return v;
    const d = new Date(v);
    if (isNaN(d)) return S(v);
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    return `${mm}/${dd}/${d.getFullYear()}`;
  } catch { return S(v); }
};

const get = (obj, path, dflt='') => {
  try {
    const parts = (Array.isArray(path) ? path : String(path).split('.'));
    let cur = obj;
    for (const p of parts) {
      if (cur == null) return dflt;
      if (/\]$/.test(p)) {
        const m = p.match(/^([^[\]]+)\[(\d+)\]$/);
        if (!m) return dflt;
        cur = cur[m[1]][Number(m[2])];
      } else {
        cur = cur[p];
      }
    }
    return cur ?? dflt;
  } catch { return dflt; }
};

/* ---- pdf-lib helpers ---- */
function t(form, name, value) {
  try { form.getTextField(name).setText(S(value)); return true; } catch { return false; }
}
function c(form, name, on=true) {
  try { const cb = form.getCheckBox(name); on ? cb.check() : cb.uncheck(); return true; } catch { return false; }
}
function T(form, names, value) {
  let ok=false; for (const n of names) ok = t(form, n, value) || ok; return ok;
}
function C(form, names, on) {
  let ok=false; for (const n of names) ok = c(form, n, on) || ok; return ok;
}

function addr(src={}) {
  return {
    inCareOf: src.inCareOf ?? '',
    street: src.street ?? '',
    unitNum: src.unitNum ?? '',
    unitType: src.unitType ?? '', // 'Apt' | 'Ste' | 'Flr'
    city: src.city ?? '',
    state: src.state ?? '',
    zip: src.zip ?? '',
    province: src.province ?? '',
    postal: src.postal ?? '',
    country: src.country ?? '',
    from: src.from ?? '',
    to: src.to ?? '',
  };
}

export function applyI129fMapping(saved, form) {
  if (!saved) return;
  const pet = saved.petitioner || {};
  const ben = saved.beneficiary || {};

  /* =========================
     Part 1 — Petitioner
     ========================= */

  // (1–3) IDs
  t(form, 'Petitioner_Alien_Registration_page_1_Num_1', pet.aNumber);
  t(form, 'Petitioner_USCIS_Online_Acct_Num_page_1_Num_2', pet.uscisOnlineAccount);
  t(form, 'Petitioner_Social_Security_Num_page_1_Num_3', pet.ssn);

  // (4) Classification
  const cls = (saved?.classification?.type ?? '').toString().toLowerCase();
  c(form, 'Petitioner_Request_Beneficiary_K1_page_1_Num_4a', cls === 'k1');
  c(form, 'Petitioner_Request_Beneficiary_K3_page_1_Num_4b', cls === 'k3');

  // (5) I-130 for K3
  const i130 = (saved?.classification?.i130Filed ?? '').toString().toLowerCase();
  const I130_YES = 'Petitioner_Filing_K3_Filed_I130__Yes';
  const I130_NO  = 'Petitioner_Filing_K3_Filed_I130__No';
  if (cls === 'k3') {
    c(form, I130_YES, i130 === 'yes');
    c(form, I130_NO,  i130 === 'no');
  } else {
    c(form, I130_YES, false);
    c(form, I130_NO,  false);
  }

  // (6–7) Names
  t(form, 'Petitioner_Family_Name_Last_Name_page1_6a', pet.lastName);
  t(form, 'Petitioner_Given_Name_First_Name_page1_6b', pet.firstName);
  t(form, 'Petitioner_MiddleName_page1_6.c', pet.middleName);

  t(form, 'Petitioner_Other_Names_Used_Family_Name_page_1_Num_7a', get(pet,'otherNames[0].lastName'));
  t(form, 'Petitioner_Other_Names_Used_Given_Name_page_1_Num_7.b.', get(pet,'otherNames[0].firstName'));
  t(form, 'Petitioner_Other_Names_Used_Middle_Name_page_1_Num_7.c.', get(pet,'otherNames[0].middleName'));

  // (8) Mailing
  const mail = addr(saved.mailing || pet.mailing || {});
  t(form, 'Petitioner_In_Care_of_Name_page1_8.a', mail.inCareOf);
  t(form, 'Petitioner_Street_Number_and_Name_Page1_8.b.', mail.street);
  // 8.c — Unit: checkboxes + number
  c(form, 'Petitioner_in_care_of_Apt_Checkbox_Page1_8.c.', is(mail.unitType, 'Apt'));
  c(form, 'Petitioner_in_care_of_Ste_Checkbox_Page1_8.c.', is(mail.unitType, 'Ste'));
  c(form, 'Petitioner_in_care_of_Flr_Checkbox_Page1_8.c.', is(mail.unitType, 'Flr'));
  t(form, 'Petitioner_in_care_of_APt_Ste_Flr_number_Page1_8.c.', mail.unitNum);

  t(form, 'Petitioner_in_Care_of_City_or_Town_page1_8.d', mail.city);
  t(form, 'Petitioner_in_Care_of_State_page1_8.e', mail.state);
  t(form, 'Petitioner_in_Care_of_ZipCode_page1_8.f', mail.zip);
  t(form, 'Petitioner_in_Care_of_Province_page1_8.g', mail.province);
  t(form, 'Petitioner_in_Care_of_Postal_Code_page1_8.h', mail.postal);
  t(form, 'Petitioner_in_Care_of_Country_page1_8.i', mail.country);

  // 8.j — same as physical? (your wizard flag lives at mailing.sameAsPhysical)
  const sameAs = !!mail.sameAsPhysical || !!saved?.mailing?.sameAsPhysical;
  c(form, 'Petitioner_is_mailing_address_same_as_physical_address_check_Yes_page1_8.j', sameAs);
  c(form, 'Petitioner_Mailing_Adress_Same_as_physical_checkbox_No_page1_8.j', !sameAs);

  // (9–12 & 10/12 dates) Physical addresses
  const phys0 = sameAs ? { ...mail } : addr(get(saved, 'physicalAddresses[0]', {}));
  t(form, 'Petitioner_Address_1_History_Street_Numb_and_name_page2_9.a', phys0.street);
  t(form, 'Petitioner_Address_1_History_Apt_Suite_Floor_Number_Page2_9.b', phys0.unitNum);
  t(form, 'Petitioner_Address_1_History_City_or_town_page2_9.c', phys0.city);
  t(form, 'Petitioner_Address_1_History_State_page2_9.d', phys0.state);
  t(form, 'Petitioner_Address_1_History_ZipCode_page2_9.e', phys0.zip);
  t(form, 'Petitioner_Address_1_History_Province_page2_9.f', phys0.province);
  t(form, 'Petitioner_Address_1_History_PostalCode_page2_9.g', phys0.postal);
  t(form, 'Petitioner_Address_1_History_Country_page2_9.h', phys0.country);
  t(form, 'Petitioner_Address_1_History_DateFrom_page2_10.a.', dt(phys0.from));
  t(form, 'Petitioner_Address_1_History_DateTo_page2_10.b', dt(phys0.to));

  const phys1 = addr(get(saved,'physicalAddresses[1]', {}));
  t(form, 'Petitioner_Address_2_History_Street_Numb_and_name_page2_11.a', phys1.street);
  t(form, 'Petitioner_Address_2_History_Apt_Suite_Floor_Number_Page2_11.b', phys1.unitNum);
  t(form, 'Petitioner_Address_2_History_City_or_town_page2_11.c', phys1.city);
  t(form, 'Petitioner_Address_2_History_State_page2_11.d', phys1.state);
  t(form, 'Petitioner_Address_2_History_ZipCode_page2_11.e', phys1.zip);
  t(form, 'Petitioner_Address_2_History_Province_page2_11.f', phys1.province);
  t(form, 'Petitioner_Address_2_History_PostalCode_page2_11.g', phys1.postal);
  t(form, 'Petitioner_Address_2_History_Country_page2_11.h', phys1.country);
  t(form, 'Petitioner_Address_2_History_DateFrom_page2_12.a', dt(phys1.from));
  t(form, 'Petitioner_Address_2_History_DateTo_page2_12.b', dt(phys1.to));

  // (13–20) Employment 1 & 2
  const pe0 = get(saved,'employment[0]',{}) || {};
  t(form, 'Petitioner_employment_History_1_NameOfEmployer_page2_13', pe0.employer);
  t(form, 'Petitioner_Employement_1_History_StreetNumber_or_name_page2_14.a.', pe0.street);
  t(form, 'Petitioner_Employment_History_1_Apt_Suite_Floor_Number_Page2_14.b', pe0.unitNum);
  t(form, 'Petitioner_Employement_1_History_City_or_town_page2_14.c', pe0.city);
  t(form, 'Petitioner_Employement_1_History_State_page2_14.d.', pe0.state);
  t(form, 'Petitioner_Employement_1_History_ZipCode_page2_14.e.', pe0.zip);
  t(form, 'Petitioner_Employement_1_History_Province_page2_14.f.', pe0.province);
  t(form, 'Petitioner_Employement_1_History_PostalCode_page2_14.g.', pe0.postal);
  t(form, 'Petitioner_Employement_1_History_Country_page2_14.h.', pe0.country);
  t(form, 'Petitioner_Employement_1_History_Occupation_page2_15', pe0.occupation);
  t(form, 'Petitioner_Employement_1_History_Start_Date_page2_16.a.', dt(pe0.from));
  t(form, 'Petitioner_Employement_1_History_End_Date_page2_16.b.', dt(pe0.to));

  const pe1 = get(saved,'employment[1]',{}) || {};
  t(form, 'Petitioner_employment_History_2_NameOfEmployer_page2_18', pe1.employer);
  t(form, 'Petitioner_Employement_2_History_StreetNumber_or_name_page2_18.a', pe1.street);
  t(form, 'Petitioner_Employment_History_2_Apt_Suite_Floor_Number_Page2_18.b', pe1.unitNum);
  t(form, 'Petitioner_Employement_2_History_City_or_town_page2_18.c', pe1.city);
  t(form, 'Petitioner_Employement_2_History_State_page2_18.d', pe1.state);
  t(form, 'Petitioner_Employement_2_History_ZipCode_page2_18.e', pe1.zip);
  t(form, 'Petitioner_Employement_2_History_Province_page2_18.f', pe1.province);
  t(form, 'Petitioner_Employement_2_History_PostalCode_page2_18.g', pe1.postal);
  t(form, 'Petitioner_Employement_2_History_Country_page2_18.h', pe1.country);
  t(form, 'Petitioner_Employement_2_History_Occupation_page2_19', pe1.occupation);
  t(form, 'Petitioner_Employement_2_History_Employment_Start_Date_page3_20.a.', dt(pe1.from));
  t(form, 'Petitioner_Employement_2_History_Employment_End_Date_page3_20.b', dt(pe1.to));

  // (21–26) Other info
  const sex = L(pet.sex);
  c(form, 'Petitioner_Other_Information_Sex_page3_21', sex === 'male');   // male
  c(form, 'Petitioner_Other_Information_Sex_Checkbox_Female_page3_21', sex === 'female');
  t(form, 'Petitioner_Other_Information_Date_of_birth_page3_22', dt(pet.dob));

  const ms = L(pet.maritalStatus);
  c(form, 'Petitioner_Other_Information_Marital_Status_page3_23', ms === 'single');
  c(form, 'Petitioner_Other_Information_Marital_Status_Married_Checkbox_page3_23', ms === 'married');
  c(form, 'Petitioner_Other_Information_Marital_Status_Divorced_Checkbox_page3_23', ms === 'divorced');
  c(form, 'Petitioner_Other_Information_Marital_Status_Widowed_CheckBox_page3_23', ms === 'widowed');

  t(form, 'Petitioner_Other_Information_City_Town_Village_Birth_page3_24', pet.cityBirth);
  t(form, 'Petitioner_Other_Information_Province_State_Birth_page3_25', pet.provinceBirth);
  t(form, 'Petitioner_Other_Information_Country_of_Birth_page3_26', pet.countryBirth);

  // Parents
  const p1 = get(pet,'parents[0]',{}) || {};
  t(form, 'Petitioner_Parent_1_Family Name_page3_27.a', p1.lastName);
  t(form, 'Petitioner_Parent_1_GivenName_page3_27.b', p1.firstName);
  t(form, 'Petitioner_Parent_1_MiddleName_page3_27.c', p1.middleName);
  t(form, 'Petitioner_Parent_1_DateOfBirth_page3_28', dt(p1.dob));
  c(form, 'Petitioner_Parent_1_Sex_Check_Male_Female_page3_29', L(p1.sex)==='male');
  c(form, 'Petitioner_Parent_1_Sex_Check_Female_page3_29', L(p1.sex)==='female');
  t(form, 'Petitioner_Parent_1_CountryOfBirth_page3_30', p1.countryBirth);

  const p2 = get(pet,'parents[1]',{}) || {};
  t(form, 'Petitioner_Parent_2_Family Name_page3_32.a.', p2.lastName);
  t(form, 'Petitioner_Parent_2_GivenName_page3_32.b.', p2.firstName);
  t(form, 'Petitioner_Parent_2_MiddleName_page3_32.c.', p2.middleName);
  t(form, 'Petitioner_Parent_2_DateOfBirth_page3_33', dt(p2.dob));
  c(form, 'Petitioner_Parent_2_Sex_Check_Male_Female_page3_34', L(p2.sex)==='male');
  c(form, 'Petitioner_Parent_2_Sex_Check_Female_page3_34', L(p2.sex)==='female');
  t(form, 'Petitioner_Parent_2_CountryOfBirth_page3_35', p2.countryBirth);

  // Naturalization (42 a–c in your sheet)
  t(form, 'Petitioner_Certificate_Number_page4_42.a.', pet.natzNumber);
  t(form, 'Petitioner_Place_Of_Issuance_Number_page4_42.b.', pet.natzPlace);
  t(form, 'Petitioner_Date_Of_Issuance_Number_page4_42.c.', dt(pet.natzDate));

  /* =========================
     Part 2 — Beneficiary
     ========================= */
  t(form, 'Beneficiary_Family_Name_Last_Name_page4_1.a.', ben.lastName);
  t(form, 'Beneficiary_Given_Name_First_Name_page4_1.b', ben.firstName);
  t(form, 'Beneficiary_Middle_Name_page4_1.c.', ben.middleName);

  t(form, 'Beneficiary_A_Number_if_any_page4_2', ben.aNumber);
  t(form, 'Beneficiary_Social_Security_if_any_page4_3', ben.ssn);
  t(form, 'Beneficiary_Date_Of_Birth_page4_4', dt(ben.dob));

  const bsex = L(ben.sex);
  c(form, 'Beneficiary_Sex_page4_5', bsex === 'male');
  c(form, 'Beneficiary_Sex_Checkbox_Female_page4_5', bsex === 'female');

  t(form, 'Beneficiary_City_Town_Village_Birth_page4_7', ben.cityBirth);
  t(form, 'Beneficiary_Country_Birth_page4_8', ben.countryBirth);
  t(form, 'Beneficiary_Citizenship_Country_page4_9', ben.nationality || ben.citizenship);

  t(form, 'Beneficiary_Other_Names_Used_Family_Name_page4_10.a', get(ben,'otherNames[0].lastName'));
  t(form, 'Beneficiary_Other_Names_Used_Given_Name_page4_10.b', get(ben,'otherNames[0].firstName'));
  t(form, 'Beneficiary_Other_Names_Used_Middle_Name_page4_10.c', get(ben,'otherNames[0].middleName'));

  // Beneficiary mailing
  const bmail = addr(ben.mailing || {});
  t(form, 'Beneficiary_Mailing_Address_In_Care_of_Name_page5_11.a', bmail.inCareOf);
  t(form, 'Beneficiary_Mailing_Address_In_Care_of_StreetNumber_Name_page5_11.b.', bmail.street);
  // unit: there are multiple variants in your sheet; set the number
  T(form, [
    'Beneficiary_Mailing_Address_In_Care_of_Apt_Ste_Flr_Num_page5_11.c',
    'Beneficiary_Mailing_Address_In_Care_of__Apt_Ste_Flr_Number_of_Type_page5_11.c.'
  ], bmail.unitNum);
  t(form, 'Beneficiary_Mailing_Address_In_Care_of_City_Or_town_page5_11.d.', bmail.city);
  t(form, 'Beneficiary_Mailing_Address_In_Care_of_State_page5_11.e.', bmail.state);
  t(form, 'Beneficiary_Mailing_Address_In_Care_of_Zipcode_page5_11.f', bmail.zip);
  t(form, 'Beneficiary_Mailing_Address_In_Care_of_Province_page5_11.g.', bmail.province);
  t(form, 'Beneficiary_Mailing_Address_In_Care_of_PostalCode_page5_11.h.', bmail.postal);
  t(form, 'Beneficiary_Mailing_Address_In_Care_of_Country_page5_11.i.', bmail.country);

  // Beneficiary physical (14–15)
  const bphys = addr(ben.physicalAddress || {});
  t(form, 'Beneficiary_Mailing_Adress_2_Street_page5_12.a', bphys.street);
  t(form, 'Beneficiary_Mailing_Adress_2_Apt_Ste_Flr_Num_page5_12.b', bphys.unitNum);
  t(form, 'Beneficiary_Mailing_Adress_2_City_or_town_page5_12.c', bphys.city);
  t(form, 'Beneficiary_Mailing_Adress_2_State_page5_12.d', bphys.state);
  t(form, 'Beneficiary_Mailing_Adress_2_ZipCode_page5_12.e', bphys.zip);
  t(form, 'Beneficiary_Mailing_Adress_2_Province_page5_12.f', bphys.province);
  t(form, 'Beneficiary_Mailing_Adress_2_PostalCode_page5_12.g', bphys.postal);
  t(form, 'Beneficiary_Mailing_Adress_2_Country_page5_12.h', bphys.country);
  t(form, 'Beneficiary_Mailing_Adress_2_DateFrom_page5_13.a.', dt(bphys.from));
  t(form, 'Beneficiary_Mailing_Adress_2_DateTo_page5_13.b.', dt(bphys.to));

  // Beneficiary employment 1
  const be0 = get(ben,'employment[0]',{}) || {};
  t(form, 'Beneficiary_Employer_1_Address_NameOfEmployer_page5_16', be0.employer);
  t(form, 'Beneficiary_Employer_1_Addres_StreetNumber_Name_page5_17.a', be0.street);
  t(form, 'Beneficiary_Employer_1_Addres_Apt_Ste_Flr_Num_Field_page5_17.b', be0.unitNum);
  t(form, 'Beneficiary_Employer_1_Addres_City_Town_page5_17.c.', be0.city);
  t(form, 'Beneficiary_Employer_1_Addres_State_page5_17.d.', be0.state);
  t(form, 'Beneficiary_Employer_1_Addres_ZipCode_page5_17.e.', be0.zip);
  t(form, 'Beneficiary_Employer_1_Addres_Province_page5_17.f.', be0.province);
  t(form, 'Beneficiary_Employer_1_Addres_PostalCode_page5_17.g.', be0.postal);
  t(form, 'Beneficiary_Employer_1_Addres_country_page5_17.h.', be0.country);
  t(form, 'Beneficiary_Employer_1_Addres_Occupation_page5_18', be0.occupation);
  t(form, 'Beneficiary_Employer_1_Addres_StartDate_page5_19.a.', dt(be0.from));
  t(form, 'Beneficiary_Employer_1_Addres_EndDate_page5_19.b', dt(be0.to));

  // Beneficiary employment 2
  const be1 = get(ben,'employment[1]',{}) || {};
  t(form, 'Beneficiary_Employer_2_Address_NameOfEmployer_page6_20', be1.employer);
  t(form, 'Beneficiary_Employer_2_Addres_StreetNumber_Name_page6_21.a', be1.street);
  t(form, 'Beneficiary_Employer_2_Addres_Apt_Ste_Flr_Num_Field_page6_21.b', be1.unitNum);
  t(form, 'Beneficiary_Employer_2_Addres_City_Town_page6_21.c', be1.city);
  t(form, 'Beneficiary_Employer_2_State_page6_21.d', be1.state);
  t(form, 'Beneficiary_Employer_2_ZipCode_page6_21.e', be1.zip);
  t(form, 'Beneficiary_Employer_2_Province_page6_21.f', be1.province);
  t(form, 'Beneficiary_Employer_2_PostalCode_page6_21.g', be1.postal);
  t(form, 'Beneficiary_Employer_2_Country_page6_21.h', be1.country);
  t(form, 'Beneficiary_Employer_2_Occupation_page6_22', be1.occupation);
  t(form, 'Beneficiary_Employer_2_StartDate_page6_23.a.', dt(be1.from));
  t(form, 'Beneficiary_Employer_2_EndDate_page6_23.b', dt(be1.to));

  // Beneficiary parents (you can add more as your UI grows)
  const bp1 = get(ben,'parents[0]',{}) || {};
  t(form, 'Beneficiary_Parent_1_Family_Name_page6_24.a.', bp1.lastName);
  t(form, 'Beneficiary_Parent_1_Given_Name_page6_24.b.', bp1.firstName);
  t(form, 'Beneficiary_Parent_1_Middle_Name_page6_24.c', bp1.middleName);
  t(form, 'Beneficiary_Parent_1_Date_of_Birth_page6_25', dt(bp1.dob));
  t(form, 'Beneficiary_Parent_1_City_Town_Village_of_Birth_page6_26', bp1.cityBirth);
  t(form, 'Beneficiary_Parent_1_Country_of_Birth_page6_27', bp1.countryBirth);

  /* =========================
     Parts 5–7 — Contact / Interpreter / Preparer
     ========================= */
  // Petitioner contact (Part 5)
  t(form, 'Petitioners_Contact_Information_daytime_Phone_Number_page10_1', get(saved,'petitioner.phone'));
  t(form, 'Petitioners_Contact_Information_Mobile_Phone_Number_page10_2', get(saved,'petitioner.mobile'));
  t(form, 'Petitioners_Contact_Information_Email_Address_page10_3', get(saved,'petitioner.email'));
  t(form, 'Petitioners_Date_Of_Signature_page10_4', dt(get(saved,'preparer.signDate') || get(saved,'petitioner.signDate')));

  // Interpreter (Part 6)
  const itp = saved.interpreter || {};
  t(form, 'Interpreter_Contact_Information_Family_Name_page10_1', itp.lastName);
  t(form, 'Interpreter_Contact_Information_Given_Name_page10_1', itp.firstName);
  t(form, 'Interpreter_Contact_Information_Business_Organization_Name_page10_2', itp.business);
  t(form, 'Interpreter_Contact_Information_Daytime_Phone_page10_3', itp.phone1);
  t(form, 'Interpreter_Contact_Information_Mobile_Phone_page10_4', itp.phone2);
  t(form, 'Interpreter_Contact_Information_Email_Address_page10_5', itp.email);
  t(form, 'Interpreter_Certification_Signature_Language_Field_page10', itp.language);
  t(form, 'Interpreter_Certification_Date_Of_Signature_page10_6', dt(itp.signDate));

  // Preparer (Part 7)
  const prep = saved.preparer || {};
  t(form, 'Prepare_Full_Name_Family_Name_page10_1', prep.lastName);
  t(form, 'Prepare_Full_Name_First_Name_page10_1', prep.firstName);
  t(form, 'Prepare_Full_Name_Business_Organization_page10_2', prep.business);
  t(form, 'Prepare_Contact_Information_Daytime_Phone_Number_page10_3', prep.phone);
  t(form, 'Prepare_Contact_Information_Mobile_Phone_Number_page10_4', prep.mobile);
  t(form, 'Prepare_Contact_Information_Email_Address_page10_5', prep.email);
  t(form, 'Prepare_Date_Of_Signature_page11_6', dt(prep.signDate));

  /* =========================
     Part 8 — Additional Info
     ========================= */
  const p8 = saved.part8 || {};
  t(form, 'Continued_Information_1_Explanation_Area_Page12_3.d', p8.line3d || '');
  t(form, 'Continued_Information_2_Explanation_Area_Page12_4.d', p8.line4d || '');
  t(form, 'Continued_Information_3_Explanation_Area_Page12_5.d', p8.line5d || '');
  t(form, 'Continued_Information_4_Explanation_Area_Page12_6.d', p8.line6d || '');

  /* =========================
     Arbitrary overrides (advanced)
     ========================= */
  const other = saved.other || {};
  for (const [name, val] of Object.entries(other)) {
    if (!t(form, name, val)) {
      if (val === true || val === false) c(form, name, !!val);
    }
  }
}
