// lib/i129f-map.js
//
// This file maps your saved wizard JSON -> PDF field names.
// You can extend this steadily without touching the /api/i129f/pdf endpoint again.

//
// 1) TEXT FIELDS: pdfFieldName -> "path.in.draft"
//    - If the path doesn't exist or is empty, it's skipped.
//    - Works with arrays using [0], [1], etc.
//
export const MAPPING_TEXT = {
  // --- Part 1: Petitioner IDs & names ---
  'Pt1Line1_AlienNumber':           'petitioner.aNumber',
  'Pt1Line2_AcctIdentifier':        'petitioner.uscisAccount',
  'Pt1Line3_SSN':                   'petitioner.ssn',

  'Pt1Line6a_FamilyName':           'petitioner.name.last',
  'Pt1Line6b_GivenName':            'petitioner.name.first',
  'Pt1Line6c_MiddleName':           'petitioner.name.middle',

  // Other names used (first alias, add more below if needed)
  'Pt1Line7a_FamilyName':           'petitioner.otherNames[0].last',
  'Pt1Line7b_GivenName':            'petitioner.otherNames[0].first',
  'Pt1Line7c_MiddleName':           'petitioner.otherNames[0].middle',

  // Mailing address
  'Pt1Line8_InCareofName':          'petitioner.mailing.inCareOf',
  'Pt1Line8_StreetNumberName':      'petitioner.mailing.street',
  'Pt1Line8_AptSteFlrNumber':       'petitioner.mailing.unitNumber',
  'Pt1Line8_CityOrTown':            'petitioner.mailing.city',
  'Pt1Line8_State':                 'petitioner.mailing.state',
  'Pt1Line8_ZipCode':               'petitioner.mailing.zip',
  'Pt1Line8_Province':              'petitioner.mailing.province',
  'Pt1Line8_PostalCode':            'petitioner.mailing.postalCode',
  'Pt1Line8_Country':               'petitioner.mailing.country',

  // Physical address (if different)
  'Pt1Line9_StreetNumberName':      'petitioner.physical.street',
  'Pt1Line9_AptSteFlrNumber':       'petitioner.physical.unitNumber',
  'Pt1Line9_CityOrTown':            'petitioner.physical.city',
  'Pt1Line9_State':                 'petitioner.physical.state',
  'Pt1Line9_ZipCode':               'petitioner.physical.zip',
  'Pt1Line9_Province':              'petitioner.physical.province',
  'Pt1Line9_PostalCode':            'petitioner.physical.postalCode',
  'Pt1Line9_Country':               'petitioner.physical.country',

  // Previous addresses (most recent first)
  // Prev #1
  'Pt1Line11_StreetNumberName':     'petitioner.prevAddresses[0].street',
  'Pt1Line11_AptSteFlrNumber':      'petitioner.prevAddresses[0].unitNumber',
  'Pt1Line11_CityOrTown':           'petitioner.prevAddresses[0].city',
  'Pt1Line11_State':                'petitioner.prevAddresses[0].state',
  'Pt1Line11_ZipCode':              'petitioner.prevAddresses[0].zip',
  'Pt1Line11_Province':             'petitioner.prevAddresses[0].province',
  'Pt1Line11_PostalCode':           'petitioner.prevAddresses[0].postalCode',
  'Pt1Line11_Country':              'petitioner.prevAddresses[0].country',
  'Pt1Line10a_DateFrom':            'petitioner.prevAddresses[0].dateFrom',
  'Pt1Line10b_DateFrom':            'petitioner.prevAddresses[0].dateTo',

  // Prev #2
  'Pt1Line14_StreetNumberName':     'petitioner.prevAddresses[1].street',
  'Pt1Line14_AptSteFlrNumber':      'petitioner.prevAddresses[1].unitNumber',
  'Pt1Line14_CityOrTown':           'petitioner.prevAddresses[1].city',
  'Pt1Line14_State':                'petitioner.prevAddresses[1].state',
  'Pt1Line14_ZipCode':              'petitioner.prevAddresses[1].zip',
  'Pt1Line14_Province':             'petitioner.prevAddresses[1].province',
  'Pt1Line14_PostalCode':           'petitioner.prevAddresses[1].postalCode',
  'Pt1Line14_Country':              'petitioner.prevAddresses[1].country',
  'Pt1Line12a_DateFrom':            'petitioner.prevAddresses[1].dateFrom',
  'Pt1Line12b_ToFrom':              'petitioner.prevAddresses[1].dateTo',

  // Employment history (current job #1)
  'Pt1Line13_NameofEmployer':       'petitioner.jobs[0].employer',
  'Pt1Line15_Occupation':           'petitioner.jobs[0].occupation',
  'Pt1Line16a_DateFrom':            'petitioner.jobs[0].dateFrom',
  'Pt1Line16b_ToFrom':              'petitioner.jobs[0].dateTo',
  'Pt1Line18_StreetNumberName':     'petitioner.jobs[0].street',
  'Pt1Line18_AptSteFlrNumber':      'petitioner.jobs[0].unitNumber',
  'Pt1Line18_CityOrTown':           'petitioner.jobs[0].city',
  'Pt1Line18_State':                'petitioner.jobs[0].state',
  'Pt1Line18_ZipCode':              'petitioner.jobs[0].zip',
  'Pt1Line18_Province':             'petitioner.jobs[0].province',
  'Pt1Line18_PostalCode':           'petitioner.jobs[0].postalCode',
  'Pt1Line18_Country':              'petitioner.jobs[0].country',

  // Employment history (job #2)
  'Pt1Line17_NameofEmployer':       'petitioner.jobs[1].employer',
  'Pt1Line19_Occupation':           'petitioner.jobs[1].occupation',
  'Pt1Line20a_DateFrom':            'petitioner.jobs[1].dateFrom',
  'Pt1Line20b_ToFrom':              'petitioner.jobs[1].dateTo',

  // --- Part 2: Beneficiary IDs, names, addresses ---
  'Pt2Line1a_FamilyName':           'beneficiary.name.last',
  'Pt2Line1b_GivenName':            'beneficiary.name.first',
  'Pt2Line1c_MiddleName':           'beneficiary.name.middle',
  'Pt2Line2_AlienNumber':           'beneficiary.aNumber',
  'Pt2Line3_SSN':                   'beneficiary.ssn',
  'Pt2Line4_DateOfBirth':           'beneficiary.dob',
  'Pt2Line7_CityTownOfBirth':       'beneficiary.birth.city',
  'Pt2Line8_CountryOfBirth':        'beneficiary.birth.country',
  'Pt2Line9_CountryofCitzOrNationality': 'beneficiary.citizenship',

  // Beneficiary mailing + physical
  'Pt2Line11_InCareOfName':         'beneficiary.mailing.inCareOf',
  'Pt2Line11_StreetNumberName':     'beneficiary.mailing.street',
  'Pt2Line11_AptSteFlrNumber':      'beneficiary.mailing.unitNumber',
  'Pt2Line11_CityOrTown':           'beneficiary.mailing.city',
  'Pt2Line11_State':                'beneficiary.mailing.state',
  'Pt2Line11_ZipCode':              'beneficiary.mailing.zip',
  'Pt2Line11_Province':             'beneficiary.mailing.province',
  'Pt2Line11_PostalCode':           'beneficiary.mailing.postalCode',
  'Pt2Line11_Country':              'beneficiary.mailing.country',

  'Pt2Line14_StreetNumberName':     'beneficiary.physical.street',
  'Pt2Line14_AptSteFlrNumber':      'beneficiary.physical.unitNumber',
  'Pt2Line14_CityOrTown':           'beneficiary.physical.city',
  'Pt2Line14_State':                'beneficiary.physical.state',
  'Pt2Line14_ZipCode':              'beneficiary.physical.zip',
  'Pt2Line14_Province':             'beneficiary.physical.province',
  'Pt2Line14_PostalCode':           'beneficiary.physical.postalCode',
  'Pt2Line14_Country':              'beneficiary.physical.country',

  // Beneficiary employment (job #1)
  'Pt2Line16_NameofEmployer':       'beneficiary.jobs[0].employer',
  'Pt2Line18_Occupation':           'beneficiary.jobs[0].occupation',
  'Pt2Line19a_DateFrom':            'beneficiary.jobs[0].dateFrom',
  'Pt2Line19b_ToFrom':              'beneficiary.jobs[0].dateTo',
  'Pt2Line17_StreetNumberName':     'beneficiary.jobs[0].street',
  'Pt2Line17_AptSteFlrNumber':      'beneficiary.jobs[0].unitNumber',
  'Pt2Line17_CityOrTown':           'beneficiary.jobs[0].city',
  'Pt2Line17_State':                'beneficiary.jobs[0].state',
  'Pt2Line17_ZipCode':              'beneficiary.jobs[0].zip',
  'Pt2Line17_Province':             'beneficiary.jobs[0].province',
  'Pt2Line17_PostalCode':           'beneficiary.jobs[0].postalCode',
  'Pt2Line17_Country':              'beneficiary.jobs[0].country',

  // Beneficiary employment (job #2)
  'Pt2Line20_NameofEmployer':       'beneficiary.jobs[1].employer',
  'Pt2Line21_StreetNumberName':     'beneficiary.jobs[1].street',
  'Pt2Line21_AptSteFlrNumber':      'beneficiary.jobs[1].unitNumber',
  'Pt2Line21_CityOrTown':           'beneficiary.jobs[1].city',
  'Pt2Line21_State':                'beneficiary.jobs[1].state',
  'Pt2Line21_ZipCode':              'beneficiary.jobs[1].zip',
  'Pt2Line21_Province':             'beneficiary.jobs[1].province',
  'Pt2Line21_PostalCode':           'beneficiary.jobs[1].postalCode',
  'Pt2Line21_Country':              'beneficiary.jobs[1].country',
  'Pt2Line22_Occupation':           'beneficiary.jobs[1].occupation',
  'Pt2Line23a_DateFrom':            'beneficiary.jobs[1].dateFrom',
  'Pt2Line23b_ToFrom':              'beneficiary.jobs[1].dateTo',

  // Beneficiary parent names (example)
  'Pt2Line29a_FamilyName':          'beneficiary.parents[0].last',
  'Pt2Line29b_GivenName':           'beneficiary.parents[0].first',
  'Pt2Line29c_MiddleName':          'beneficiary.parents[0].middle',
  'Pt2Line30_DateofBirth':          'beneficiary.parents[0].dob',
  'Pt2Line31_Checkbox_p5_ch2':      'beneficiary.parents[0].deceased', // checkbox handled below if boolean
  'Pt2Line32_CountryOfCitzOrNationality': 'beneficiary.parents[0].citizenship',
  'Pt2Line33a_CityTownOfBirth':     'beneficiary.parents[0].birth.city',
  'Pt2Line33b_CountryOfCitzOrNationality': 'beneficiary.parents[0].birth.country',

  // Travel / passport
  'Pt2Line38a_LastArrivedAs':       'beneficiary.travel.arrivedAs',
  'Pt2Line38b_ArrivalDeparture':    'beneficiary.travel.i94',
  'Pt2Line38c_DateofArrival':       'beneficiary.travel.dateArrival',
  'Pt2Line38d_DateExpired':         'beneficiary.travel.dateExpiry',
  'Pt2Line38e_Passport':            'beneficiary.travel.passportNumber',
  'Pt2Line38f_TravelDoc':           'beneficiary.travel.travelDocNumber',
  'Pt2Line38g_CountryOfIssuance':   'beneficiary.travel.passportCountry',
  'Pt2Line38h_ExpDate':             'beneficiary.travel.passportExp',

  // Contacts (Part 5 / Part 6 / Part 7)
  'Pt5Line1_DaytimePhoneNumber1':   'petitioner.contact.dayPhone',
  'Pt5Line2_MobileNumber1':         'petitioner.contact.mobile',
  'Pt5Line3_Email':                 'petitioner.contact.email',
  'Pt5Line4_DateOfSignature':       'petitioner.signature.date',

  'Pt6Line1_InterpreterFamilyName': 'interpreter.name.last',
  'Pt6Line1_InterpreterGivenName':  'interpreter.name.first',
  'Pt6Line2_NameofBusinessorOrgName': 'interpreter.business',
  'Pt6_NameOfLanguage':             'interpreter.language',
  'Pt6Line4_InterpreterDaytimeTelephone_p9_n1': 'interpreter.phone.area',
  'Pt6Line4_InterpreterDaytimeTelephone_p9_n2': 'interpreter.phone.number',
  'Pt6Line5_Email':                 'interpreter.email',
  'Pt6Line6_DateofSignature':       'interpreter.signatureDate',

  'Pt7Line1_PreparerFamilyName':    'preparer.name.last',
  'Pt7Line1b_PreparerGivenName':    'preparer.name.first',
  'Pt7Line2_NameofBusinessorOrgName': 'preparer.business',
  'Pt7Line3_DaytimePhoneNumber1':   'preparer.dayPhone',
  'Pt7Line4_PreparerMobileNumber':  'preparer.mobile',
  'Pt7Line5_Email':                 'preparer.email',
  'Pt7Line6_DateofSignature':       'preparer.signatureDate',

  // Additional information (Part 8 index 1 example)
  'Pt8Line1a_FamilyNameLastName':   'additional[0].name.last',
  'Pt8Line1b_GivenNameFirstName':   'additional[0].name.first',
  'Pt8Line1c_MiddleName':           'additional[0].name.middle',
  'Pt8Line2_ANumber':               'additional[0].aNumber',

  // Add more lines similarly as you expand the wizard data structure...
};

//
// 2) CHECKBOXES / yes-no toggles
//    - value can be boolean path ("path.to.bool") or an expression object:
//        { path: 'relationship.classification', equals: 'K1' }
//
export const MAPPING_CHECK = [
  // Classification: K-1 (Fiancé)
  { field: 'Pt1Line4a_Checkboxes_p0_ch2', path: 'relationship.classification', equals: 'K1' },

  // If you filed I-130 for K-3 spouse
  { field: 'Pt1Line5_Checkboxes_p0_ch2', path: 'relationship.i130Filed' },

  // Mailing = physical address?
  { field: 'Pt1Line8j_Checkboxes_p0_ch2', path: 'petitioner.mailingSameAsPhysical' },

  // Example: parent deceased flag
  { field: 'Pt2Line31_Checkbox_p5_ch2', path: 'beneficiary.parents[0].deceased' },

  // Race (Part 4) – set multiple true as applicable
  { field: 'Pt4Line2_Checkbox_p8_White', path: 'beneficiary.traits.race.white' },
  { field: 'Pt4Line2_Checkbox_p8_Asian', path: 'beneficiary.traits.race.asian' },
  { field: 'Pt4Line2_Checkbox_p8_BlackOrAfricanAmerrican', path: 'beneficiary.traits.race.black' },
  { field: 'Pt4Line2_Checkbox_p8_AmericanIndianOrAlaskaNative', path: 'beneficiary.traits.race.nativeAmerican' },
  { field: 'Pt4Line2_Checkbox_p8_NativeHawaiianOrPacificIslander', path: 'beneficiary.traits.race.pacificIslander' },

  // Hair color example (you can also map a text field Pt3Line4b_AdditionalInformation with the color name if you prefer)
  // { field: 'Part3Line4a_HairColorCheckboxes_p8_ch2', path: 'beneficiary.traits.hair.blond' },

  // Add more checkboxes as you confirm what each *_ch# represents on the form.
];

//
// 3) ENUM / “unit type” style (Apt/Ste/Flr) — OPTIONAL if your form uses a checkbox for unit type.
//    We don’t know which ch# is Apt/Ste/Flr in your file. If you confirm the mapping,
//    fill these three with the proper field names.
//
export const UNIT_TYPE_CHECKS_PETITIONER_MAILING = {
  // apt:  'Pt1Line8_Unit_p0_ch1',
  // ste:  'Pt1Line8_Unit_p0_ch2',
  // flr:  'Pt1Line8_Unit_p0_ch3',
};

export const UNIT_TYPE_CHECKS_PETITIONER_PHYSICAL = {
  // apt:  'Pt1Line9_Unit_p1_ch1',
  // ste:  'Pt1Line9_Unit_p1_ch2',
  // flr:  'Pt1Line9_Unit_p1_ch3',
};

export const UNIT_TYPE_CHECKS_BENEFICIARY_MAILING = {
  // apt:  'Pt2Line11_Unit_p4_ch1',
  // ste:  'Pt2Line11_Unit_p4_ch2',
  // flr:  'Pt2Line11_Unit_p4_ch3',
};

export const UNIT_TYPE_CHECKS_BENEFICIARY_PHYSICAL = {
  // apt:  'Pt2Line14_Unit_p4_ch1',
  // ste:  'Pt2Line14_Unit_p4_ch2',
  // flr:  'Pt2Line14_Unit_p4_ch3',
};
