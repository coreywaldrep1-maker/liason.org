// lib/i129f-schema.js
// Master schema for the I-129F: labels, help text, UI types, and PDF field names.
// Replace each `pdf: '...'` with your actual AcroForm field names.

export const DEFAULT_LANG = 'en'; // used elsewhere already

export const I129F = {
  edition: 'I-129F',
  sections: [
    // ================================
    // PART 1 — About YOU (Petitioner)
    // ================================
    {
      id: 'part1',
      title: 'Part 1 — About You (Petitioner)',
      short: 'Your details, classification (K-1/K-3), and addresses.',
      groups: [
        {
          id: 'id-and-class',
          title: 'Numbers & classification',
          help: 'If a number doesn’t apply to you, leave it blank.',
          fields: [
            {
              key: 'petitioner.a_number',
              label: 'Alien Registration Number (A-Number) (if any)',
              type: 'text',
              maxLength: 9,
              help: 'USCIS ID if you have one (starts with “A”).',
              pdf: 'P1_A_Number'
            },
            {
              key: 'petitioner.uscis_account',
              label: 'USCIS Online Account Number (if any)',
              type: 'text',
              help: 'Only if you created a USCIS online account before.',
              pdf: 'P1_USCIS_Online_Account'
            },
            {
              key: 'petitioner.ssn',
              label: 'U.S. Social Security Number (if any)',
              type: 'text',
              help: 'Enter your SSN if you have one.',
              pdf: 'P1_SSN'
            },
            {
              key: 'classification',
              label: 'Classification requested for the beneficiary',
              type: 'radio',
              options: [
                { value: 'k1', label: 'Fiancé(e) (K-1)' },
                { value: 'k3', label: 'Spouse (K-3)' }
              ],
              help: 'Pick K-1 if not yet married; K-3 if already married.',
              // For checkboxes/radios: map each option to its PDF field
              pdf: { k1: 'P1_Class_K1', k3: 'P1_Class_K3' }
            },
            {
              key: 'i130_filed',
              label: 'If K-3: Have you filed Form I-130?',
              type: 'radio',
              options: [
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ],
              showIf: { classification: 'k3' },
              help: 'K-3 classification is linked to an I-130 for your spouse.',
              pdf: { yes: 'P1_I130_Yes', no: 'P1_I130_No' }
            }
          ]
        },
        {
          id: 'legal-name',
          title: 'Your legal name',
          help: 'Use your current legal name exactly as on government ID.',
          fields: [
            {
              key: 'petitioner.name.family',
              label: 'Family Name (Last Name)',
              type: 'text',
              help: 'Your legal last name.',
              pdf: 'P1_Petitioner_Last'
            },
            {
              key: 'petitioner.name.given',
              label: 'Given Name (First Name)',
              type: 'text',
              help: 'Your legal first name.',
              pdf: 'P1_Petitioner_First'
            },
            {
              key: 'petitioner.name.middle',
              label: 'Middle Name',
              type: 'text',
              help: 'Leave blank if you don’t have one.',
              pdf: 'P1_Petitioner_Middle'
            }
          ]
        },
        {
          id: 'other-names',
          title: 'Other names used',
          help:
            'List all other names you have used (aliases, maiden, nicknames). Add rows as needed.',
          repeat: { min: 0, max: 5 }, // UI can show an "Add another" row
          itemFields: [
            {
              key: 'family',
              label: 'Family Name (Last)',
              type: 'text',
              pdf: 'P1_OtherName_{i}_Last'
            },
            {
              key: 'given',
              label: 'Given Name (First)',
              type: 'text',
              pdf: 'P1_OtherName_{i}_First'
            },
            {
              key: 'middle',
              label: 'Middle Name',
              type: 'text',
              pdf: 'P1_OtherName_{i}_Middle'
            }
          ]
        },
        {
          id: 'mailing',
          title: 'Your mailing address',
          help:
            'Where USCIS should mail notices. If different than physical, uncheck and fill your physical address next.',
          fields: [
            {
              key: 'petitioner.mailing.in_care_of',
              label: 'In Care Of Name',
              type: 'text',
              help: 'Leave blank unless mail is addressed to someone else.',
              pdf: 'P1_Mail_InCareOf'
            },
            {
              key: 'petitioner.mailing.street',
              label: 'Street Number and Name',
              type: 'text',
              pdf: 'P1_Mail_Street'
            },
            {
              key: 'petitioner.mailing.unit_type',
              label: 'Unit Type',
              type: 'select',
              options: [
                { value: '', label: '—' },
                { value: 'Apt', label: 'Apt' },
                { value: 'Ste', label: 'Ste' },
                { value: 'Flr', label: 'Flr' }
              ],
              pdf: { Apt: 'P1_Mail_Unit_Apt', Ste: 'P1_Mail_Unit_Ste', Flr: 'P1_Mail_Unit_Flr' }
            },
            {
              key: 'petitioner.mailing.unit_number',
              label: 'Unit Number',
              type: 'text',
              pdf: 'P1_Mail_Unit_Number'
            },
            {
              key: 'petitioner.mailing.city',
              label: 'City or Town',
              type: 'text',
              pdf: 'P1_Mail_City'
            },
            {
              key: 'petitioner.mailing.state',
              label: 'State',
              type: 'state',
              pdf: 'P1_Mail_State'
            },
            {
              key: 'petitioner.mailing.zip',
              label: 'ZIP Code',
              type: 'text',
              pdf: 'P1_Mail_Zip'
            },
            {
              key: 'petitioner.mailing.province',
              label: 'Province (if outside U.S.)',
              type: 'text',
              pdf: 'P1_Mail_Province'
            },
            {
              key: 'petitioner.mailing.postal',
              label: 'Postal Code',
              type: 'text',
              pdf: 'P1_Mail_Postal'
            },
            {
              key: 'petitioner.mailing.country',
              label: 'Country',
              type: 'country',
              pdf: 'P1_Mail_Country'
            },
            {
              key: 'mail_same_as_physical',
              label: 'Mailing address is the same as physical address',
              type: 'radio',
              options: [
                { value: true, label: 'Yes' },
                { value: false, label: 'No' }
              ],
              pdf: { true: 'P1_MailSame_Yes', false: 'P1_MailSame_No' }
            }
          ]
        },
        {
          id: 'physical',
          title: 'Your physical address',
          showIf: { mail_same_as_physical: false },
          help: 'Where you actually live now.',
          fields: [
            { key: 'petitioner.physical.street', label: 'Street Number and Name', type: 'text', pdf: 'P1_Phys_Street' },
            { key: 'petitioner.physical.unit_type', label: 'Unit Type', type: 'select',
              options: [{value:'',label:'—'},{value:'Apt',label:'Apt'},{value:'Ste',label:'Ste'},{value:'Flr',label:'Flr'}],
              pdf: { Apt:'P1_Phys_Unit_Apt', Ste:'P1_Phys_Unit_Ste', Flr:'P1_Phys_Unit_Flr' }
            },
            { key: 'petitioner.physical.unit_number', label: 'Unit Number', type: 'text', pdf: 'P1_Phys_Unit_Number' },
            { key: 'petitioner.physical.city', label: 'City or Town', type: 'text', pdf: 'P1_Phys_City' },
            { key: 'petitioner.physical.state', label: 'State', type: 'state', pdf: 'P1_Phys_State' },
            { key: 'petitioner.physical.zip', label: 'ZIP Code', type: 'text', pdf: 'P1_Phys_Zip' },
            { key: 'petitioner.physical.province', label: 'Province (if outside U.S.)', type: 'text', pdf: 'P1_Phys_Province' },
            { key: 'petitioner.physical.postal', label: 'Postal Code', type: 'text', pdf: 'P1_Phys_Postal' },
            { key: 'petitioner.physical.country', label: 'Country', type: 'country', pdf: 'P1_Phys_Country' }
          ]
        },
        {
          id: 'demographics',
          title: 'Date & Place of birth',
          help: 'Match your birth document.',
          fields: [
            { key: 'petitioner.dob', label: 'Date of Birth', type: 'date', pdf: 'P1_DOB' },
            { key: 'petitioner.birth_city', label: 'City/Town/Village of Birth', type: 'text', pdf: 'P1_BirthCity' },
            { key: 'petitioner.birth_state', label: 'State/Province', type: 'text', pdf: 'P1_BirthState' },
            { key: 'petitioner.birth_country', label: 'Country of Birth', type: 'country', pdf: 'P1_BirthCountry' }
          ]
        },
        {
          id: 'contact',
          title: 'Contact information',
          help: 'Use the best email/phone for USCIS notices or questions.',
          fields: [
            { key: 'petitioner.phone_day', label: 'Daytime Telephone Number', type: 'tel', pdf: 'P1_PhoneDay' },
            { key: 'petitioner.phone_mobile', label: 'Mobile Telephone Number', type: 'tel', pdf: 'P1_PhoneMobile' },
            { key: 'petitioner.email', label: 'Email Address', type: 'email', pdf: 'P1_Email' }
          ]
        },
        {
          id: 'citizenship',
          title: 'Citizenship/immigration',
          help: 'This form is for U.S. citizens petitioning for a fiancé(e)/spouse.',
          fields: [
            { key: 'petitioner.us_citizen', label: 'Are you a U.S. citizen?', type: 'radio',
              options:[{value:true,label:'Yes'},{value:false,label:'No'}],
              pdf: { true:'P1_USCitizen_Yes', false:'P1_USCitizen_No' }
            },
            { key: 'petitioner.citizenship_acquired', label: 'How did you acquire citizenship?', type: 'select',
              options:[{value:'birth',label:'By birth in the U.S.'},{value:'naturalization',label:'Naturalization'},{value:'parents',label:'Through U.S. citizen parent(s)'}],
              showIf:{ 'petitioner.us_citizen': true },
              pdf:{ birth:'P1_Cit_Birth', naturalization:'P1_Cit_Natz', parents:'P1_Cit_Parents' }
            },
            { key: 'petitioner.natz_cert_number', label: 'Naturalization/Certificate Number (if applicable)', type: 'text',
              showIf:{ 'petitioner.citizenship_acquired':'naturalization' },
              pdf: 'P1_NatzCertNo'
            }
          ]
        }
        // You can continue Part 1 with prior marriages, employment, etc., if your edition includes them.
      ]
    },

    // =======================================
    // PART 2 — Information About Beneficiary
    // =======================================
    {
      id: 'part2',
      title: 'Part 2 — Information About Your Beneficiary',
      short: 'Beneficiary’s identity, addresses, and background.',
      groups: [
        {
          id: 'bene-name',
          title: 'Beneficiary name',
          fields: [
            { key:'bene.name.family', label:'Family Name (Last)', type:'text', help:'As on passport/birth doc.', pdf:'P2_Bene_Last' },
            { key:'bene.name.given',  label:'Given Name (First)', type:'text', pdf:'P2_Bene_First' },
            { key:'bene.name.middle', label:'Middle Name', type:'text', pdf:'P2_Bene_Middle' }
          ]
        },
        {
          id: 'bene-other-names',
          title: 'Other names used by beneficiary',
          help: 'Aliases, maiden names, nicknames.',
          repeat: { min:0, max:5 },
          itemFields: [
            { key:'family', label:'Family Name', type:'text', pdf:'P2_Bene_Other_{i}_Last' },
            { key:'given',  label:'Given Name',  type:'text', pdf:'P2_Bene_Other_{i}_First' },
            { key:'middle', label:'Middle Name', type:'text', pdf:'P2_Bene_Other_{i}_Middle' }
          ]
        },
        {
          id: 'bene-birth',
          title: 'Date & place of birth',
          fields: [
            { key:'bene.dob', label:'Date of Birth', type:'date', pdf:'P2_Bene_DOB' },
            { key:'bene.birth_city', label:'City/Town/Village of Birth', type:'text', pdf:'P2_Bene_BirthCity' },
            { key:'bene.birth_state', label:'State/Province', type:'text', pdf:'P2_Bene_BirthState' },
            { key:'bene.birth_country', label:'Country of Birth', type:'country', pdf:'P2_Bene_BirthCountry' }
          ]
        },
        {
          id: 'bene-numbers',
          title: 'Numbers (if any)',
          help: 'Leave blank if the beneficiary does not have these.',
          fields: [
            { key:'bene.a_number', label:'Alien Registration Number (A-Number)', type:'text', pdf:'P2_Bene_ANumber' },
            { key:'bene.uscis_account', label:'USCIS Online Account Number', type:'text', pdf:'P2_Bene_USCIS_Online' },
            { key:'bene.ssn', label:'U.S. Social Security Number', type:'text', pdf:'P2_Bene_SSN' }
          ]
        },
        {
          id: 'bene-address',
          title: 'Beneficiary address',
          help: 'Current physical or mailing address of beneficiary.',
          fields: [
            { key:'bene.addr.street', label:'Street Number and Name', type:'text', pdf:'P2_Bene_Street' },
            { key:'bene.addr.unit_type', label:'Unit Type', type:'select',
              options:[{value:'',label:'—'},{value:'Apt',label:'Apt'},{value:'Ste',label:'Ste'},{value:'Flr',label:'Flr'}],
              pdf:{ Apt:'P2_Bene_Unit_Apt', Ste:'P2_Bene_Unit_Ste', Flr:'P2_Bene_Unit_Flr' }
            },
            { key:'bene.addr.unit_number', label:'Unit Number', type:'text', pdf:'P2_Bene_Unit_Number' },
            { key:'bene.addr.city', label:'City or Town', type:'text', pdf:'P2_Bene_City' },
            { key:'bene.addr.state', label:'State/Province', type:'text', pdf:'P2_Bene_State' },
            { key:'bene.addr.postal', label:'ZIP/Postal Code', type:'text', pdf:'P2_Bene_Postal' },
            { key:'bene.addr.country', label:'Country', type:'country', pdf:'P2_Bene_Country' }
          ]
        },
        {
          id: 'bene-passport',
          title: 'Passport/travel document',
          help: 'If available, enter beneficiary’s passport details.',
          fields: [
            { key:'bene.passport_number', label:'Passport Number', type:'text', pdf:'P2_Bene_PassportNo' },
            { key:'bene.passport_country', label:'Country of Issuance', type:'country', pdf:'P2_Bene_PassportCountry' },
            { key:'bene.passport_expiry', label:'Passport Expiration Date', type:'date', pdf:'P2_Bene_PassportExpiry' }
          ]
        },
        {
          id: 'bene-children',
          title: 'Children of beneficiary (K-2)',
          help: 'List each child for possible K-2 classification.',
          repeat: { min: 0, max: 5 },
          itemFields: [
            { key:'name', label:'Child’s Full Name', type:'text', pdf:'P2_Child_{i}_Name' },
            { key:'dob',  label:'Date of Birth', type:'date', pdf:'P2_Child_{i}_DOB' },
            { key:'country', label:'Country of Birth', type:'country', pdf:'P2_Child_{i}_BirthCountry' }
          ]
        }
      ]
    },

    // ==================================================
    // PART 3 — Additional/Background (edition-dependent)
    // ==================================================
    {
      id: 'part3',
      title: 'Part 3 — Other Information',
      short: 'Meeting requirement (K-1), prior filings, IMBRA, etc.',
      groups: [
        {
          id: 'meeting',
          title: 'In-person meeting (K-1)',
          help: 'You must have met in person within 2 years (unless exempt).',
          fields: [
            { key:'met_within_two_years', label:'Met the beneficiary in person within 2 years?', type:'radio',
              options:[{value:true,label:'Yes'},{value:false,label:'No (requesting waiver)'}],
              pdf:{ true:'P3_Met_Yes', false:'P3_Met_No' }
            },
            { key:'meeting_explain', label:'If no, explain waiver request', type:'textarea',
              showIf:{ met_within_two_years:false }, pdf:'P3_Meeting_WaiverExplain' }
          ]
        },
        {
          id: 'prior-filings',
          title: 'Prior filings & IMBRA',
          help: 'List prior I-129F filings and any IMBRA-related disclosures.',
          fields: [
            { key:'prior_i129f_filings', label:'Number of prior I-129F filings', type:'number', min:0, pdf:'P3_PriorFilings_Count' },
            { key:'imbra_disclosures', label:'IMBRA disclosures (if any)', type:'textarea', pdf:'P3_IMBRA_Disclosures' }
          ]
        }
      ]
    },

    // ===========================================================
    // PART 4 — Contact, Declarations, Interpreter, Preparer, etc.
    // ===========================================================
    {
      id: 'part4',
      title: 'Part 4 — Petitioner Contact & Declaration',
      short: 'How USCIS can contact you and who prepared this form.',
      groups: [
        {
          id: 'petitioner-contact',
          title: 'Petitioner contact',
          fields: [
            { key:'petitioner.contact.day_phone', label:'Daytime Phone', type:'tel', pdf:'P4_PhoneDay' },
            { key:'petitioner.contact.mobile', label:'Mobile Phone', type:'tel', pdf:'P4_PhoneMobile' },
            { key:'petitioner.contact.email', label:'Email', type:'email', pdf:'P4_Email' }
          ]
        },
        {
          id: 'declaration',
          title: 'Declaration and signature',
          help: 'Read the declaration. You sign and date after reviewing your packet.',
          fields: [
            { key:'petitioner.read_english', label:'I can read and understand English', type:'checkbox', pdf:'P4_ReadEnglish' },
            { key:'petitioner.used_interpreter', label:'I used an interpreter', type:'checkbox', pdf:'P4_UsedInterpreter' },
            { key:'petitioner.signature_date', label:'Date of Signature', type:'date', pdf:'P4_SignDate' }
            // Note: Handwritten/typed signature boxes may be unfillable; we keep date and flags.
          ]
        },
        {
          id: 'interpreter',
          title: 'Interpreter (if used)',
          showIf: { 'petitioner.used_interpreter': true },
          fields: [
            { key:'interp.name', label:'Interpreter Name', type:'text', pdf:'P4_Interp_Name' },
            { key:'interp.addr', label:'Interpreter Address', type:'text', pdf:'P4_Interp_Address' },
            { key:'interp.lang', label:'Interpreter Language', type:'text', pdf:'P4_Interp_Language' }
          ]
        },
        {
          id: 'preparer',
          title: 'Preparer (if any)',
          fields: [
            { key:'prep.is_preparer', label:'Did someone else prepare this form?', type:'radio',
              options:[{value:true,label:'Yes'},{value:false,label:'No'}],
              pdf:{ true:'P4_Preparer_Yes', false:'P4_Preparer_No' } },
            { key:'prep.name', label:'Preparer Name', type:'text', showIf:{ 'prep.is_preparer': true }, pdf:'P4_Preparer_Name' },
            { key:'prep.address', label:'Preparer Address', type:'text', showIf:{ 'prep.is_preparer': true }, pdf:'P4_Preparer_Address' }
          ]
        }
      ]
    }

    // Part 5 — Additional Information pages are usually free-text; your wizard can export to those pages as needed.
  ]
};
