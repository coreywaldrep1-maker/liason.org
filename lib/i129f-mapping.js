// i129f-mapping.js
//
// Robust mapper for I-129F (Parts 1–8) with call-compat shims.
// - FIX: no .toLowerCase() crash on classification object
// - Safe setters
// - Alias arrays for PDF field IDs (add your Excel "middle column" names here)
// - Exports: applyI129fMapping(saved, form), mapI129F(form, saved), default(...), CommonJS

/* ---------- helpers ---------- */
function fmtDate(v) {
  if (!v) return '';
  try {
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
      const [y, m, d] = v.split('-'); return `${m}/${d}/${y}`;
    }
    if (typeof v === 'string' && /^\d{1,2}\/\d{1,2}\/(\d{2}|\d{4})$/.test(v)) {
      const [m,d,y] = v.split('/'); const yyyy = y.length===2 ? (Number(y)>=70?`19${y}`:`20${y}`) : y;
      return `${String(m).padStart(2,'0')}/${String(d).padStart(2,'0')}/${yyyy}`;
    }
    const d = new Date(v); if (Number.isNaN(d.getTime())) return String(v);
    const mm = String(d.getMonth()+1).padStart(2,'0'); const dd = String(d.getDate()).padStart(2,'0'); const yy = d.getFullYear();
    return `${mm}/${dd}/${yy}`;
  } catch { return String(v); }
}
function truthy(v){ if(v===true) return true; if(v===false||v==null) return false; const s=String(v).trim().toLowerCase(); return ['y','yes','true','1','on','checked'].includes(s); }
function pickAddress(src={}){ return { inCareOf:src.inCareOf||'', street:src.street||'', unitNum:src.unitNum||'', unitType:src.unitType||'', city:src.city||'', state:src.state||'', zip:src.zip||'', province:src.province||'', postal:src.postal||'', country:src.country||'', from:src.from||'', to:src.to||'' }; }

/* ---------- pdf-lib field helpers ---------- */
function setText1(form,name,value){ try{ const tf=form.getTextField(name); tf.setText(value??''); return true; }catch{ return false; } }
function check1(form,name,on=true){ try{ const cb=form.getCheckBox(name); on?cb.check():cb.uncheck(); return true; }catch{ return false; } }
function setManyText(form,names,value){ let ok=false; for(const n of names) ok=setText1(form,n,value)||ok; return ok; }
function setManyChecks(form,names,on){ let ok=false; for(const n of names) ok=check1(form,n,on)||ok; return ok; }
function setYesNo(form,yesNames,noNames,value){ const y=truthy(value); setManyChecks(form,yesNames,y); setManyChecks(form,noNames,!y); }

/* ---------- core mapping ---------- */
function coreApply(saved, form) {
  if (!saved || !form) return;

  const pet  = saved.petitioner || {};
  const ben  = saved.beneficiary || {};
  const m    = saved.mailing || {};
  const phys = Array.isArray(saved.physicalAddresses) ? saved.physicalAddresses : [];
  const emp  = Array.isArray(saved.employment) ? saved.employment : [];
  const bEmp = Array.isArray(ben.employment) ? ben.employment : [];
  const p3   = saved.part3 || {};
  const crim = saved.criminal || {};
  const bio  = saved.biographic || {};
  const itp  = saved.interpreter || {};
  const prep = saved.preparer || {};
  const p8   = saved.part8 || {};
  const other= saved.other || {};

  // FIX: safe classification read
  const clsType = String(((saved.classification||{}).type || '')).toLowerCase(); // 'k1'|'k3'|''
  const k3FiledFromClass = String(((saved.classification||{}).i130Filed || '')).toLowerCase();
  const k3FiledLegacy = saved.k3FiledI130;
  const k3Filed = (k3FiledLegacy !== undefined) ? !!k3FiledLegacy
                 : (k3FiledFromClass==='yes' ? true : (k3FiledFromClass==='no' ? false : null));

  /* ===== Part 1 — Petitioner ===== */
  setManyText(form, ['Pt1Line1_AlienNumber','A_Number','Pt1_A_Number'], pet.aNumber);
  setManyText(form, ['Pt1Line2_AcctIdentifier','USCIS_Online_Account_Number','Pt1_OnlineAcct'], pet.uscisOnlineAccount);
  setManyText(form, ['Pt1Line3_SSN','SSN','Pt1_SSN'], pet.ssn);

  setManyChecks(form, ['Pt1Line4a_K1','Pt1_Line4a_K1','Pt1_Line4a_Fiance','Line4_K1'], clsType==='k1');
  setManyChecks(form, ['Pt1Line4a_K3','Pt1_Line4a_K3','Pt1_Line4a_Spouse','Line4_K3'], clsType==='k3');
  if (clsType==='k3' && k3Filed!==null) {
    setManyChecks(form, ['Pt1Line5_Yes','Line5_I130_Yes'], k3Filed===true);
    setManyChecks(form, ['Pt1Line5_No','Line5_I130_No'],   k3Filed===false);
  }

  setManyText(form, ['Pt1Line6a_FamilyName','Pt1_LastName'], pet.lastName);
  setManyText(form, ['Pt1Line6b_GivenName','Pt1_FirstName'], pet.firstName);
  setManyText(form, ['Pt1Line6c_MiddleName','Pt1_MiddleName'], pet.middleName);

  const ma = pickAddress(m);
  setManyText(form, ['Pt1Line8_InCareOfName'], ma.inCareOf);
  setManyText(form, ['Pt1Line8_StreetNumberName'], ma.street);
  setManyText(form, ['Pt1Line8_AptSteFlrNumber'],  ma.unitNum);
  setManyText(form, ['Pt1Line8_CityOrTown'],       ma.city);
  setManyText(form, ['Pt1Line8_State'],            ma.state);
  setManyText(form, ['Pt1Line8_ZipCode'],          ma.zip);
  setManyText(form, ['Pt1Line8_Province'],         ma.province);
  setManyText(form, ['Pt1Line8_PostalCode'],       ma.postal);
  setManyText(form, ['Pt1Line8_Country'],          ma.country);

  const p0 = pickAddress(phys[0]||{}); const p1 = pickAddress(phys[1]||{});
  setManyText(form, ['Pt1Line9_StreetNumberName'], p0.street);
  setManyText(form, ['Pt1Line9_AptSteFlrNumber'],  p0.unitNum);
  setManyText(form, ['Pt1Line9_CityOrTown'],       p0.city);
  setManyText(form, ['Pt1Line9_State'],            p0.state);
  setManyText(form, ['Pt1Line9_ZipCode'],          p0.zip);
  setManyText(form, ['Pt1Line9_Province'],         p0.province);
  setManyText(form, ['Pt1Line9_PostalCode'],       p0.postal);
  setManyText(form, ['Pt1Line9_Country'],          p0.country);
  setManyText(form, ['Pt1Line10a_DateFrom'],       fmtDate(p0.from));
  setManyText(form, ['Pt1Line10b_ToFrom'],         fmtDate(p0.to));

  setManyText(form, ['Pt1Line11_StreetNumberName'], p1.street);
  setManyText(form, ['Pt1Line11_AptSteFlrNumber'],  p1.unitNum);
  setManyText(form, ['Pt1Line11_CityOrTown'],       p1.city);
  setManyText(form, ['Pt1Line11_State'],            p1.state);
  setManyText(form, ['Pt1Line11_ZipCode'],          p1.zip);
  setManyText(form, ['Pt1Line11_Province'],         p1.province);
  setManyText(form, ['Pt1Line11_PostalCode'],       p1.postal);
  setManyText(form, ['Pt1Line11_Country'],          p1.country);
  setManyText(form, ['Pt1Line12a_DateFrom'],        fmtDate(p1.from));
  setManyText(form, ['Pt1Line12b_ToFrom'],          fmtDate(p1.to));

  const e0 = emp[0]||{}; const e1 = emp[1]||{};
  setManyText(form, ['Pt1Line13_NameofEmployer'],   e0.employer);
  setManyText(form, ['Pt1Line14_StreetNumberName'], e0.street);
  setManyText(form, ['Pt1Line14_AptSteFlrNumber'],  e0.unitNum);
  setManyText(form, ['Pt1Line14_CityOrTown'],       e0.city);
  setManyText(form, ['Pt1Line14_State'],            e0.state);
  setManyText(form, ['Pt1Line14_ZipCode'],          e0.zip);
  setManyText(form, ['Pt1Line14_Province'],         e0.province);
  setManyText(form, ['Pt1Line14_PostalCode'],       e0.postal);
  setManyText(form, ['Pt1Line14_Country'],          e0.country);
  setManyText(form, ['Pt1Line15_Occupation'],       e0.occupation);
  setManyText(form, ['Pt1Line16a_DateFrom'],        fmtDate(e0.from));
  setManyText(form, ['Pt1Line16b_ToFrom'],          fmtDate(e0.to));

  setManyText(form, ['Pt1Line17_NameofEmployer'],   e1.employer);
  setManyText(form, ['Pt1Line18_StreetNumberName'], e1.street);
  setManyText(form, ['Pt1Line18_AptSteFlrNumber'],  e1.unitNum);
  setManyText(form, ['Pt1Line18_CityOrTown'],       e1.city);
  setManyText(form, ['Pt1Line18_State'],            e1.state);
  setManyText(form, ['Pt1Line18_ZipCode'],          e1.zip);
  setManyText(form, ['Pt1Line18_Province'],         e1.province);
  setManyText(form, ['Pt1Line18_PostalCode'],       e1.postal);
  setManyText(form, ['Pt1Line18_Country'],          e1.country);
  setManyText(form, ['Pt1Line19_Occupation'],       e1.occupation);
  setManyText(form, ['Pt1Line20a_DateFrom'],        fmtDate(e1.from));
  setManyText(form, ['Pt1Line20b_ToFrom'],          fmtDate(e1.to));

  const pr0=(pet.parents&&pet.parents[0])||{}; const pr1=(pet.parents&&pet.parents[1])||{};
  setManyText(form, ['Pt1Line21a_FamilyName'], pr0.lastName);
  setManyText(form, ['Pt1Line21b_GivenName'],  pr0.firstName);
  setManyText(form, ['Pt1Line21c_MiddleName'], pr0.middleName);
  setManyText(form, ['Pt1Line22_DateOfBirth'], fmtDate(pr0.dob));
  setManyText(form, ['Pt1Line23_CityTownOfBirth'], pr0.cityBirth);
  setManyText(form, ['Pt1Line26_CountryOfBirth'],  pr0.countryBirth);

  setManyText(form, ['Pt1Line24a_FamilyName'], pr1.lastName);
  setManyText(form, ['Pt1Line24b_GivenName'],  pr1.firstName);
  setManyText(form, ['Pt1Line24c_MiddleName'], pr1.middleName);
  setManyText(form, ['Pt1Line25_DateOfBirth'], fmtDate(pr1.dob));
  setManyText(form, ['Pt1Line26_CityTownOfBirth'], pr1.cityBirth);
  setManyText(form, ['Pt1Line26_CountryOfBirth_2'], pr1.countryBirth);

  setManyText(form, ['Pt1Line27_CertOfCitNumber'], pet.natzNumber);
  setManyText(form, ['Pt1Line28_PlaceOfIssuance'], pet.natzPlace);
  setManyText(form, ['Pt1Line29_DateOfIssuance'], fmtDate(pet.natzDate));

  // Contact (also repeated later)
  setManyText(form, ['Pt5_Petitioner_DaytimePhone','Petitioner_Day_Phone'], pet.phone);
  setManyText(form, ['Pt5_Petitioner_MobilePhone','Petitioner_Mobile'],     pet.mobile);
  setManyText(form, ['Pt5_Petitioner_Email','Petitioner_Email'],             pet.email);

  /* ===== Part 2 — Beneficiary ===== */
  setManyText(form, ['Pt2Line1a_FamilyName'], ben.lastName);
  setManyText(form, ['Pt2Line1b_GivenName'],  ben.firstName);
  setManyText(form, ['Pt2Line1c_MiddleName'], ben.middleName);
  setManyText(form, ['Pt2Line2_AlienNumber'], ben.aNumber);
  setManyText(form, ['Pt2Line3_SSN'],         ben.ssn);
  setManyText(form, ['Pt2Line4_DateOfBirth'], fmtDate(ben.dob));
  setManyText(form, ['Pt2Line7_CityTownOfBirth'], ben.cityBirth);
  setManyText(form, ['Pt2Line8_CountryOfBirth'],  ben.countryBirth);
  setManyText(form, ['Pt2Line9_CountryofCitzOrNationality'], ben.nationality);

  const bm = pickAddress(ben.mailing || {});
  setManyText(form, ['Pt2Line10a_FamilyName_inCare','Pt2_Mail_InCareOf'], bm.inCareOf);
  setManyText(form, ['Pt2Line11_StreetNumberName'], bm.street);
  setManyText(form, ['Pt2Line11_AptSteFlrNumber'],  bm.unitNum);
  setManyText(form, ['Pt2Line11_CityOrTown'],       bm.city);
  setManyText(form, ['Pt2Line11_State'],            bm.state);
  setManyText(form, ['Pt2Line11_ZipCode'],          bm.zip);
  setManyText(form, ['Pt2Line11_Province'],         bm.province);
  setManyText(form, ['Pt2Line11_PostalCode'],       bm.postal);
  setManyText(form, ['Pt2Line11_Country'],          bm.country);

  const bp = pickAddress(ben.physicalAddress || {});
  setManyText(form, ['Pt2Line14_StreetNumberName'], bp.street);
  setManyText(form, ['Pt2Line14_AptSteFlrNumber'],  bp.unitNum);
  setManyText(form, ['Pt2Line14_CityOrTown'],       bp.city);
  setManyText(form, ['Pt2Line14_State'],            bp.state);
  setManyText(form, ['Pt2Line14_ZipCode'],          bp.zip);
  setManyText(form, ['Pt2Line14_Province'],         bp.province);
  setManyText(form, ['Pt2Line14_PostalCode'],       bp.postal);
  setManyText(form, ['Pt2Line14_Country'],          bp.country);

  const be0=bEmp[0]||{}; const be1=bEmp[1]||{};
  setManyText(form, ['Pt2Line16_NameofEmployer'],  be0.employer);
  setManyText(form, ['Pt2Line17_StreetNumberName'],be0.street);
  setManyText(form, ['Pt2Line17_AptSteFlrNumber'], be0.unitNum);
  setManyText(form, ['Pt2Line17_CityOrTown'],      be0.city);
  setManyText(form, ['Pt2Line17_State'],           be0.state);
  setManyText(form, ['Pt2Line17_ZipCode'],         be0.zip);
  setManyText(form, ['Pt2Line17_Province'],        be0.province);
  setManyText(form, ['Pt2Line17_PostalCode'],      be0.postal);
  setManyText(form, ['Pt2Line17_Country'],         be0.country);
  setManyText(form, ['Pt2Line18_Occupation'],      be0.occupation);
  setManyText(form, ['Pt2Line19a_DateFrom'],       fmtDate(be0.from));
  setManyText(form, ['Pt2Line19b_ToFrom'],         fmtDate(be0.to));

  setManyText(form, ['Pt2Line20_NameofEmployer'],  be1.employer);
  setManyText(form, ['Pt2Line21_StreetNumberName'],be1.street);
  setManyText(form, ['Pt2Line21_AptSteFlrNumber'], be1.unitNum);
  setManyText(form, ['Pt2Line21_CityOrTown'],      be1.city);
  setManyText(form, ['Pt2Line21_State'],           be1.state);
  setManyText(form, ['Pt2Line21_ZipCode'],         be1.zip);
  setManyText(form, ['Pt2Line21_Province'],        be1.province);
  setManyText(form, ['Pt2Line21_PostalCode'],      be1.postal);
  setManyText(form, ['Pt2Line21_Country'],         be1.country);
  setManyText(form, ['Pt2Line22_Occupation'],      be1.occupation);
  setManyText(form, ['Pt2Line23a_DateFrom'],       fmtDate(be1.from));
  setManyText(form, ['Pt2Line23b_ToFrom'],         fmtDate(be1.to));

  const bp0=(ben.parents&&ben.parents[0])||{}; const bp1=(ben.parents&&ben.parents[1])||{};
  setManyText(form, ['Pt2Line24a_FamilyName'], bp0.lastName);
  setManyText(form, ['Pt2Line24b_GivenName'],  bp0.firstName);
  setManyText(form, ['Pt2Line24c_MiddleName'], bp0.middleName);
  setManyText(form, ['Pt2Line25_DateOfBirth'], fmtDate(bp0.dob));
  setManyText(form, ['Pt2Line26_CityTownOfBirth'], bp0.cityBirth);
  setManyText(form, ['Pt2Line27_CountryOfBirth'],  bp0.countryBirth);

  setManyText(form, ['Pt2Line28a_FamilyName'], bp1.lastName);
  setManyText(form, ['Pt2Line28b_GivenName'],  bp1.firstName);
  setManyText(form, ['Pt2Line28c_MiddleName'], bp1.middleName);
  setManyText(form, ['Pt2Line29_DateOfBirth'], fmtDate(bp1.dob));
  setManyText(form, ['Pt2Line30_CityTownOfBirth'], bp1.cityBirth);
  setManyText(form, ['Pt2Line31_CountryOfBirth'],  bp1.countryBirth);

  // Beneficiary in U.S. + docs
  setYesNo(form,
    ['Pt2Line38_InUS_Yes','Beneficiary_Currently_In_US_Yes_Checkbox_page7_38'],
    ['Pt2Line38_InUS_No','Beneficiary_Currently_In_US_No_Checkbox_page7_38'],
    ben.inUS
  );
  setManyText(form, ['Pt2Line38b_I94Number','Beneficiary_Currently_In_US_I94_Number_page7_38.b'], ben.i94);
  setManyText(form, ['Pt2Line38c_ClassOfAdmission','Beneficiary_Currently_In_US_Class_Of_Admission_page7_38.c'], ben.classOfAdmission);
  setManyText(form, ['Pt2Line38d_StatusExpiration','Beneficiary_Currently_In_US_Date_Of_Expiration_Shown_I94_I95_page7_38.d'], fmtDate(ben.statusExpires));
  setManyText(form, ['Pt2Line39_DateOfArrival','Beneficiary_Currently_In_US_Date_Of_Arrival_page7_39'], fmtDate(ben.arrivalDate));
  setManyText(form, ['Pt2Line40a_PassportNumber','Beneficiary_Passport_Number_page7_40.a'], ben.passportNumber);
  setManyText(form, ['Pt2Line40b_TravelDocNumber','Beneficiary_Travel_Document_Number_page7_40.b'], ben.travelDocNumber);
  setManyText(form, ['Pt2Line40c_PassportCountry','Beneficiary_Passport_Country_Of_Issuance_page7_40.c'], ben.passportCountry);
  setManyText(form, ['Pt2Line40d_PassportExpiration','Beneficiary_Passport_Expiration_Date_page7_40.d'], fmtDate(ben.passportExpiration));

  /* ===== Part 3 — Relationship / IMB / Criminal ===== */
  setYesNo(form,
    ['Pt3Line53_MetInPerson_Yes','Beneficiary_Information_Have_Met_Fiance_In_Person_Last_two_years_Yes_Checkbox_page8_53'],
    ['Pt3Line53_MetInPerson_No','Beneficiary_Information_Have_Met_Fiance_In_Person_Last_two_years_No_Checkbox_page8_54'],
    (p3.metInPerson==='yes')
  );
  setYesNo(form,
    ['Pt3Line55_IMB_Yes','Beneficiary_Information_Used_International_Marriage_Broker_Yes_Checkbox_page8_55'],
    ['Pt3Line55_IMB_No','Beneficiary_Information_Used_International_Marriage_Broker_No_Checkbox_page8_56'],
    (p3.usedIMB==='yes')
  );
  setManyChecks(form, ['Pt3Line21a_Crim_DomesticViolence','Beneficiary_Information_Criminal_Domestic_Violence_Checkbox_page9_21a'], truthy(crim.domesticViolence));
  setManyChecks(form, ['Pt3Line21b_Crim_SexualOffense','Beneficiary_Information_Criminal_Sexual_Offense_Checkbox_page9_21b'], truthy(crim.sexualOffense));
  setManyChecks(form, ['Pt3Line21c_Crim_ChildAbuse','Beneficiary_Information_Criminal_Child_Abuse_Checkbox_page9_21c'], truthy(crim.childAbuse));
  setManyChecks(form, ['Pt3Line21d_Crim_Stalking','Beneficiary_Information_Criminal_Stalking_Checkbox_page9_21d'], truthy(crim.stalking));
  setManyChecks(form, ['Pt3Line21e_Crim_ControlledSubstances','Beneficiary_Information_Criminal_Controlled_Substances_Checkbox_page9_21e'], truthy(crim.controlledSubstances));
  setManyChecks(form, ['Pt3Line21f_Crim_AlcoholOffense','Beneficiary_Information_Criminal_Alcohol_Offense_Checkbox_page9_21f'], truthy(crim.alcoholOffense));
  setManyChecks(form, ['Pt3Line21g_Crim_Prostitution','Beneficiary_Information_Criminal_Prostitution_Solicitation_Checkbox_page9_21g'], truthy(crim.prostitution));
  setManyChecks(form, ['Pt3Line21h_Crim_HumanTrafficking','Beneficiary_Information_Criminal_Human_Trafficking_Checkbox_page9_21h'], truthy(crim.humanTrafficking));
  setManyChecks(form, ['Pt3Line21i_Crim_RestrainingOrder','Beneficiary_Information_Criminal_Restraining_Order_Checkbox_page9_21i'], truthy(crim.restrainingOrder));
  setManyChecks(form, ['Pt3Line21j_Crim_Other','Beneficiary_Information_Criminal_Other_Listed_Offenses_Checkbox_page9_21j'], truthy(crim.other));
  setManyText(form, ['Pt3Line3_Explanation','Beneficiary_Information_Criminal_Explanation_Text_Page9_3'], crim.explain);

  /* ===== Part 4 — Biographic (Petitioner) ===== */
  setYesNo(form, ['Pt4_Ethnicity_Hispanic'], ['Pt4_Ethnicity_NotHispanic'], (bio.ethnicity==='hispanic'));
  const raceArr = Array.isArray(bio.race) ? bio.race : [];
  const has = (k)=>raceArr.includes(k);
  setManyChecks(form, ['Pt4_Race_White'], has('white'));
  setManyChecks(form, ['Pt4_Race_Black'], has('black'));
  setManyChecks(form, ['Pt4_Race_Asian'], has('asian'));
  setManyChecks(form, ['Pt4_Race_AIAN'],  has('aian'));
  setManyChecks(form, ['Pt4_Race_NHPI'],  has('nhpi'));
  setManyText(form, ['Pt4_Height_Feet'],   bio.heightFeet);
  setManyText(form, ['Pt4_Height_Inches'], bio.heightInches);
  setManyText(form, ['Pt4_Weight_Lbs'],    bio.weight);
  setManyText(form, ['Pt4_EyeColor'],      bio.eyeColor);
  setManyText(form, ['Pt4_HairColor'],     bio.hairColor);

  /* ===== Parts 5–7 — Contact / Interpreter / Preparer ===== */
  setManyText(form, ['Pt5_Line1_DayPhone'], pet.phone);
  setManyText(form, ['Pt5_Line2_Mobile'],   pet.mobile);
  setManyText(form, ['Pt5_Line3_Email'],    pet.email);

  setYesNo(form, ['Pt6_InterpreterUsed_Yes','Interpreter_Used_Yes_Checkbox_page10'],
                ['Pt6_InterpreterUsed_No','Interpreter_Used_No_Checkbox_page10'], itp.used);
  if (truthy(itp.used)) {
    setManyText(form, ['Pt6_Language'], itp.language);
    setManyText(form, ['Pt6_Interpreter_FamilyName'], itp.lastName);
    setManyText(form, ['Pt6_Interpreter_GivenName'],  itp.firstName);
    setManyText(form, ['Pt6_Interpreter_Business'],   itp.business);
    setManyText(form, ['Pt6_Interpreter_Email'],      itp.email);
    setManyText(form, ['Pt6_Interpreter_Phone1'],     itp.phone1);
    setManyText(form, ['Pt6_Interpreter_Phone2'],     itp.phone2);
    setManyText(form, ['Pt6_Interpreter_SignDate'],   fmtDate(itp.signDate));
  }

  setYesNo(form, ['Pt7_PreparerUsed_Yes','Preparer_Used_Yes_Checkbox_page11'],
                ['Pt7_PreparerUsed_No','Preparer_Used_No_Checkbox_page11'], prep.used);
  if (truthy(prep.used)) {
    setManyText(form, ['Pt7_Preparer_FamilyName'], prep.lastName);
    setManyText(form, ['Pt7_Preparer_GivenName'],  prep.firstName);
    setManyText(form, ['Pt7_Preparer_Business'],   prep.business);
    setManyText(form, ['Pt7_Preparer_Email'],      prep.email);
    setManyText(form, ['Pt7_Preparer_Phone'],      prep.phone);
    setManyText(form, ['Pt7_Preparer_Mobile'],     prep.mobile);
    setManyText(form, ['Pt7_Preparer_SignDate'],   fmtDate(prep.signDate));
  }

  /* ===== Part 8 — Additional Info ===== */
  setManyText(form, ['Pt8_Line3d'], p8.line3d);
  setManyText(form, ['Pt8_Line4d'], p8.line4d);
  setManyText(form, ['Pt8_Line5d'], p8.line5d);
  setManyText(form, ['Pt8_Line6d'], p8.line6d);

  // “Other overrides”: write raw PDF field names provided in wizard Part 8
  try {
    if (other && typeof other === 'object') {
      for (const [pdfFieldName, value] of Object.entries(other)) {
        if (value === undefined) continue;
        if (!setText1(form, pdfFieldName, String(value))) {
          setManyChecks(form, [pdfFieldName], truthy(value));
        }
      }
    }
  } catch {}
}

/* ---------- exports / shims ---------- */
export function applyI129fMapping(saved, form){ coreApply(saved, form); }

export function mapI129F(a,b){
  const isForm = (x)=>x && typeof x.getTextField==='function' && typeof x.getCheckBox==='function';
  const [saved, form] = isForm(a) ? [b,a] : [a,b];
  coreApply(saved, form);
}
export const mapI129f = mapI129F;

const _defaultExport = function(a,b){
  const isForm = (x)=>x && typeof x.getTextField==='function' && typeof x.getCheckBox==='function';
  const [saved, form] = isForm(a) ? [b,a] : [a,b];
  coreApply(saved, form);
};
export default _defaultExport;

// CommonJS interop (if your route uses require)
try { if (typeof module!=='undefined') { module.exports = { default:_defaultExport, applyI129fMapping:_defaultExport, mapI129F:_defaultExport, mapI129f:_defaultExport }; } } catch {}
