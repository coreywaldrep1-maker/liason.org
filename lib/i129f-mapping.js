// lib/i129f-mapping.js
// Safer, wider mapping for I-129F (Parts 1–8) with common-sense toggles.
// - No .toLowerCase() on non-strings
// - Attempts multiple field name aliases for robustness
// - Spills extras into Part 8 when needed

/* =========================
   Small utils
========================= */
const S = (v) => (v == null ? '' : String(v));
const L = (v) => S(v).toLowerCase();
const EQ = (a, b) => L(a) === L(b);
const HAS = (o, ks) => !!(o && ks.some(k => !!S(o[k]).trim()));
const BOOL = (v) => v === true || v === 'true' || v === 'yes' || v === 'on' || v === 1 || v === '1';

function dt(v) {
  if (!v) return '';
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      const [y,m,d] = String(v).split('-');
      return `${m}/${d}/${y}`;
    }
    if (/^\d{1,2}\/\d{1,2}\/(\d{2}|\d{4})$/.test(v)) return v;
    const d0 = new Date(v);
    if (isNaN(d0)) return S(v);
    const mm = String(d0.getMonth()+1).padStart(2,'0');
    const dd = String(d0.getDate()).padStart(2,'0');
    return `${mm}/${dd}/${d0.getFullYear()}`;
  } catch { return S(v); }
}

function get(obj, path, dflt='') {
  try {
    const parts = Array.isArray(path) ? path : String(path).split('.');
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
}

/* =========================
   pdf-lib helpers
========================= */
function setText(form, name, value) {
  try { form.getTextField(name).setText(S(value)); return true; } catch { return false; }
}
function setCheck(form, name, on = true) {
  try { const cb = form.getCheckBox(name); on ? cb.check() : cb.uncheck(); return true; } catch { return false; }
}
function T(form, names, value) {
  let ok = false; for (const n of names) ok = setText(form, n, value) || ok; return ok;
}
function C(form, names, on) {
  let ok = false; for (const n of names) ok = setCheck(form, n, on) || ok; return ok;
}
function YN(form, yesNames, noNames, val) {
  const on = BOOL(val);
  C(form, yesNames, on);
  C(form, noNames, !on);
  return on;
}

function addr(src = {}) {
  return {
    inCareOf: src.inCareOf ?? '',
    street: src.street ?? '',
    unitType: src.unitType ?? '',
    unitNum: src.unitNum ?? '',
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

/* =========================
   🔧 ALIASES TODO
   Add/replace IDs here with the exact names from your Excel for perfect coverage.
========================= */
const ALIAS = {
  // Part 1 — IDs & classification (working for your current file)
  petANum: ['Petitioner_Alien_Registration_page_1_Num_1'],
  petAcct: ['Petitioner_USCIS_Online_Acct_Num_page_1_Num_2'],
  petSSN:  ['Petitioner_Social_Security_Num_page_1_Num_3'],
  k1:      ['Petitioner_Request_Beneficiary_K1_page_1_Num_4a'],
  k3:      ['Petitioner_Request_Beneficiary_K3_page_1_Num_4b'],
  k3_I130_Yes: ['Petitioner_Filing_K3_Filed_I130__Yes'],
  k3_I130_No:  ['Petitioner_Filing_K3_Filed_I130__No'],

  // Part 1 — Names
  petNameLast:  ['Petitioner_Family_Name_Last_Name_page1_6a'],
  petNameFirst: ['Petitioner_Given_Name_First_Name_page1_6b'],
  petNameMid:   ['Petitioner_MiddleName_page1_6.c'],
  petOther0L:   ['Petitioner_Other_Names_Used_Family_Name_page_1_Num_7a'],
  petOther0F:   ['Petitioner_Other_Names_Used_Given_Name_page_1_Num_7.b.'],
  petOther0M:   ['Petitioner_Other_Names_Used_Middle_Name_page_1_Num_7.c.'],

  // Part 1 — Mailing
  petMailInCare: ['Petitioner_In_Care_of_Name_page1_8.a'],
  petMailStreet: ['Petitioner_Street_Number_and_Name_Page1_8.b.'],
  petMailUnitApt: ['Petitioner_in_care_of_Apt_Checkbox_Page1_8.c.'],
  petMailUnitSte: ['Petitioner_in_care_of_Ste_Checkbox_Page1_8.c.'],
  petMailUnitFlr: ['Petitioner_in_care_of_Flr_Checkbox_Page1_8.c.'],
  petMailUnitNum: ['Petitioner_in_care_of_APt_Ste_Flr_number_Page1_8.c.'],
  petMailCity:   ['Petitioner_in_Care_of_City_or_Town_page1_8.d'],
  petMailState:  ['Petitioner_in_Care_of_State_page1_8.e'],
  petMailZip:    ['Petitioner_in_Care_of_ZipCode_page1_8.f'],
  petMailProv:   ['Petitioner_in_Care_of_Province_page1_8.g'],
  petMailPost:   ['Petitioner_in_Care_of_Postal_Code_page1_8.h'],
  petMailCountry:['Petitioner_in_Care_of_Country_page1_8.i'],
  petMailSameYes:['Petitioner_is_mailing_address_same_as_physical_address_check_Yes_page1_8.j'],
  petMailSameNo: ['Petitioner_Mailing_Adress_Same_as_physical_checkbox_No_page1_8.j'],

  // Part 1 — Physical #1
  petPhys1Street: ['Petitioner_Address_1_History_Street_Numb_and_name_page2_9.a'],
  petPhys1Unit:   ['Petitioner_Address_1_History_Apt_Suite_Floor_Number_Page2_9.b'],
  petPhys1City:   ['Petitioner_Address_1_History_City_or_town_page2_9.c'],
  petPhys1State:  ['Petitioner_Address_1_History_State_page2_9.d'],
  petPhys1Zip:    ['Petitioner_Address_1_History_ZipCode_page2_9.e'],
  petPhys1Prov:   ['Petitioner_Address_1_History_Province_page2_9.f'],
  petPhys1Post:   ['Petitioner_Address_1_History_PostalCode_page2_9.g'],
  petPhys1Cntry:  ['Petitioner_Address_1_History_Country_page2_9.h'],
  petPhys1From:   ['Petitioner_Address_1_History_DateFrom_page2_10.a.'],
  petPhys1To:     ['Petitioner_Address_1_History_DateTo_page2_10.b'],

  // Part 1 — Physical #2
  petPhys2Street: ['Petitioner_Address_2_History_Street_Numb_and_name_page2_11.a'],
  petPhys2Unit:   ['Petitioner_Address_2_History_Apt_Suite_Floor_Number_Page2_11.b'],
  petPhys2City:   ['Petitioner_Address_2_History_City_or_town_page2_11.c'],
  petPhys2State:  ['Petitioner_Address_2_History_State_page2_11.d'],
  petPhys2Zip:    ['Petitioner_Address_2_History_ZipCode_page2_11.e'],
  petPhys2Prov:   ['Petitioner_Address_2_History_Province_page2_11.f'],
  petPhys2Post:   ['Petitioner_Address_2_History_PostalCode_page2_11.g'],
  petPhys2Cntry:  ['Petitioner_Address_2_History_Country_page2_11.h'],
  petPhys2From:   ['Petitioner_Address_2_History_DateFrom_page2_12.a'],
  petPhys2To:     ['Petitioner_Address_2_History_DateTo_page2_12.b'],

  // Part 1 — Employment
  petEmp1Name:   ['Petitioner_employment_History_1_NameOfEmployer_page2_13'],
  petEmp1Street: ['Petitioner_Employement_1_History_StreetNumber_or_name_page2_14.a.'],
  petEmp1Unit:   ['Petitioner_Employment_History_1_Apt_Suite_Floor_Number_Page2_14.b'],
  petEmp1City:   ['Petitioner_Employement_1_History_City_or_town_page2_14.c'],
  petEmp1State:  ['Petitioner_Employement_1_History_State_page2_14.d.'],
  petEmp1Zip:    ['Petitioner_Employement_1_History_ZipCode_page2_14.e.'],
  petEmp1Prov:   ['Petitioner_Employement_1_History_Province_page2_14.f.'],
  petEmp1Post:   ['Petitioner_Employement_1_History_PostalCode_page2_14.g.'],
  petEmp1Cntry:  ['Petitioner_Employement_1_History_Country_page2_14.h.'],
  petEmp1Occ:    ['Petitioner_Employement_1_History_Occupation_page2_15'],
  petEmp1From:   ['Petitioner_Employement_1_History_Start_Date_page2_16.a.'],
  petEmp1To:     ['Petitioner_Employement_1_History_End_Date_page2_16.b.'],

  petEmp2Name:   ['Petitioner_employment_History_2_NameOfEmployer_page2_18'],
  petEmp2Street: ['Petitioner_Employement_2_History_StreetNumber_or_name_page2_18.a'],
  petEmp2Unit:   ['Petitioner_Employment_History_2_Apt_Suite_Floor_Number_Page2_18.b'],
  petEmp2City:   ['Petitioner_Employement_2_History_City_or_town_page2_18.c'],
  petEmp2State:  ['Petitioner_Employement_2_History_State_page2_18.d'],
  petEmp2Zip:    ['Petitioner_Employement_2_History_ZipCode_page2_18.e'],
  petEmp2Prov:   ['Petitioner_Employement_2_History_Province_page2_18.f'],
  petEmp2Post:   ['Petitioner_Employement_2_History_PostalCode_page2_18.g'],
  petEmp2Cntry:  ['Petitioner_Employement_2_History_Country_page2_18.h'],
  petEmp2Occ:    ['Petitioner_Employement_2_History_Occupation_page2_19'],
  petEmp2From:   ['Petitioner_Employement_2_History_Employment_Start_Date_page3_20.a.'],
  petEmp2To:     ['Petitioner_Employement_2_History_Employment_End_Date_page3_20.b'],

  // Part 1 — Other info
  petSexMale:   ['Petitioner_Other_Information_Sex_page3_21'],
  petSexFemale: ['Petitioner_Other_Information_Sex_Checkbox_Female_page3_21'],
  petDOB:       ['Petitioner_Other_Information_Date_of_birth_page3_22'],
  petMS_Single:   ['Petitioner_Other_Information_Marital_Status_page3_23'],
  petMS_Married:  ['Petitioner_Other_Information_Marital_Status_Married_Checkbox_page3_23'],
  petMS_Divorced: ['Petitioner_Other_Information_Marital_Status_Divorced_Checkbox_page3_23'],
  petMS_Widowed:  ['Petitioner_Other_Information_Marital_Status_Widowed_CheckBox_page3_23'],
  petBirthCity: ['Petitioner_Other_Information_City_Town_Village_Birth_page3_24'],
  petBirthProv: ['Petitioner_Other_Information_Province_State_Birth_page3_25'],
  petBirthCntr: ['Petitioner_Other_Information_Country_of_Birth_page3_26'],

  // Parents
  petPar1Last: ['Petitioner_Parent_1_Family Name_page3_27.a'],
  petPar1First:['Petitioner_Parent_1_GivenName_page3_27.b'],
  petPar1Mid:  ['Petitioner_Parent_1_MiddleName_page3_27.c'],
  petPar1DOB:  ['Petitioner_Parent_1_DateOfBirth_page3_28'],
  petPar1Male: ['Petitioner_Parent_1_Sex_Check_Male_Female_page3_29'],
  petPar1Fem:  ['Petitioner_Parent_1_Sex_Check_Female_page3_29'],
  petPar1Cntr: ['Petitioner_Parent_1_CountryOfBirth_page3_30'],

  petPar2Last: ['Petitioner_Parent_2_Family Name_page3_32.a.'],
  petPar2First:['Petitioner_Parent_2_GivenName_page3_32.b.'],
  petPar2Mid:  ['Petitioner_Parent_2_MiddleName_page3_32.c.'],
  petPar2DOB:  ['Petitioner_Parent_2_DateOfBirth_page3_33'],
  petPar2Male: ['Petitioner_Parent_2_Sex_Check_Male_Female_page3_34'],
  petPar2Fem:  ['Petitioner_Parent_2_Sex_Check_Female_page3_34'],
  petPar2Cntr: ['Petitioner_Parent_2_CountryOfBirth_page3_35'],

  // Naturalization
  petNatzNum:   ['Petitioner_Certificate_Number_page4_42.a.'],
  petNatzPlace: ['Petitioner_Place_Of_Issuance_Number_page4_42.b.'],
  petNatzDate:  ['Petitioner_Date_Of_Issuance_Number_page4_42.c.'],

  // Part 2 — Beneficiary basics
  benLast:  ['Beneficiary_Family_Name_Last_Name_page4_1.a.'],
  benFirst: ['Beneficiary_Given_Name_First_Name_page4_1.b'],
  benMid:   ['Beneficiary_Middle_Name_page4_1.c.'],
  benANum:  ['Beneficiary_A_Number_if_any_page4_2'],
  benSSN:   ['Beneficiary_Social_Security_if_any_page4_3'],
  benDOB:   ['Beneficiary_Date_Of_Birth_page4_4'],
  benMale:  ['Beneficiary_Sex_page4_5'],
  benFem:   ['Beneficiary_Sex_Checkbox_Female_page4_5'],
  benBirthCity: ['Beneficiary_City_Town_Village_Birth_page4_7'],
  benBirthCntr: ['Beneficiary_Country_Birth_page4_8'],
  benNation:    ['Beneficiary_Citizenship_Country_page4_9'],
  benOther0L:   ['Beneficiary_Other_Names_Used_Family_Name_page4_10.a'],
  benOther0F:   ['Beneficiary_Other_Names_Used_Given_Name_page4_10.b'],
  benOther0M:   ['Beneficiary_Other_Names_Used_Middle_Name_page4_10.c'],

  // Part 2 — Mailing & physical
  benMailInCare: ['Beneficiary_Mailing_Address_In_Care_of_Name_page5_11.a'],
  benMailStreet: ['Beneficiary_Mailing_Address_In_Care_of_StreetNumber_Name_page5_11.b.'],
  benMailUnitNum: [
    'Beneficiary_Mailing_Address_In_Care_of_Apt_Ste_Flr_Num_page5_11.c',
    'Beneficiary_Mailing_Address_In_Care_of__Apt_Ste_Flr_Number_of_Type_page5_11.c.'
  ],
  benMailCity:   ['Beneficiary_Mailing_Address_In_Care_of_City_Or_town_page5_11.d.'],
  benMailState:  ['Beneficiary_Mailing_Address_In_Care_of_State_page5_11.e.'],
  benMailZip:    ['Beneficiary_Mailing_Address_In_Care_of_Zipcode_page5_11.f'],
  benMailProv:   ['Beneficiary_Mailing_Address_In_Care_of_Province_page5_11.g.'],
  benMailPost:   ['Beneficiary_Mailing_Address_In_Care_of_PostalCode_page5_11.h.'],
  benMailCntry:  ['Beneficiary_Mailing_Address_In_Care_of_Country_page5_11.i.'],

  benPhysStreet: ['Beneficiary_Mailing_Adress_2_Street_page5_12.a'],
  benPhysUnit:   ['Beneficiary_Mailing_Adress_2_Apt_Ste_Flr_Num_page5_12.b'],
  benPhysCity:   ['Beneficiary_Mailing_Adress_2_City_or_town_page5_12.c'],
  benPhysState:  ['Beneficiary_Mailing_Adress_2_State_page5_12.d'],
  benPhysZip:    ['Beneficiary_Mailing_Adress_2_ZipCode_page5_12.e'],
  benPhysProv:   ['Beneficiary_Mailing_Adress_2_Province_page5_12.f'],
  benPhysPost:   ['Beneficiary_Mailing_Adress_2_PostalCode_page5_12.g'],
  benPhysCntry:  ['Beneficiary_Mailing_Adress_2_Country_page5_12.h'],
  benPhysFrom:   ['Beneficiary_Mailing_Adress_2_DateFrom_page5_13.a.'],
  benPhysTo:     ['Beneficiary_Mailing_Adress_2_DateTo_page5_13.b.'],

  // Part 2 — In U.S. (❗add your final field names if different)
  benInUS_Yes: ['Beneficiary_In_US_Yes', 'Beneficiary_is_in_the_United_States_Yes_page4_6'],
  benInUS_No:  ['Beneficiary_In_US_No',  'Beneficiary_is_in_the_United_States_No_page4_6'],
  benClassAdm: ['Beneficiary_Class_of_Admission_page4_6.a', 'Beneficiary_Class_of_Admission'],
  benI94:      ['Beneficiary_I94_Number_page4_6.b', 'Beneficiary_I_94_Number'],
  benStatusExp:['Beneficiary_Status_Expiration_Date_page4_6.c', 'Beneficiary_Status_Expires'],
  benArrival:  ['Beneficiary_Date_of_Arrival_page4_6.d', 'Beneficiary_Date_of_Arrival'],

  benPassportNo:    ['Beneficiary_Passport_Number'],
  benTravelDocNo:   ['Beneficiary_Travel_Document_Number'],
  benPassportCntry: ['Beneficiary_Passport_Country_of_Issuance'],
  benPassportExp:   ['Beneficiary_Passport_Expiration'],

  // Part 2 — Employment
  benEmp1Name:   ['Beneficiary_Employer_1_Address_NameOfEmployer_page5_16'],
  benEmp1Street: ['Beneficiary_Employer_1_Addres_StreetNumber_Name_page5_17.a'],
  benEmp1Unit:   ['Beneficiary_Employer_1_Addres_Apt_Ste_Flr_Num_Field_page5_17.b'],
  benEmp1City:   ['Beneficiary_Employer_1_Addres_City_Town_page5_17.c.'],
  benEmp1State:  ['Beneficiary_Employer_1_Addres_State_page5_17.d.'],
  benEmp1Zip:    ['Beneficiary_Employer_1_Addres_ZipCode_page5_17.e.'],
  benEmp1Prov:   ['Beneficiary_Employer_1_Addres_Province_page5_17.f.'],
  benEmp1Post:   ['Beneficiary_Employer_1_Addres_PostalCode_page5_17.g.'],
  benEmp1Cntry:  ['Beneficiary_Employer_1_Addres_country_page5_17.h.'],
  benEmp1Occ:    ['Beneficiary_Employer_1_Addres_Occupation_page5_18'],
  benEmp1From:   ['Beneficiary_Employer_1_Addres_StartDate_page5_19.a.'],
  benEmp1To:     ['Beneficiary_Employer_1_Addres_EndDate_page5_19.b'],

  benEmp2Name:   ['Beneficiary_Employer_2_Address_NameOfEmployer_page6_20'],
  benEmp2Street: ['Beneficiary_Employer_2_Addres_StreetNumber_Name_page6_21.a'],
  benEmp2Unit:   ['Beneficiary_Employer_2_Addres_Apt_Ste_Flr_Num_Field_page6_21.b'],
  benEmp2City:   ['Beneficiary_Employer_2_Addres_City_Town_page6_21.c'],
  benEmp2State:  ['Beneficiary_Employer_2_State_page6_21.d'],
  benEmp2Zip:    ['Beneficiary_Employer_2_ZipCode_page6_21.e'],
  benEmp2Prov:   ['Beneficiary_Employer_2_Province_page6_21.f'],
  benEmp2Post:   ['Beneficiary_Employer_2_PostalCode_page6_21.g'],
  benEmp2Cntry:  ['Beneficiary_Employer_2_Country_page6_21.h'],
  benEmp2Occ:    ['Beneficiary_Employer_2_Occupation_page6_22'],
  benEmp2From:   ['Beneficiary_Employer_2_StartDate_page6_23.a.'],
  benEmp2To:     ['Beneficiary_Employer_2_EndDate_page6_23.b'],

  // Parents (beneficiary)
  benPar1Last: ['Beneficiary_Parent_1_Family_Name_page6_24.a.'],
  benPar1First:['Beneficiary_Parent_1_Given_Name_page6_24.b.'],
  benPar1Mid:  ['Beneficiary_Parent_1_Middle_Name_page6_24.c'],
  benPar1DOB:  ['Beneficiary_Parent_1_Date_of_Birth_page6_25'],
  benPar1City: ['Beneficiary_Parent_1_City_Town_Village_of_Birth_page6_26'],
  benPar1Cntr: ['Beneficiary_Parent_1_Country_of_Birth_page6_27'],

  // Part 3 — Other info (met in person & IMBRA / disclosures)
  metYes: ['Pt3_MetInPerson_Yes','Part3_Met_Yes'],
  metNo:  ['Pt3_MetInPerson_No','Part3_Met_No'],

  imbUsedYes: ['IMB_Used_Yes','Part3_IMB_Yes'],
  imbUsedNo:  ['IMB_Used_No','Part3_IMB_No'],

  // Petitioner criminal disclosures (❗populate with your exact names from Excel)
  crim_domvio_Yes: ['Criminal_Domestic_Violence_Yes'],
  crim_domvio_No:  ['Criminal_Domestic_Violence_No'],
  crim_sex_Yes:    ['Criminal_Sexual_Offense_Yes'],
  crim_sex_No:     ['Criminal_Sexual_Offense_No'],
  crim_child_Yes:  ['Criminal_Child_Abuse_Yes'],
  crim_child_No:   ['Criminal_Child_Abuse_No'],
  crim_stalk_Yes:  ['Criminal_Stalking_Yes'],
  crim_stalk_No:   ['Criminal_Stalking_No'],
  crim_subst_Yes:  ['Criminal_Controlled_Substances_Yes'],
  crim_subst_No:   ['Criminal_Controlled_Substances_No'],
  crim_alc_Yes:    ['Criminal_Alcohol_Offense_Yes'],
  crim_alc_No:     ['Criminal_Alcohol_Offense_No'],
  crim_prost_Yes:  ['Criminal_Prostitution_Yes'],
  crim_prost_No:   ['Criminal_Prostitution_No'],
  crim_traffic_Yes:['Criminal_Trafficking_Yes'],
  crim_traffic_No: ['Criminal_Trafficking_No'],
  crim_rest_Yes:   ['Criminal_Restraining_Order_Yes'],
  crim_rest_No:    ['Criminal_Restraining_Order_No'],
  crim_other_Yes:  ['Criminal_Other_Yes'],
  crim_other_No:   ['Criminal_Other_No'],
  crim_explain:    ['Criminal_Explain_All'],

  // Part 4 — Biographics
  bioEthHisp:   ['Pt4_Ethnicity_Hispanic','Part4_Ethnicity_p0_ch1'],
  bioEthNot:    ['Pt4_Ethnicity_NotHispanic','Part4_Ethnicity_p0_ch2'],
  bioRaceWhite: ['Pt4_Race_White'],
  bioRaceBlack: ['Pt4_Race_Black'],
  bioRaceAsian: ['Pt4_Race_Asian'],
  bioRaceAIAN:  ['Pt4_Race_AIAN'],
  bioRaceNHPI:  ['Pt4_Race_NHPI'],
  bioHtFt:      ['Pt4_HeightFeet'],
  bioHtIn:      ['Pt4_HeightInches'],
  bioWt:        ['Pt4_Weight'],
  bioEyeBlack:  ['Pt4_Eye_Black'],
  bioEyeBlue:   ['Pt4_Eye_Blue'],
  bioEyeBrown:  ['Pt4_Eye_Brown'],
  bioEyeGray:   ['Pt4_Eye_Gray','Pt4_Eye_Grey'],
  bioEyeGreen:  ['Pt4_Eye_Green'],
  bioEyeHazel:  ['Pt4_Eye_Hazel'],
  bioEyeMaroon: ['Pt4_Eye_Maroon'],
  bioEyePink:   ['Pt4_Eye_Pink'],
  bioEyeUnk:    ['Pt4_Eye_Unknown'],
  bioHairBald:  ['Pt4_Hair_Bald'],
  bioHairBlack: ['Pt4_Hair_Black'],
  bioHairBlond: ['Pt4_Hair_Blond'],
  bioHairBrown: ['Pt4_Hair_Brown'],
  bioHairGray:  ['Pt4_Hair_Grey','Pt4_Hair_Gray'],
  bioHairRed:   ['Pt4_Hair_Red'],
  bioHairSandy: ['Pt4_Hair_Sandy'],
  bioHairWhite: ['Pt4_Hair_White'],
  bioHairUnk:   ['Pt4_Hair_Unknown'],

  // Part 5 — Petitioner contact / sign date
  p5Email:  ['Pt5_Email','Pt5_PetitionerEmail'],
  p5Phone:  ['Pt5_Phone_Day'],
  p5Mobile: ['Pt5_Phone_Mobile'],
  p5Sign:   ['Pt5_SignatureDate','Pt5_SignDate','Pt5_Date_of_Signature'],

  // Part 6 — Interpreter (plus "used?" toggle)
  interpUsedYes: ['Interpreter_Used_Yes','Part6_Interpreter_Used_Yes'],
  interpUsedNo:  ['Interpreter_Used_No','Part6_Interpreter_Used_No'],
  itpLang:   ['Pt6_Language','Pt6_Interp_Language'],
  itpEmail:  ['Pt6_Email','Pt6_Interp_Email'],
  itpSign:   ['Pt6_SignDate','Pt6_Interp_SignDate'],
  itpLast:   ['Pt6_Family','Pt6_Interp_Family'],
  itpFirst:  ['Pt6_Given','Pt6_Interp_Given'],
  itpBiz:    ['Pt6_Business','Pt6_Interp_Business'],
  itpPhone1: ['Pt6_Phone1','Pt6_Interp_Phone1'],
  itpPhone2: ['Pt6_Phone2','Pt6_Interp_Phone2'],

  // Part 7 — Preparer (plus "used?" toggle)
  prepUsedYes: ['Preparer_Used_Yes','Part7_Preparer_Used_Yes'],
  prepUsedNo:  ['Preparer_Used_No','Part7_Preparer_Used_No'],
  prepLast:  ['Pt7_Family','Pt7_Prep_Family'],
  prepFirst: ['Pt7_Given','Pt7_Prep_Given'],
  prepBiz:   ['Pt7_Business','Pt7_Prep_Business'],
  prepPhone: ['Pt7_Phone','Pt7_Prep_Phone'],
  prepMobile:['Pt7_Mobile','Pt7_Prep_Mobile'],
  prepEmail: ['Pt7_Email','Pt7_Prep_Email'],
  prepSign:  ['Pt7_SignDate','Pt7_Prep_SignDate'],

  // Part 8 — Additional
  p8_3d: ['Continued_Information_1_Explanation_Area_Page12_3.d','Pt8_Line3d','Pt8_3d','Additional_3d'],
  p8_4d: ['Continued_Information_2_Explanation_Area_Page12_4.d','Pt8_Line4d','Pt8_4d','Additional_4d'],
  p8_5d: ['Continued_Information_3_Explanation_Area_Page12_5.d','Pt8_Line5d','Pt8_5d','Additional_5d'],
  p8_6d: ['Continued_Information_4_Explanation_Area_Page12_6.d','Pt8_Line6d','Pt8_6d','Additional_6d'],
};

/* =========================
   Main mapper
========================= */
export function applyI129fMapping(saved, form) {
  if (!saved) return;

  const pet = saved.petitioner || {};
  const ben = saved.beneficiary || {};
  const p8 = saved.part8 || {};
  const bio = saved.biographic || saved.part4 || {};
  const itp = saved.interpreter || {};
  const prep = saved.preparer || {};
  const cls = L(saved?.classification?.type || '');
  const k3Filed = L(saved?.classification?.i130Filed || '');

  /* ---------- Part 1 ---------- */
  T(form, ALIAS.petANum, pet.aNumber);
  T(form, ALIAS.petAcct, pet.uscisOnlineAccount);
  T(form, ALIAS.petSSN,  pet.ssn);

  C(form, ALIAS.k1, cls === 'k1');
  C(form, ALIAS.k3, cls === 'k3');
  if (cls === 'k3') {
    C(form, ALIAS.k3_I130_Yes, k3Filed === 'yes');
    C(form, ALIAS.k3_I130_No,  k3Filed === 'no');
  }

  T(form, ALIAS.petNameLast,  pet.lastName);
  T(form, ALIAS.petNameFirst, pet.firstName);
  T(form, ALIAS.petNameMid,   pet.middleName);
  T(form, ALIAS.petOther0L, get(pet,'otherNames[0].lastName'));
  T(form, ALIAS.petOther0F, get(pet,'otherNames[0].firstName'));
  T(form, ALIAS.petOther0M, get(pet,'otherNames[0].middleName'));

  const mail = addr(saved.mailing || pet.mailing || {});
  T(form, ALIAS.petMailInCare, mail.inCareOf);
  T(form, ALIAS.petMailStreet, mail.street);
  C(form, ALIAS.petMailUnitApt, EQ(mail.unitType,'apt') || EQ(mail.unitType,'apartment') || EQ(mail.unitType,'apt.'));
  C(form, ALIAS.petMailUnitSte, EQ(mail.unitType,'ste') || EQ(mail.unitType,'suite') || EQ(mail.unitType,'ste.'));
  C(form, ALIAS.petMailUnitFlr, EQ(mail.unitType,'flr') || EQ(mail.unitType,'floor') || EQ(mail.unitType,'flr.'));
  T(form, ALIAS.petMailUnitNum, mail.unitNum);
  T(form, ALIAS.petMailCity,    mail.city);
  T(form, ALIAS.petMailState,   mail.state);
  T(form, ALIAS.petMailZip,     mail.zip);
  T(form, ALIAS.petMailProv,    mail.province);
  T(form, ALIAS.petMailPost,    mail.postal);
  T(form, ALIAS.petMailCountry, mail.country);

  const sameAs = !!(saved?.mailing?.sameAsPhysical || mail.sameAsPhysical);
  YN(form, ALIAS.petMailSameYes, ALIAS.petMailSameNo, sameAs);

  const phys1 = sameAs ? { ...mail } : addr(get(saved,'physicalAddresses[0]'));
  T(form, ALIAS.petPhys1Street, phys1.street);
  T(form, ALIAS.petPhys1Unit,   phys1.unitNum);
  T(form, ALIAS.petPhys1City,   phys1.city);
  T(form, ALIAS.petPhys1State,  phys1.state);
  T(form, ALIAS.petPhys1Zip,    phys1.zip);
  T(form, ALIAS.petPhys1Prov,   phys1.province);
  T(form, ALIAS.petPhys1Post,   phys1.postal);
  T(form, ALIAS.petPhys1Cntry,  phys1.country);
  T(form, ALIAS.petPhys1From,   dt(phys1.from));
  T(form, ALIAS.petPhys1To,     dt(phys1.to));

  const phys2 = addr(get(saved,'physicalAddresses[1]'));
  T(form, ALIAS.petPhys2Street, phys2.street);
  T(form, ALIAS.petPhys2Unit,   phys2.unitNum);
  T(form, ALIAS.petPhys2City,   phys2.city);
  T(form, ALIAS.petPhys2State,  phys2.state);
  T(form, ALIAS.petPhys2Zip,    phys2.zip);
  T(form, ALIAS.petPhys2Prov,   phys2.province);
  T(form, ALIAS.petPhys2Post,   phys2.postal);
  T(form, ALIAS.petPhys2Cntry,  phys2.country);
  T(form, ALIAS.petPhys2From,   dt(phys2.from));
  T(form, ALIAS.petPhys2To,     dt(phys2.to));

  const pe1 = get(saved,'employment[0]',{});
  T(form, ALIAS.petEmp1Name,   pe1.employer);
  T(form, ALIAS.petEmp1Street, pe1.street);
  T(form, ALIAS.petEmp1Unit,   pe1.unitNum);
  T(form, ALIAS.petEmp1City,   pe1.city);
  T(form, ALIAS.petEmp1State,  pe1.state);
  T(form, ALIAS.petEmp1Zip,    pe1.zip);
  T(form, ALIAS.petEmp1Prov,   pe1.province);
  T(form, ALIAS.petEmp1Post,   pe1.postal);
  T(form, ALIAS.petEmp1Cntry,  pe1.country);
  T(form, ALIAS.petEmp1Occ,    pe1.occupation);
  T(form, ALIAS.petEmp1From,   dt(pe1.from));
  T(form, ALIAS.petEmp1To,     dt(pe1.to));

  const pe2 = get(saved,'employment[1]',{});
  T(form, ALIAS.petEmp2Name,   pe2.employer);
  T(form, ALIAS.petEmp2Street, pe2.street);
  T(form, ALIAS.petEmp2Unit,   pe2.unitNum);
  T(form, ALIAS.petEmp2City,   pe2.city);
  T(form, ALIAS.petEmp2State,  pe2.state);
  T(form, ALIAS.petEmp2Zip,    pe2.zip);
  T(form, ALIAS.petEmp2Prov,   pe2.province);
  T(form, ALIAS.petEmp2Post,   pe2.postal);
  T(form, ALIAS.petEmp2Cntry,  pe2.country);
  T(form, ALIAS.petEmp2Occ,    pe2.occupation);
  T(form, ALIAS.petEmp2From,   dt(pe2.from));
  T(form, ALIAS.petEmp2To,     dt(pe2.to));

  const sex = L(pet.sex);
  C(form, ALIAS.petSexMale,   sex === 'male');
  C(form, ALIAS.petSexFemale, sex === 'female');
  T(form, ALIAS.petDOB,       dt(pet.dob));
  const ms = L(pet.maritalStatus);
  C(form, ALIAS.petMS_Single,   ms === 'single');
  C(form, ALIAS.petMS_Married,  ms === 'married');
  C(form, ALIAS.petMS_Divorced, ms === 'divorced');
  C(form, ALIAS.petMS_Widowed,  ms === 'widowed');
  T(form, ALIAS.petBirthCity, pet.cityBirth);
  T(form, ALIAS.petBirthProv, pet.provinceBirth);
  T(form, ALIAS.petBirthCntr, pet.countryBirth);

  const pp1 = get(pet,'parents[0]',{});
  T(form, ALIAS.petPar1Last, pp1.lastName);
  T(form, ALIAS.petPar1First,pp1.firstName);
  T(form, ALIAS.petPar1Mid,  pp1.middleName);
  T(form, ALIAS.petPar1DOB,  dt(pp1.dob));
  C(form, ALIAS.petPar1Male, L(pp1.sex)==='male');
  C(form, ALIAS.petPar1Fem,  L(pp1.sex)==='female');
  T(form, ALIAS.petPar1Cntr, pp1.countryBirth);

  const pp2 = get(pet,'parents[1]',{});
  T(form, ALIAS.petPar2Last, pp2.lastName);
  T(form, ALIAS.petPar2First,pp2.firstName);
  T(form, ALIAS.petPar2Mid,  pp2.middleName);
  T(form, ALIAS.petPar2DOB,  dt(pp2.dob));
  C(form, ALIAS.petPar2Male, L(pp2.sex)==='male');
  C(form, ALIAS.petPar2Fem,  L(pp2.sex)==='female');
  T(form, ALIAS.petPar2Cntr, pp2.countryBirth);

  T(form, ALIAS.petNatzNum,   pet.natzNumber);
  T(form, ALIAS.petNatzPlace, pet.natzPlace);
  T(form, ALIAS.petNatzDate,  dt(pet.natzDate));

  /* ---------- Part 2 — Beneficiary ---------- */
  T(form, ALIAS.benLast,  ben.lastName);
  T(form, ALIAS.benFirst, ben.firstName);
  T(form, ALIAS.benMid,   ben.middleName);
  T(form, ALIAS.benANum,  ben.aNumber);
  T(form, ALIAS.benSSN,   ben.ssn);
  T(form, ALIAS.benDOB,   dt(ben.dob));
  const bsex = L(ben.sex);
  C(form, ALIAS.benMale, bsex === 'male');
  C(form, ALIAS.benFem,  bsex === 'female');
  T(form, ALIAS.benBirthCity, ben.cityBirth);
  T(form, ALIAS.benBirthCntr, ben.countryBirth);
  T(form, ALIAS.benNation,    ben.nationality || ben.citizenship);
  T(form, ALIAS.benOther0L, get(ben,'otherNames[0].lastName'));
  T(form, ALIAS.benOther0F, get(ben,'otherNames[0].firstName'));
  T(form, ALIAS.benOther0M, get(ben,'otherNames[0].middleName'));

  const bmail = addr(ben.mailing || {});
  T(form, ALIAS.benMailInCare, bmail.inCareOf);
  T(form, ALIAS.benMailStreet, bmail.street);
  T(form, ALIAS.benMailUnitNum, bmail.unitNum);
  T(form, ALIAS.benMailCity,   bmail.city);
  T(form, ALIAS.benMailState,  bmail.state);
  T(form, ALIAS.benMailZip,    bmail.zip);
  T(form, ALIAS.benMailProv,   bmail.province);
  T(form, ALIAS.benMailPost,   bmail.postal);
  T(form, ALIAS.benMailCntry,  bmail.country);

  const bphys = addr(ben.physicalAddress || {});
  T(form, ALIAS.benPhysStreet, bphys.street);
  T(form, ALIAS.benPhysUnit,   bphys.unitNum);
  T(form, ALIAS.benPhysCity,   bphys.city);
  T(form, ALIAS.benPhysState,  bphys.state);
  T(form, ALIAS.benPhysZip,    bphys.zip);
  T(form, ALIAS.benPhysProv,   bphys.province);
  T(form, ALIAS.benPhysPost,   bphys.postal);
  T(form, ALIAS.benPhysCntry,  bphys.country);
  T(form, ALIAS.benPhysFrom,   dt(bphys.from));
  T(form, ALIAS.benPhysTo,     dt(bphys.to));

  // In U.S.? + status details (auto-YN if you provide beneficiary.inUS)
  const inUS = !!(ben.inUS ?? ben.presentInUS ?? ben.isInUS);
  YN(form, ALIAS.benInUS_Yes, ALIAS.benInUS_No, inUS);
  T(form, ALIAS.benClassAdm,  ben.classOfAdmission || ben.classAdmission || '');
  T(form, ALIAS.benI94,       ben.i94 || ben.i94Number || '');
  T(form, ALIAS.benStatusExp, dt(ben.statusExpires || ben.statusExpiration || ''));
  T(form, ALIAS.benArrival,   dt(ben.arrivalDate || ''));
  T(form, ALIAS.benPassportNo,    ben.passportNumber || '');
  T(form, ALIAS.benTravelDocNo,   ben.travelDocNumber || '');
  T(form, ALIAS.benPassportCntry, ben.passportCountry || '');
  T(form, ALIAS.benPassportExp,   dt(ben.passportExpiration || ''));

  // Employment (beneficiary)
  const be1 = get(ben,'employment[0]',{});
  T(form, ALIAS.benEmp1Name,   be1.employer);
  T(form, ALIAS.benEmp1Street, be1.street);
  T(form, ALIAS.benEmp1Unit,   be1.unitNum);
  T(form, ALIAS.benEmp1City,   be1.city);
  T(form, ALIAS.benEmp1State,  be1.state);
  T(form, ALIAS.benEmp1Zip,    be1.zip);
  T(form, ALIAS.benEmp1Prov,   be1.province);
  T(form, ALIAS.benEmp1Post,   be1.postal);
  T(form, ALIAS.benEmp1Cntry,  be1.country);
  T(form, ALIAS.benEmp1Occ,    be1.occupation);
  T(form, ALIAS.benEmp1From,   dt(be1.from));
  T(form, ALIAS.benEmp1To,     dt(be1.to));

  const be2 = get(ben,'employment[1]',{});
  T(form, ALIAS.benEmp2Name,   be2.employer);
  T(form, ALIAS.benEmp2Street, be2.street);
  T(form, ALIAS.benEmp2Unit,   be2.unitNum);
  T(form, ALIAS.benEmp2City,   be2.city);
  T(form, ALIAS.benEmp2State,  be2.state);
  T(form, ALIAS.benEmp2Zip,    be2.zip);
  T(form, ALIAS.benEmp2Prov,   be2.province);
  T(form, ALIAS.benEmp2Post,   be2.postal);
  T(form, ALIAS.benEmp2Cntry,  be2.country);
  T(form, ALIAS.benEmp2Occ,    be2.occupation);
  T(form, ALIAS.benEmp2From,   dt(be2.from));
  T(form, ALIAS.benEmp2To,     dt(be2.to));

  // Beneficiary parent 1 (you can extend for parent 2 if your PDF has fields)
  const bp1 = get(ben,'parents[0]',{});
  T(form, ALIAS.benPar1Last, bp1.lastName);
  T(form, ALIAS.benPar1First,bp1.firstName);
  T(form, ALIAS.benPar1Mid,  bp1.middleName);
  T(form, ALIAS.benPar1DOB,  dt(bp1.dob));
  T(form, ALIAS.benPar1City, bp1.cityBirth);
  T(form, ALIAS.benPar1Cntr, bp1.countryBirth);

  /* ---------- Part 3 — Other info (met/IMB/Criminal) ---------- */
  // Met in person last 2 years?
  const met = L(get(saved,'part3.metInPerson') || get(saved,'otherInfo.metInPerson') || '');
  C(form, ALIAS.metYes, met === 'yes' || met === 'true');
  C(form, ALIAS.metNo,  met === 'no'  || met === 'false');

  // International Marriage Broker used?
  const imb = L(get(saved,'part3.usedIMB') || get(saved,'otherInfo.usedIMB') || '');
  C(form, ALIAS.imbUsedYes, imb === 'yes' || imb === 'true');
  C(form, ALIAS.imbUsedNo,  imb === 'no'  || imb === 'false');

  // Criminal disclosures (IMBRA list)
  const crim = saved.criminal || {};
  const notes = [];

  function crimYN(yesAlias, noAlias, flag, label) {
    const on = BOOL(flag);
    C(form, yesAlias, on);
    C(form, noAlias, !on);
    if (on && label) notes.push(label);
    return on;
  }

  const d1 = crimYN(ALIAS.crim_domvio_Yes, ALIAS.crim_domvio_No, crim.domesticViolence, 'Domestic violence');
  const d2 = crimYN(ALIAS.crim_sex_Yes,    ALIAS.crim_sex_No,    crim.sexualOffense,   'Sexual offense');
  const d3 = crimYN(ALIAS.crim_child_Yes,  ALIAS.crim_child_No,  crim.childAbuse,      'Child abuse');
  const d4 = crimYN(ALIAS.crim_stalk_Yes,  ALIAS.crim_stalk_No,  crim.stalking,        'Stalking');
  const d5 = crimYN(ALIAS.crim_subst_Yes,  ALIAS.crim_subst_No,  crim.controlledSubstances, 'Controlled substances');
  const d6 = crimYN(ALIAS.crim_alc_Yes,    ALIAS.crim_alc_No,    crim.alcoholOffense,  'Alcohol offense (DUI/DWI)');
  const d7 = crimYN(ALIAS.crim_prost_Yes,  ALIAS.crim_prost_No,  crim.prostitution,    'Prostitution/solicitation');
  const d8 = crimYN(ALIAS.crim_traffic_Yes,ALIAS.crim_traffic_No,crim.humanTrafficking,'Human trafficking');
  const d9 = crimYN(ALIAS.crim_rest_Yes,   ALIAS.crim_rest_No,   crim.restrainingOrder,'Restraining/protection order');
  const dA = crimYN(ALIAS.crim_other_Yes,  ALIAS.crim_other_No,  crim.other,           'Other listed offense(s)');

  // One “explain” box if your PDF has it; else spill to Part 8 line 3d
  const explain = S(crim.explain || '');
  if (!T(form, ALIAS.crim_explain, explain) && (explain || notes.length)) {
    const chunk = [
      explain ? `Criminal/IMBRA details: ${explain}` : '',
      notes.length ? `Checked: ${notes.join(', ')}` : ''
    ].filter(Boolean).join(' | ');
    if (chunk) {
      const cur = S(p8.line3d || '');
      p8.line3d = cur ? `${cur}\n${chunk}` : chunk;
    }
  }

  /* ---------- Part 4 — Biographics ---------- */
  const eth = L(get(bio,'ethnicity') || get(bio,'ethnicity[0]') || '');
  C(form, ALIAS.bioEthHisp, eth === 'hispanic' || eth === 'latino');
  C(form, ALIAS.bioEthNot,  eth && !(eth === 'hispanic' || eth === 'latino'));

  const raceVals = Array.isArray(bio.race) ? bio.race.map(L) : [L(bio.race || '')];
  const R = (needle) => raceVals.some(r => r.includes(needle));

  C(form, ALIAS.bioRaceWhite, R('white'));
  C(form, ALIAS.bioRaceBlack, R('black') || R('african'));
  C(form, ALIAS.bioRaceAsian, R('asian'));
  C(form, ALIAS.bioRaceAIAN,  R('american indian') || R('alaska'));
  C(form, ALIAS.bioRaceNHPI,  R('pacific'));

  T(form, ALIAS.bioHtFt, get(bio,'heightFeet',''));
  T(form, ALIAS.bioHtIn, get(bio,'heightInches',''));
  T(form, ALIAS.bioWt,   get(bio,'weight',''));

  const eye = L(get(bio,'eyeColor',''));
  C(form, ALIAS.bioEyeBlack, eye === 'black');
  C(form, ALIAS.bioEyeBlue,  eye === 'blue');
  C(form, ALIAS.bioEyeBrown, eye === 'brown');
  C(form, ALIAS.bioEyeGray,  eye === 'gray' || eye === 'grey');
  C(form, ALIAS.bioEyeGreen, eye === 'green');
  C(form, ALIAS.bioEyeHazel, eye === 'hazel');
  C(form, ALIAS.bioEyeMaroon, eye === 'maroon');
  C(form, ALIAS.bioEyePink,  eye === 'pink');
  C(form, ALIAS.bioEyeUnk,   eye === 'unknown' || eye === 'other');

  const hair = L(get(bio,'hairColor',''));
  C(form, ALIAS.bioHairBald,  hair === 'bald' || hair === 'none');
  C(form, ALIAS.bioHairBlack, hair === 'black');
  C(form, ALIAS.bioHairBlond, hair === 'blond' || hair === 'blonde');
  C(form, ALIAS.bioHairBrown, hair === 'brown');
  C(form, ALIAS.bioHairGray,  hair === 'gray' || hair === 'grey');
  C(form, ALIAS.bioHairRed,   hair === 'red');
  C(form, ALIAS.bioHairSandy, hair === 'sandy');
  C(form, ALIAS.bioHairWhite, hair === 'white');
  C(form, ALIAS.bioHairUnk,   hair === 'unknown' || hair === 'other');

  /* ---------- Part 5 — Contact ---------- */
  T(form, ALIAS.p5Email,  get(saved,'petitioner.email'));
  T(form, ALIAS.p5Phone,  get(saved,'petitioner.phone'));
  T(form, ALIAS.p5Mobile, get(saved,'petitioner.mobile'));
  T(form, ALIAS.p5Sign,   dt(get(saved,'preparer.signDate') || get(saved,'petitioner.signDate')));

  /* ---------- Part 6 — Interpreter ---------- */
  const usedInterpreter = HAS(itp, ['language','email','lastName','firstName','business','phone1','phone2','signDate']);
  YN(form, ALIAS.interpUsedYes, ALIAS.interpUsedNo, usedInterpreter);

  T(form, ALIAS.itpLang,   itp.language);
  T(form, ALIAS.itpEmail,  itp.email);
  T(form, ALIAS.itpSign,   dt(itp.signDate));
  T(form, ALIAS.itpLast,   itp.lastName);
  T(form, ALIAS.itpFirst,  itp.firstName);
  T(form, ALIAS.itpBiz,    itp.business);
  T(form, ALIAS.itpPhone1, itp.phone1);
  T(form, ALIAS.itpPhone2, itp.phone2);

  /* ---------- Part 7 — Preparer ---------- */
  const usedPreparer = HAS(prep, ['lastName','firstName','business','phone','mobile','email','signDate']);
  YN(form, ALIAS.prepUsedYes, ALIAS.prepUsedNo, usedPreparer);

  T(form, ALIAS.prepLast,  prep.lastName);
  T(form, ALIAS.prepFirst, prep.firstName);
  T(form, ALIAS.prepBiz,   prep.business);
  T(form, ALIAS.prepPhone, prep.phone);
  T(form, ALIAS.prepMobile,prep.mobile);
  T(form, ALIAS.prepEmail, prep.email);
  T(form, ALIAS.prepSign,  dt(prep.signDate));

  /* ---------- Part 8 — Additional ---------- */
  // Keep your existing spillover behavior
  T(form, ALIAS.p8_3d, p8.line3d || '');
  T(form, ALIAS.p8_4d, p8.line4d || '');
  T(form, ALIAS.p8_5d, p8.line5d || '');
  T(form, ALIAS.p8_6d, p8.line6d || '');

  // Arbitrary overrides (advanced)
  const other = saved.other || {};
  for (const [name, val] of Object.entries(other)) {
    if (!setText(form, name, S(val))) {
      if (val === true || val === false) setCheck(form, name, !!val);
    }
  }
}
