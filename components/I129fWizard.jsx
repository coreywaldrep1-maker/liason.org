// components/I129fWizard.jsx
'use client';

import { useEffect, useMemo, useRef, useState, createContext, useContext } from 'react';

/* ---------- Sections ---------- */
const SECTIONS = [
  { key: 'p1', label: 'Part 1 — Petitioner (You)' },
  { key: 'p2', label: 'Part 2 — Beneficiary (Partner)' },
  { key: 'p3', label: 'Part 3 — Other Info' },
  { key: 'p4', label: 'Part 4 — Petitioners Statement' },
  { key: 'p5', label: 'Part 5 — Contact Info' },
  { key: 'p6', label: 'Part 6 — Interpreter' },
  { key: 'p7', label: 'Part 7 — Preparer' },
  { key: 'p8', label: 'Part 8 — Additional Info' },
];

/* ---------- Local storage key ---------- */
const STORAGE_KEY = 'i129fWizardDraft_v1';

/* ---------- Helpers ---------- */
const isBrowser = () => typeof window !== 'undefined';

function deepGet(obj, path, fallback = '') {
  try {
    const parts = path.split('.');
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

function deepSet(obj, path, value) {
  const parts = path.split('.');
  const out = { ...(obj || {}) };
  let cur = out;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    cur[k] = { ...(cur[k] || {}) };
    cur = cur[k];
  }
  cur[parts[parts.length - 1]] = value;
  return out;
}

function normalizeYesNo(value) {
  const v = (value ?? '').toString().trim().toLowerCase();
  if (v === 'yes' || v === 'y' || v === 'true' || v === '1') return 'yes';
  if (v === 'no' || v === 'n' || v === 'false' || v === '0') return 'no';
  return '';
}

function clampNumberString(raw, min, max) {
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) return '';
  if (n < min) return String(min);
  if (n > max) return String(max);
  return String(n);
}

/* ---------- Wizard Context ---------- */
const WizardCtx = createContext(null);

function useWizard() {
  const ctx = useContext(WizardCtx);
  if (!ctx) throw new Error('I129fWizard must be used within WizardCtx provider');
  return ctx;
}

/* ---------- Input Components ---------- */
function Field({ label, hint, children }) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline gap-2">
        <div className="font-medium text-sm">{label}</div>
        {hint ? <div className="text-xs text-gray-500">{hint}</div> : null}
      </div>
      {children}
    </div>
  );
}

function TextInput({ path, placeholder = '', type = 'text', maxLength, inputMode }) {
  const { data, setData } = useWizard();
  const value = deepGet(data, path, '');

  return (
    <input
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
      value={value}
      placeholder={placeholder}
      type={type}
      maxLength={maxLength}
      inputMode={inputMode}
      onChange={(e) => setData((prev) => deepSet(prev, path, e.target.value))}
    />
  );
}

function Select({ path, options, placeholder = 'Select…' }) {
  const { data, setData } = useWizard();
  const value = deepGet(data, path, '');

  return (
    <select
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 bg-white"
      value={value}
      onChange={(e) => setData((prev) => deepSet(prev, path, e.target.value))}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Checkbox({ path, label }) {
  const { data, setData } = useWizard();
  const value = !!deepGet(data, path, false);

  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => setData((prev) => deepSet(prev, path, e.target.checked))}
      />
      <span>{label}</span>
    </label>
  );
}

function DateInput({ path, placeholder = 'YYYY-MM-DD' }) {
  const { data, setData } = useWizard();
  const value = deepGet(data, path, '');

  return (
    <input
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
      value={value}
      placeholder={placeholder}
      type="date"
      onChange={(e) => setData((prev) => deepSet(prev, path, e.target.value))}
    />
  );
}

/* ---------- Layout Components ---------- */
function Stepper({ currentKey, onJump }) {
  return (
    <div className="flex flex-col gap-1">
      {SECTIONS.map((s) => (
        <button
          key={s.key}
          type="button"
          onClick={() => onJump(s.key)}
          className={[
            'text-left rounded-lg px-3 py-2 text-sm transition',
            currentKey === s.key ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200',
          ].join(' ')}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-base font-semibold">{title}</div>
      <div className="mt-3 space-y-4">{children}</div>
    </div>
  );
}

function Grid2({ children }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

function Divider() {
  return <div className="h-px bg-gray-200" />;
}

/* ---------- Default data ---------- */
const DEFAULT_DATA = {
  meta: {
    version: 1,
  },
  petitioner: {
    name: {
      family: '',
      given: '',
      middle: '',
    },
    otherNamesUsed: {
      hasOtherNames: '',
      family: '',
      given: '',
      middle: '',
    },
    mailingAddress: {
      inCareOf: '',
      streetNumberName: '',
      aptSteFlr: '',
      cityOrTown: '',
      state: '',
      zip: '',
      province: '',
      postalCode: '',
      country: '',
    },
    physicalAddress: {
      sameAsMailing: true,
      streetNumberName: '',
      aptSteFlr: '',
      cityOrTown: '',
      state: '',
      zip: '',
      province: '',
      postalCode: '',
      country: '',
    },
    contact: {
      daytimePhone: '',
      mobilePhone: '',
      email: '',
    },
    citizenship: {
      usCitizen: '',
      naturalizationCertificateNumber: '',
      placeOfBirthCity: '',
      placeOfBirthState: '',
      placeOfBirthCountry: '',
      dateOfBirth: '',
      gender: '',
      ssn: '',
      alienNumber: '',
    },
  },
  beneficiary: {
    name: {
      family: '',
      given: '',
      middle: '',
    },
    otherNamesUsed: {
      hasOtherNames: '',
      family: '',
      given: '',
      middle: '',
    },
    mailingAddress: {
      streetNumberName: '',
      aptSteFlr: '',
      cityOrTown: '',
      stateProvince: '',
      postalCode: '',
      country: '',
    },
    physicalAddress: {
      sameAsMailing: true,
      streetNumberName: '',
      aptSteFlr: '',
      cityOrTown: '',
      stateProvince: '',
      postalCode: '',
      country: '',
    },
    info: {
      alienNumber: '',
      ssn: '',
      dateOfBirth: '',
      placeOfBirthCity: '',
      placeOfBirthStateProvince: '',
      placeOfBirthCountry: '',
      gender: '',
      maritalStatus: '',
      citizenshipCountry: '',
      passportNumber: '',
      travelDocumentNumber: '',
      passportExp: '',
      passportCountry: '',
      // Page 9 Biographic
      ethnicityHispanic: '', // yes|no
      race: '', // white|asian|black|nhopi
      heightFeet: '',
      heightInches: '',
      weightLbs: '',
      eyeColor: '',
      hairColor: '',
    },
    parents: {
      father: { family: '', given: '', middle: '' },
      mother: { family: '', given: '', middle: '' },
    },
  },
  otherInfo: {
    metInPersonWithin2Years: '',
    metInPersonExplain: '',
    intentToMarry: '',
    intentToMarryExplain: '',
    priorPetitions: {
      hasFiledBefore: '',
      explain: '',
    },
  },
  petitionerStatement: {
    canReadEnglish: '',
    usedInterpreter: '',
    usedPreparer: '',
  },
  contactInfo: {
    daytimePhone: '',
    mobilePhone: '',
    email: '',
  },
  interpreter: {
    used: '',
    family: '',
    given: '',
    businessOrOrg: '',
    street: '',
    aptSteFlr: '',
    city: '',
    state: '',
    zip: '',
    province: '',
    postalCode: '',
    country: '',
    phone: '',
    email: '',
    language: '',
  },
  preparer: {
    used: '',
    isAttorney: '',
    family: '',
    given: '',
    businessOrOrg: '',
    street: '',
    aptSteFlr: '',
    city: '',
    state: '',
    zip: '',
    province: '',
    postalCode: '',
    country: '',
    phone: '',
    email: '',
    firmName: '',
    barNumber: '',
  },
  additionalInfo: {
    entries: [{ page: '', part: '', itemNumber: '', explanation: '' }],
  },
};

/* ---------- Main Component ---------- */
export default function I129fWizard() {
  const [active, setActive] = useState('p1');
  const [data, setData] = useState(DEFAULT_DATA);
  const didLoad = useRef(false);

  // Load from localStorage
  useEffect(() => {
    if (!isBrowser()) return;
    if (didLoad.current) return;
    didLoad.current = true;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setData((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isBrowser()) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  }, [data]);

  const ctx = useMemo(() => ({ data, setData }), [data]);

  const onNext = () => {
    const idx = SECTIONS.findIndex((s) => s.key === active);
    if (idx >= 0 && idx < SECTIONS.length - 1) setActive(SECTIONS[idx + 1].key);
  };

  const onPrev = () => {
    const idx = SECTIONS.findIndex((s) => s.key === active);
    if (idx > 0) setActive(SECTIONS[idx - 1].key);
  };

  const onReset = () => {
    if (!isBrowser()) return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setData(DEFAULT_DATA);
    setActive('p1');
  };

  const Current = useMemo(() => {
    switch (active) {
      case 'p1':
        return Part1Petitioner;
      case 'p2':
        return Part2Beneficiary;
      case 'p3':
        return Part3OtherInfo;
      case 'p4':
        return Part4PetitionerStatement;
      case 'p5':
        return Part5ContactInfo;
      case 'p6':
        return Part6Interpreter;
      case 'p7':
        return Part7Preparer;
      case 'p8':
        return Part8AdditionalInfo;
      default:
        return Part1Petitioner;
    }
  }, [active]);

  return (
    <WizardCtx.Provider value={ctx}>
      <div className="mx-auto max-w-6xl p-4 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row">
          {/* Left */}
          <div className="md:w-72 space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-lg font-semibold">I-129F Wizard</div>
              <div className="mt-1 text-xs text-gray-500">
                Draft autosaves to your browser. Use Export/Import on your profile page if enabled.
              </div>

              <div className="mt-4">
                <Stepper currentKey={active} onJump={setActive} />
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={onPrev}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  className="flex-1 rounded-lg bg-black px-3 py-2 text-sm text-white hover:bg-black/90"
                >
                  Next
                </button>
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={onReset}
                  className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100"
                >
                  Reset draft
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold">PDF Mapping Notes</div>
              <div className="mt-2 text-xs text-gray-600 space-y-2">
                <div>
                  • Race and Ethnicity are stored as single selections and mapped to checkboxes during PDF generation.
                </div>
                <div>• Height/Weight are numeric fields and should match the PDF’s expected format.</div>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="flex-1 space-y-4">
            <Current />
          </div>
        </div>
      </div>
    </WizardCtx.Provider>
  );
}

/* ---------- Part 1 ---------- */
function Part1Petitioner() {
  return (
    <div className="space-y-4">
      <Panel title="Petitioner Identity">
        <Grid2>
          <Field label="Family Name (Last Name)">
            <TextInput path="petitioner.name.family" placeholder="e.g., Smith" />
          </Field>
          <Field label="Given Name (First Name)">
            <TextInput path="petitioner.name.given" placeholder="e.g., John" />
          </Field>
          <Field label="Middle Name">
            <TextInput path="petitioner.name.middle" placeholder="e.g., Allen" />
          </Field>
          <Field label="Date of Birth">
            <DateInput path="petitioner.citizenship.dateOfBirth" />
          </Field>
          <Field label="Gender">
            <Select
              path="petitioner.citizenship.gender"
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
              ]}
            />
          </Field>
          <Field label="Country of Birth">
            <TextInput path="petitioner.citizenship.placeOfBirthCountry" placeholder="e.g., United States" />
          </Field>
          <Field label="City of Birth">
            <TextInput path="petitioner.citizenship.placeOfBirthCity" placeholder="e.g., Dallas" />
          </Field>
          <Field label="State of Birth (if applicable)">
            <TextInput path="petitioner.citizenship.placeOfBirthState" placeholder="e.g., TX" />
          </Field>
        </Grid2>
      </Panel>

      <Panel title="Other Names Used (If any)">
        <Grid2>
          <Field label="Have you used other names?">
            <Select
              path="petitioner.otherNamesUsed.hasOtherNames"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ]}
            />
          </Field>
          <Field label="Other Family Name">
            <TextInput path="petitioner.otherNamesUsed.family" />
          </Field>
          <Field label="Other Given Name">
            <TextInput path="petitioner.otherNamesUsed.given" />
          </Field>
          <Field label="Other Middle Name">
            <TextInput path="petitioner.otherNamesUsed.middle" />
          </Field>
        </Grid2>
      </Panel>

      <Panel title="Mailing Address">
        <Grid2>
          <Field label="In Care Of Name (if any)">
            <TextInput path="petitioner.mailingAddress.inCareOf" />
          </Field>
          <Field label="Street Number and Name">
            <TextInput path="petitioner.mailingAddress.streetNumberName" />
          </Field>
          <Field label="Apt/Ste/Flr">
            <TextInput path="petitioner.mailingAddress.aptSteFlr" />
          </Field>
          <Field label="City or Town">
            <TextInput path="petitioner.mailingAddress.cityOrTown" />
          </Field>
          <Field label="State">
            <TextInput path="petitioner.mailingAddress.state" />
          </Field>
          <Field label="ZIP Code">
            <TextInput path="petitioner.mailingAddress.zip" inputMode="numeric" />
          </Field>
          <Field label="Province (if not U.S.)">
            <TextInput path="petitioner.mailingAddress.province" />
          </Field>
          <Field label="Postal Code (if not U.S.)">
            <TextInput path="petitioner.mailingAddress.postalCode" />
          </Field>
          <Field label="Country">
            <TextInput path="petitioner.mailingAddress.country" />
          </Field>
        </Grid2>
      </Panel>

      <Panel title="Physical Address">
        <Checkbox path="petitioner.physicalAddress.sameAsMailing" label="Same as mailing address" />
        <Divider />
        <Grid2>
          <Field label="Street Number and Name">
            <TextInput path="petitioner.physicalAddress.streetNumberName" />
          </Field>
          <Field label="Apt/Ste/Flr">
            <TextInput path="petitioner.physicalAddress.aptSteFlr" />
          </Field>
          <Field label="City or Town">
            <TextInput path="petitioner.physicalAddress.cityOrTown" />
          </Field>
          <Field label="State">
            <TextInput path="petitioner.physicalAddress.state" />
          </Field>
          <Field label="ZIP Code">
            <TextInput path="petitioner.physicalAddress.zip" inputMode="numeric" />
          </Field>
          <Field label="Province (if not U.S.)">
            <TextInput path="petitioner.physicalAddress.province" />
          </Field>
          <Field label="Postal Code (if not U.S.)">
            <TextInput path="petitioner.physicalAddress.postalCode" />
          </Field>
          <Field label="Country">
            <TextInput path="petitioner.physicalAddress.country" />
          </Field>
        </Grid2>
      </Panel>

      <Panel title="Contact">
        <Grid2>
          <Field label="Daytime Phone">
            <TextInput path="petitioner.contact.daytimePhone" placeholder="e.g., +1 (555) 555-5555" />
          </Field>
          <Field label="Mobile Phone">
            <TextInput path="petitioner.contact.mobilePhone" placeholder="e.g., +1 (555) 555-5555" />
          </Field>
          <Field label="Email">
            <TextInput path="petitioner.contact.email" type="email" placeholder="e.g., name@example.com" />
          </Field>
          <Field label="SSN (if any)">
            <TextInput path="petitioner.citizenship.ssn" placeholder="###-##-####" />
          </Field>
          <Field label="Alien Number (if any)">
            <TextInput path="petitioner.citizenship.alienNumber" placeholder="A#########" />
          </Field>
          <Field label="Naturalization Certificate Number (if applicable)">
            <TextInput path="petitioner.citizenship.naturalizationCertificateNumber" />
          </Field>
        </Grid2>
      </Panel>
    </div>
  );
}

/* ---------- Part 2 ---------- */
function Part2Beneficiary() {
  const { data, setData } = useWizard();

  // Keep physical same-as-mailing in sync
  useEffect(() => {
    const same = !!deepGet(data, 'beneficiary.physicalAddress.sameAsMailing', true);
    if (!same) return;

    const m = deepGet(data, 'beneficiary.mailingAddress', {});
    setData((prev) => {
      let next = prev;
      next = deepSet(next, 'beneficiary.physicalAddress.streetNumberName', m.streetNumberName || '');
      next = deepSet(next, 'beneficiary.physicalAddress.aptSteFlr', m.aptSteFlr || '');
      next = deepSet(next, 'beneficiary.physicalAddress.cityOrTown', m.cityOrTown || '');
      next = deepSet(next, 'beneficiary.physicalAddress.stateProvince', m.stateProvince || '');
      next = deepSet(next, 'beneficiary.physicalAddress.postalCode', m.postalCode || '');
      next = deepSet(next, 'beneficiary.physicalAddress.country', m.country || '');
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    deepGet(data, 'beneficiary.physicalAddress.sameAsMailing', true),
    deepGet(data, 'beneficiary.mailingAddress.streetNumberName', ''),
    deepGet(data, 'beneficiary.mailingAddress.aptSteFlr', ''),
    deepGet(data, 'beneficiary.mailingAddress.cityOrTown', ''),
    deepGet(data, 'beneficiary.mailingAddress.stateProvince', ''),
    deepGet(data, 'beneficiary.mailingAddress.postalCode', ''),
    deepGet(data, 'beneficiary.mailingAddress.country', ''),
  ]);

  return (
    <div className="space-y-4">
      <Panel title="Beneficiary Identity">
        <Grid2>
          <Field label="Family Name (Last Name)">
            <TextInput path="beneficiary.name.family" />
          </Field>
          <Field label="Given Name (First Name)">
            <TextInput path="beneficiary.name.given" />
          </Field>
          <Field label="Middle Name">
            <TextInput path="beneficiary.name.middle" />
          </Field>
          <Field label="Alien Number (if any)">
            <TextInput path="beneficiary.info.alienNumber" placeholder="A#########" />
          </Field>
          <Field label="SSN (if any)">
            <TextInput path="beneficiary.info.ssn" placeholder="###-##-####" />
          </Field>
          <Field label="Date of Birth">
            <DateInput path="beneficiary.info.dateOfBirth" />
          </Field>
          <Field label="Gender">
            <Select
              path="beneficiary.info.gender"
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
              ]}
            />
          </Field>
          <Field label="Marital Status">
            <Select
              path="beneficiary.info.maritalStatus"
              options={[
                { value: 'single', label: 'Single' },
                { value: 'married', label: 'Married' },
                { value: 'divorced', label: 'Divorced' },
                { value: 'widowed', label: 'Widowed' },
                { value: 'annulled', label: 'Annulled' },
              ]}
            />
          </Field>
          <Field label="Country of Citizenship/Nationality">
            <TextInput path="beneficiary.info.citizenshipCountry" placeholder="e.g., Canada" />
          </Field>
          <Field label="City of Birth">
            <TextInput path="beneficiary.info.placeOfBirthCity" />
          </Field>
          <Field label="State/Province of Birth">
            <TextInput path="beneficiary.info.placeOfBirthStateProvince" />
          </Field>
          <Field label="Country of Birth">
            <TextInput path="beneficiary.info.placeOfBirthCountry" />
          </Field>
        </Grid2>
      </Panel>

      <Panel title="Other Names Used (If any)">
        <Grid2>
          <Field label="Have you used other names?">
            <Select
              path="beneficiary.otherNamesUsed.hasOtherNames"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ]}
            />
          </Field>
          <Field label="Other Family Name">
            <TextInput path="beneficiary.otherNamesUsed.family" />
          </Field>
          <Field label="Other Given Name">
            <TextInput path="beneficiary.otherNamesUsed.given" />
          </Field>
          <Field label="Other Middle Name">
            <TextInput path="beneficiary.otherNamesUsed.middle" />
          </Field>
        </Grid2>
      </Panel>

      <Panel title="Beneficiary Mailing Address">
        <Grid2>
          <Field label="Street Number and Name">
            <TextInput path="beneficiary.mailingAddress.streetNumberName" />
          </Field>
          <Field label="Apt/Ste/Flr">
            <TextInput path="beneficiary.mailingAddress.aptSteFlr" />
          </Field>
          <Field label="City or Town">
            <TextInput path="beneficiary.mailingAddress.cityOrTown" />
          </Field>
          <Field label="State/Province">
            <TextInput path="beneficiary.mailingAddress.stateProvince" />
          </Field>
          <Field label="Postal Code">
            <TextInput path="beneficiary.mailingAddress.postalCode" />
          </Field>
          <Field label="Country">
            <TextInput path="beneficiary.mailingAddress.country" />
          </Field>
        </Grid2>
      </Panel>

      <Panel title="Beneficiary Physical Address">
        <Checkbox path="beneficiary.physicalAddress.sameAsMailing" label="Same as mailing address" />
        <Divider />
        <Grid2>
          <Field label="Street Number and Name">
            <TextInput path="beneficiary.physicalAddress.streetNumberName" />
          </Field>
          <Field label="Apt/Ste/Flr">
            <TextInput path="beneficiary.physicalAddress.aptSteFlr" />
          </Field>
          <Field label="City or Town">
            <TextInput path="beneficiary.physicalAddress.cityOrTown" />
          </Field>
          <Field label="State/Province">
            <TextInput path="beneficiary.physicalAddress.stateProvince" />
          </Field>
          <Field label="Postal Code">
            <TextInput path="beneficiary.physicalAddress.postalCode" />
          </Field>
          <Field label="Country">
            <TextInput path="beneficiary.physicalAddress.country" />
          </Field>
        </Grid2>
      </Panel>

      <Panel title="Passport / Travel Document">
        <Grid2>
          <Field label="Passport Number">
            <TextInput path="beneficiary.info.passportNumber" />
          </Field>
          <Field label="Passport Country">
            <TextInput path="beneficiary.info.passportCountry" />
          </Field>
          <Field label="Passport Expiration Date">
            <DateInput path="beneficiary.info.passportExp" />
          </Field>
          <Field label="Travel Document Number (if any)">
            <TextInput path="beneficiary.info.travelDocumentNumber" />
          </Field>
        </Grid2>
      </Panel>

      <Panel title="Biographic Information (Page 9)">
        <Grid2>
          <Field label="Is the beneficiary Hispanic or Latino?">
            <Select
              path="beneficiary.info.ethnicityHispanic"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ]}
              placeholder="Select Yes or No…"
            />
          </Field>

          <Field label="Race">
            <Select
              path="beneficiary.info.race"
              options={[
                { value: 'white', label: 'White' },
                { value: 'asian', label: 'Asian' },
                { value: 'black', label: 'Black or African American' },
                { value: 'nhopi', label: 'Native Hawaiian or Other Pacific Islander' },
              ]}
              placeholder="Select one…"
            />
          </Field>

          <Field label="Height (Feet)">
            <TextInput path="beneficiary.info.heightFeet" placeholder="e.g., 5" inputMode="numeric" />
          </Field>
          <Field label="Height (Inches)">
            <TextInput path="beneficiary.info.heightInches" placeholder="e.g., 11" inputMode="numeric" />
          </Field>

          <Field label="Weight (lbs)">
            <TextInput path="beneficiary.info.weightLbs" placeholder="e.g., 160" inputMode="numeric" />
          </Field>

          <Field label="Eye Color">
            <Select
              path="beneficiary.info.eyeColor"
              options={[
                { value: 'black', label: 'Black' },
                { value: 'blue', label: 'Blue' },
                { value: 'brown', label: 'Brown' },
                { value: 'gray', label: 'Gray' },
                { value: 'green', label: 'Green' },
                { value: 'hazel', label: 'Hazel' },
                { value: 'maroon', label: 'Maroon' },
                { value: 'pink', label: 'Pink' },
                { value: 'unknown', label: 'Unknown/Other' },
              ]}
            />
          </Field>

          <Field label="Hair Color">
            <Select
              path="beneficiary.info.hairColor"
              options={[
                { value: 'bald', label: 'Bald (No hair)' },
                { value: 'black', label: 'Black' },
                { value: 'blond', label: 'Blond' },
                { value: 'brown', label: 'Brown' },
                { value: 'gray', label: 'Gray' },
                { value: 'red', label: 'Red' },
                { value: 'sandy', label: 'Sandy' },
                { value: 'white', label: 'White' },
                { value: 'unknown', label: 'Unknown/Other' },
              ]}
            />
          </Field>
        </Grid2>
      </Panel>

      <Panel title="Beneficiary Parents">
        <Grid2>
          <Field label="Father — Family Name">
            <TextInput path="beneficiary.parents.father.family" />
          </Field>
          <Field label="Father — Given Name">
            <TextInput path="beneficiary.parents.father.given" />
          </Field>
          <Field label="Father — Middle Name">
            <TextInput path="beneficiary.parents.father.middle" />
          </Field>

          <Field label="Mother — Family Name">
            <TextInput path="beneficiary.parents.mother.family" />
          </Field>
          <Field label="Mother — Given Name">
            <TextInput path="beneficiary.parents.mother.given" />
          </Field>
          <Field label="Mother — Middle Name">
            <TextInput path="beneficiary.parents.mother.middle" />
          </Field>
        </Grid2>
      </Panel>
    </div>
  );
}

/* ---------- Part 3 ---------- */
function Part3OtherInfo() {
  return (
    <div className="space-y-4">
      <Panel title="Other Information">
        <Grid2>
          <Field label="Have you met in person within the last 2 years?">
            <Select
              path="otherInfo.metInPersonWithin2Years"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ]}
            />
          </Field>
          <Field label="Explain (if No)">
            <TextInput path="otherInfo.metInPersonExplain" placeholder="Explain why meeting was not possible…" />
          </Field>

          <Field label="Do you intend to marry within 90 days of entry?">
            <Select
              path="otherInfo.intentToMarry"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ]}
            />
          </Field>
          <Field label="Explain (if No)">
            <TextInput path="otherInfo.intentToMarryExplain" placeholder="Explain…" />
          </Field>
        </Grid2>

        <Divider />

        <Grid2>
          <Field label="Have you filed I-129F for anyone before?">
            <Select
              path="otherInfo.priorPetitions.hasFiledBefore"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ]}
            />
          </Field>
          <Field label="Explain (if Yes)">
            <TextInput path="otherInfo.priorPetitions.explain" placeholder="Names, dates, outcomes…" />
          </Field>
        </Grid2>
      </Panel>
    </div>
  );
}

/* ---------- Part 4 ---------- */
function Part4PetitionerStatement() {
  return (
    <div className="space-y-4">
      <Panel title="Petitioner Statement">
        <Grid2>
          <Field label="Can you read and understand English?">
            <Select
              path="petitionerStatement.canReadEnglish"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ]}
            />
          </Field>

          <Field label="Did you use an interpreter?">
            <Select
              path="petitionerStatement.usedInterpreter"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ]}
            />
          </Field>

          <Field label="Did you use a preparer?">
            <Select
              path="petitionerStatement.usedPreparer"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ]}
            />
          </Field>
        </Grid2>
      </Panel>
    </div>
  );
}

/* ---------- Part 5 ---------- */
function Part5ContactInfo() {
  return (
    <div className="space-y-4">
      <Panel title="Contact Information">
        <Grid2>
          <Field label="Daytime Phone">
            <TextInput path="contactInfo.daytimePhone" />
          </Field>
          <Field label="Mobile Phone">
            <TextInput path="contactInfo.mobilePhone" />
          </Field>
          <Field label="Email">
            <TextInput path="contactInfo.email" type="email" />
          </Field>
        </Grid2>
      </Panel>
    </div>
  );
}

/* ---------- Part 6 ---------- */
function Part6Interpreter() {
  return (
    <div className="space-y-4">
      <Panel title="Interpreter">
        <Grid2>
          <Field label="Did you use an interpreter?">
            <Select
              path="interpreter.used"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ]}
            />
          </Field>
          <Field label="Interpreter Family Name">
            <TextInput path="interpreter.family" />
          </Field>
          <Field label="Interpreter Given Name">
            <TextInput path="interpreter.given" />
          </Field>
          <Field label="Business/Organization (if any)">
            <TextInput path="interpreter.businessOrOrg" />
          </Field>
          <Field label="Street">
            <TextInput path="interpreter.street" />
          </Field>
          <Field label="Apt/Ste/Flr">
            <TextInput path="interpreter.aptSteFlr" />
          </Field>
          <Field label="City">
            <TextInput path="interpreter.city" />
          </Field>
          <Field label="State">
            <TextInput path="interpreter.state" />
          </Field>
          <Field label="ZIP">
            <TextInput path="interpreter.zip" />
          </Field>
          <Field label="Province">
            <TextInput path="interpreter.province" />
          </Field>
          <Field label="Postal Code">
            <TextInput path="interpreter.postalCode" />
          </Field>
          <Field label="Country">
            <TextInput path="interpreter.country" />
          </Field>
          <Field label="Phone">
            <TextInput path="interpreter.phone" />
          </Field>
          <Field label="Email">
            <TextInput path="interpreter.email" type="email" />
          </Field>
          <Field label="Language Interpreted">
            <TextInput path="interpreter.language" />
          </Field>
        </Grid2>
      </Panel>
    </div>
  );
}

/* ---------- Part 7 ---------- */
function Part7Preparer() {
  return (
    <div className="space-y-4">
      <Panel title="Preparer">
        <Grid2>
          <Field label="Did you use a preparer?">
            <Select
              path="preparer.used"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ]}
            />
          </Field>

          <Field label="Is the preparer an attorney or accredited rep?">
            <Select
              path="preparer.isAttorney"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ]}
            />
          </Field>

          <Field label="Preparer Family Name">
            <TextInput path="preparer.family" />
          </Field>
          <Field label="Preparer Given Name">
            <TextInput path="preparer.given" />
          </Field>

          <Field label="Business/Organization (if any)">
            <TextInput path="preparer.businessOrOrg" />
          </Field>

          <Field label="Street">
            <TextInput path="preparer.street" />
          </Field>
          <Field label="Apt/Ste/Flr">
            <TextInput path="preparer.aptSteFlr" />
          </Field>
          <Field label="City">
            <TextInput path="preparer.city" />
          </Field>
          <Field label="State">
            <TextInput path="preparer.state" />
          </Field>
          <Field label="ZIP">
            <TextInput path="preparer.zip" />
          </Field>
          <Field label="Province">
            <TextInput path="preparer.province" />
          </Field>
          <Field label="Postal Code">
            <TextInput path="preparer.postalCode" />
          </Field>
          <Field label="Country">
            <TextInput path="preparer.country" />
          </Field>

          <Field label="Phone">
            <TextInput path="preparer.phone" />
          </Field>
          <Field label="Email">
            <TextInput path="preparer.email" type="email" />
          </Field>

          <Field label="Firm Name (if any)">
            <TextInput path="preparer.firmName" />
          </Field>
          <Field label="Bar Number (if any)">
            <TextInput path="preparer.barNumber" />
          </Field>
        </Grid2>
      </Panel>
    </div>
  );
}

/* ---------- Part 8 ---------- */
function Part8AdditionalInfo() {
  const { data, setData } = useWizard();
  const entries = deepGet(data, 'additionalInfo.entries', [{ page: '', part: '', itemNumber: '', explanation: '' }]);

  const addEntry = () => {
    setData((prev) => {
      const cur = deepGet(prev, 'additionalInfo.entries', []);
      return deepSet(prev, 'additionalInfo.entries', [
        ...(cur || []),
        { page: '', part: '', itemNumber: '', explanation: '' },
      ]);
    });
  };

  const removeEntry = (idx) => {
    setData((prev) => {
      const cur = deepGet(prev, 'additionalInfo.entries', []);
      const next = (cur || []).filter((_, i) => i !== idx);
      return deepSet(prev, 'additionalInfo.entries', next.length ? next : [{ page: '', part: '', itemNumber: '', explanation: '' }]);
    });
  };

  return (
    <div className="space-y-4">
      <Panel title="Additional Information (Continuation)">
        <div className="text-sm text-gray-600">
          Use this section for any continuation pages or explanations that do not fit on the form.
        </div>

        <div className="space-y-3">
          {entries.map((_, idx) => (
            <div key={idx} className="rounded-xl border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">Entry #{idx + 1}</div>
                <button
                  type="button"
                  onClick={() => removeEntry(idx)}
                  className="text-xs rounded-lg border border-gray-200 px-2 py-1 hover:bg-gray-50"
                >
                  Remove
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field label="Page">
                  <TextInput path={`additionalInfo.entries.${idx}.page`} placeholder="e.g., 9" />
                </Field>
                <Field label="Part">
                  <TextInput path={`additionalInfo.entries.${idx}.part`} placeholder="e.g., 2" />
                </Field>
                <Field label="Item Number">
                  <TextInput path={`additionalInfo.entries.${idx}.itemNumber`} placeholder="e.g., 3" />
                </Field>
              </div>

              <div className="mt-3">
                <Field label="Explanation">
                  <textarea
                    className="w-full min-h-[120px] rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                    value={deepGet(data, `additionalInfo.entries.${idx}.explanation`, '')}
                    onChange={(e) => setData((prev) => deepSet(prev, `additionalInfo.entries.${idx}.explanation`, e.target.value))}
                    placeholder="Type the explanation here…"
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addEntry}
          className="rounded-lg bg-black px-3 py-2 text-sm text-white hover:bg-black/90"
        >
          Add another entry
        </button>
      </Panel>
    </div>
  );
}
