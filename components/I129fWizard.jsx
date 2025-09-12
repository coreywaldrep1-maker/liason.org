'use client';

import { useEffect, useMemo, useState } from 'react';

/* -------------------------
   Deep get/set helpers
-------------------------- */
function getAt(obj, path, fallback = '') {
  if (!path) return fallback;
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return fallback;
    cur = cur[p];
  }
  if (cur === undefined || cur === null) return fallback;
  return typeof cur === 'string' ? cur : String(cur);
}

function setAt(obj, path, value) {
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  const copy = Array.isArray(obj) ? [...obj] : { ...obj };
  let cur = copy;
  for (let i = 0; i < parts.length; i++) {
    const key = parts[i];
    const last = i === parts.length - 1;
    if (last) {
      cur[key] = value;
    } else {
      const next = cur[key];
      const nextKey = parts[i + 1];
      const shouldBeArray = Number.isInteger(+nextKey);
      const container =
        next == null
          ? (shouldBeArray ? [] : {})
          : (Array.isArray(next) ? [...next] : { ...next });
      cur[key] = container;
      cur = cur[key];
    }
  }
  return copy;
}

function BoundInput({ form, setForm, path, placeholder, multiline = false, rows = 3 }) {
  const value = getAt(form, path, '');
  const onChange = (e) => setForm((prev) => setAt(prev, path, e.target.value));
  if (multiline) {
    return <textarea rows={rows} value={value} onChange={onChange} placeholder={placeholder} />;
  }
  return <input type="text" value={value} onChange={onChange} placeholder={placeholder} />;
}

/* -------------------------
   Initial seeded structure
-------------------------- */
function blankName() { return { lastName: '', firstName: '', middleName: '' }; }
function blankUSAddr() {
  return { street: '', unitType: '', unitNum: '', city: '', state: '', zip: '' };
}
function blankIntlAddr() {
  return { street: '', unitType: '', unitNum: '', city: '', state: '', zip: '', province: '', postal: '', country: '' };
}
function blankEmployment() {
  return { employer: '', street: '', unitType: '', unitNum: '', city: '', state: '', zip: '', province: '', postal: '', country: '', occupation: '' };
}
function blankParent() {
  return { ...blankName(), sex: { male: '' }, country: '', cityRes: '', countryRes: '' };
}

function seededForm() {
  return {
    // Part 1 — Petitioner
    petitioner: {
      ...blankName(),
      otherNames: [ blankName() ],      // you can add more with an “add” button later
      parents: [ blankParent(), blankParent() ],
      priorSpouses: [ blankName() ],
      priorI129f: [ { aNumber: '', ...blankName(), uscisAction: '' } ],
    },

    // Pt1 L8 mailing (current)
    mailing: blankUSAddr(),

    // Pt1 L9–L19 physical addresses (last 5 years) — seed 2 rows
    physicalAddresses: [ blankIntlAddr(), blankIntlAddr() ],

    // Pt1 employment (last 5 years) — seed 2 rows
    employment: [ blankEmployment(), blankEmployment() ],

    // Since age 18 — seed 2 rows
    residenceSince18: [ { state: '', country: '' }, { state: '', country: '' } ],

    // Part 2 — Beneficiary
    beneficiary: {
      ...blankName(),
      otherNames: [ blankName() ],
      employment: [ blankEmployment(), blankEmployment() ],
    },

    // Relationship/history
    history: { howMet: '', dates: '', priorMarriages: '' },
  };
}

/* -------------------------
   Wizard steps
-------------------------- */
const STEPS = [
  { key: 'petitioner', label: 'Petitioner' },
  { key: 'addresses', label: 'Addresses' },
  { key: 'employment', label: 'Employment' },
  { key: 'beneficiary', label: 'Beneficiary' },
  { key: 'history', label: 'History' },
  { key: 'review', label: 'Review & download' },
];

export default function I129fWizard() {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(() => seededForm());

  // Load from server (credentials: include!)
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch('/api/i129f/load', {
          cache: 'no-store',
          credentials: 'include',
        });
        if (!resp.ok) return;
        const j = await resp.json();
        if (j?.ok && j.data) {
          // Merge over the seeded structure so arrays/objects exist
          setForm((prev) => ({ ...prev, ...j.data }));
        }
      } catch (e) {
        console.warn('load failed', e);
      }
    })();
  }, []);

  async function save() {
    setBusy(true);
    try {
      const resp = await fetch('/api/i129f/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ data: form }),
      });
      const j = await resp.json();
      if (!j?.ok) throw new Error(j?.error || 'Save failed');
      alert('Progress saved.');
    } catch (e) {
      alert('Save failed. Please make sure you are logged in.');
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  function resetLocal() {
    setForm(seededForm());
  }

  const stepButtons = useMemo(
    () =>
      STEPS.map((s, i) => (
        <button
          key={s.key}
          type="button"
          onClick={() => setStep(i)}
          className="small"
          style={{
            padding: '6px 10px',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            background: i === step ? '#eef2ff' : '#fff',
          }}
        >
          {i + 1}. {s.label}
        </button>
      )),
    [step]
  );

  function next() { setStep((s) => Math.min(s + 1, STEPS.length - 1)); }
  function back() { setStep((s) => Math.max(s - 1, 0)); }

  return (
    <div className="card" style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{stepButtons}</div>

      {/* Step 0 — Petitioner + parents + other names + prior */}
      {step === 0 && (
        <section style={{ display: 'grid', gap: 16 }}>
          <h3 style={{ margin: 0 }}>Petitioner</h3>
          <Field label="Family name (last)">
            <BoundInput form={form} setForm={setForm} path="petitioner.lastName" />
          </Field>
          <Field label="Given name (first)">
            <BoundInput form={form} setForm={setForm} path="petitioner.firstName" />
          </Field>
          <Field label="Middle name">
            <BoundInput form={form} setForm={setForm} path="petitioner.middleName" />
          </Field>

          <h4 style={{ margin: '12px 0 0' }}>Other names used</h4>
          <Field label="Family name (last)">
            <BoundInput form={form} setForm={setForm} path="petitioner.otherNames.0.lastName" />
          </Field>
          <Field label="Given name (first)">
            <BoundInput form={form} setForm={setForm} path="petitioner.otherNames.0.firstName" />
          </Field>
          <Field label="Middle name">
            <BoundInput form={form} setForm={setForm} path="petitioner.otherNames.0.middleName" />
          </Field>

          <h4 style={{ margin: '12px 0 0' }}>Parents</h4>
          <div className="small" style={{ marginTop: -8 }}>Parent 1</div>
          <Field label="Family name (last)">
            <BoundInput form={form} setForm={setForm} path="petitioner.parents.0.lastName" />
          </Field>
          <Field label="Given name (first)">
            <BoundInput form={form} setForm={setForm} path="petitioner.parents.0.firstName" />
          </Field>
          <Field label="Middle name">
            <BoundInput form={form} setForm={setForm} path="petitioner.parents.0.middleName" />
          </Field>
          <Field label="Sex (M/F)">
            <BoundInput form={form} setForm={setForm} path="petitioner.parents.0.sex.male" placeholder="M or F" />
          </Field>
          <Field label="Country of birth">
            <BoundInput form={form} setForm={setForm} path="petitioner.parents.0.country" />
          </Field>
          <Field label="City of residence">
            <BoundInput form={form} setForm={setForm} path="petitioner.parents.0.cityRes" />
          </Field>
          <Field label="Country of residence">
            <BoundInput form={form} setForm={setForm} path="petitioner.parents.0.countryRes" />
          </Field>

          <div className="small" style={{ marginTop: 8 }}>Parent 2</div>
          <Field label="Family name (last)">
            <BoundInput form={form} setForm={setForm} path="petitioner.parents.1.lastName" />
          </Field>
          <Field label="Given name (first)">
            <BoundInput form={form} setForm={setForm} path="petitioner.parents.1.firstName" />
          </Field>
          <Field label="Middle name">
            <BoundInput form={form} setForm={setForm} path="petitioner.parents.1.middleName" />
          </Field>
          <Field label="Sex (M/F)">
            <BoundInput form={form} setForm={setForm} path="petitioner.parents.1.sex.male" placeholder="M or F" />
          </Field>
          <Field label="Country of birth">
            <BoundInput form={form} setForm={setForm} path="petitioner.parents.1.country" />
          </Field>
          <Field label="City of residence">
            <BoundInput form={form} setForm={setForm} path="petitioner.parents.1.cityRes" />
          </Field>
          <Field label="Country of residence">
            <BoundInput form={form} setForm={setForm} path="petitioner.parents.1.countryRes" />
          </Field>

          <h4 style={{ margin: '12px 0 0' }}>Prior I-129F filings</h4>
          <Field label="A-Number">
            <BoundInput form={form} setForm={setForm} path="petitioner.priorI129f.0.aNumber" />
          </Field>
          <Field label="Family name (last)">
            <BoundInput form={form} setForm={setForm} path="petitioner.priorI129f.0.lastName" />
          </Field>
          <Field label="Given name (first)">
            <BoundInput form={form} setForm={setForm} path="petitioner.priorI129f.0.firstName" />
          </Field>
          <Field label="Middle name">
            <BoundInput form={form} setForm={setForm} path="petitioner.priorI129f.0.middleName" />
          </Field>
          <Field label="USCIS action/result">
            <BoundInput form={form} setForm={setForm} path="petitioner.priorI129f.0.uscisAction" />
          </Field>
        </section>
      )}

      {/* Step 1 — Addresses */}
      {step === 1 && (
        <section style={{ display: 'grid', gap: 16 }}>
          <h3 style={{ margin: 0 }}>Current mailing address</h3>
          <Field label="Street number and name">
            <BoundInput form={form} setForm={setForm} path="mailing.street" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Unit type (Apt/Ste/Flr)">
              <BoundInput form={form} setForm={setForm} path="mailing.unitType" />
            </Field>
            <Field label="Unit number">
              <BoundInput form={form} setForm={setForm} path="mailing.unitNum" />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.8fr', gap: 10 }}>
            <Field label="City">
              <BoundInput form={form} setForm={setForm} path="mailing.city" />
            </Field>
            <Field label="State">
              <BoundInput form={form} setForm={setForm} path="mailing.state" />
            </Field>
            <Field label="ZIP">
              <BoundInput form={form} setForm={setForm} path="mailing.zip" />
            </Field>
          </div>

          <h3 style={{ margin: '12px 0 0' }}>Physical address history (last 5 years)</h3>
          <div className="small" style={{ marginTop: -8 }}>Address 1</div>
          <Field label="Street">
            <BoundInput form={form} setForm={setForm} path="physicalAddresses.0.street" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Unit type">
              <BoundInput form={form} setForm={setForm} path="physicalAddresses.0.unitType" />
            </Field>
            <Field label="Unit number">
              <BoundInput form={form} setForm={setForm} path="physicalAddresses.0.unitNum" />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr 0.7fr', gap: 10 }}>
            <Field label="City">
              <BoundInput form={form} setForm={setForm} path="physicalAddresses.0.city" />
            </Field>
            <Field label="State/Province">
              <BoundInput form={form} setForm={setForm} path="physicalAddresses.0.state" />
            </Field>
            <Field label="ZIP/Postal">
              <BoundInput form={form} setForm={setForm} path="physicalAddresses.0.zip" />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Field label="Province">
              <BoundInput form={form} setForm={setForm} path="physicalAddresses.0.province" />
            </Field>
            <Field label="Postal code">
              <BoundInput form={form} setForm={setForm} path="physicalAddresses.0.postal" />
            </Field>
            <Field label="Country">
              <BoundInput form={form} setForm={setForm} path="physicalAddresses.0.country" />
            </Field>
          </div>

          <div className="small" style={{ marginTop: 8 }}>Address 2</div>
          <Field label="Street">
            <BoundInput form={form} setForm={setForm} path="physicalAddresses.1.street" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Unit type">
              <BoundInput form={form} setForm={setForm} path="physicalAddresses.1.unitType" />
            </Field>
            <Field label="Unit number">
              <BoundInput form={form} setForm={setForm} path="physicalAddresses.1.unitNum" />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr 0.7fr', gap: 10 }}>
            <Field label="City">
              <BoundInput form={form} setForm={setForm} path="physicalAddresses.1.city" />
            </Field>
            <Field label="State/Province">
              <BoundInput form={form} setForm={setForm} path="physicalAddresses.1.state" />
            </Field>
            <Field label="ZIP/Postal">
              <BoundInput form={form} setForm={setForm} path="physicalAddresses.1.zip" />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Field label="Province">
              <BoundInput form={form} setForm={setForm} path="physicalAddresses.1.province" />
            </Field>
            <Field label="Postal code">
              <BoundInput form={form} setForm={setForm} path="physicalAddresses.1.postal" />
            </Field>
            <Field label="Country">
              <BoundInput form={form} setForm={setForm} path="physicalAddresses.1.country" />
            </Field>
          </div>

          <h4 style={{ margin: '12px 0 0' }}>Residence since age 18</h4>
          <div className="small" style={{ marginTop: -8 }}>Location 1</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="State">
              <BoundInput form={form} setForm={setForm} path="residenceSince18.0.state" />
            </Field>
            <Field label="Country">
              <BoundInput form={form} setForm={setForm} path="residenceSince18.0.country" />
            </Field>
          </div>
          <div className="small" style={{ marginTop: 8 }}>Location 2</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="State">
              <BoundInput form={form} setForm={setForm} path="residenceSince18.1.state" />
            </Field>
            <Field label="Country">
              <BoundInput form={form} setForm={setForm} path="residenceSince18.1.country" />
            </Field>
          </div>
        </section>
      )}

      {/* Step 2 — Petitioner employment */}
      {step === 2 && (
        <section style={{ display: 'grid', gap: 16 }}>
          <h3 style={{ margin: 0 }}>Petitioner — Employment (last 5 years)</h3>
          <div className="small" style={{ marginTop: -8 }}>Job 1</div>
          <Field label="Employer">
            <BoundInput form={form} setForm={setForm} path="employment.0.employer" />
          </Field>
          <Field label="Street">
            <BoundInput form={form} setForm={setForm} path="employment.0.street" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Unit type">
              <BoundInput form={form} setForm={setForm} path="employment.0.unitType" />
            </Field>
            <Field label="Unit number">
              <BoundInput form={form} setForm={setForm} path="employment.0.unitNum" />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr 0.7fr', gap: 10 }}>
            <Field label="City">
              <BoundInput form={form} setForm={setForm} path="employment.0.city" />
            </Field>
            <Field label="State/Province">
              <BoundInput form={form} setForm={setForm} path="employment.0.state" />
            </Field>
            <Field label="ZIP/Postal">
              <BoundInput form={form} setForm={setForm} path="employment.0.zip" />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Field label="Province">
              <BoundInput form={form} setForm={setForm} path="employment.0.province" />
            </Field>
            <Field label="Postal code">
              <BoundInput form={form} setForm={setForm} path="employment.0.postal" />
            </Field>
            <Field label="Country">
              <BoundInput form={form} setForm={setForm} path="employment.0.country" />
            </Field>
          </div>
          <Field label="Occupation">
            <BoundInput form={form} setForm={setForm} path="employment.0.occupation" />
          </Field>

          <div className="small" style={{ marginTop: 8 }}>Job 2</div>
          <Field label="Employer">
            <BoundInput form={form} setForm={setForm} path="employment.1.employer" />
          </Field>
          <Field label="Street">
            <BoundInput form={form} setForm={setForm} path="employment.1.street" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Unit type">
              <BoundInput form={form} setForm={setForm} path="employment.1.unitType" />
            </Field>
            <Field label="Unit number">
              <BoundInput form={form} setForm={setForm} path="employment.1.unitNum" />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr 0.7fr', gap: 10 }}>
            <Field label="City">
              <BoundInput form={form} setForm={setForm} path="employment.1.city" />
            </Field>
            <Field label="State/Province">
              <BoundInput form={form} setForm={setForm} path="employment.1.state" />
            </Field>
            <Field label="ZIP/Postal">
              <BoundInput form={form} setForm={setForm} path="employment.1.zip" />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Field label="Province">
              <BoundInput form={form} setForm={setForm} path="employment.1.province" />
            </Field>
            <Field label="Postal code">
              <BoundInput form={form} setForm={setForm} path="employment.1.postal" />
            </Field>
            <Field label="Country">
              <BoundInput form={form} setForm={setForm} path="employment.1.country" />
            </Field>
          </div>
          <Field label="Occupation">
            <BoundInput form={form} setForm={setForm} path="employment.1.occupation" />
          </Field>
        </section>
      )}

      {/* Step 3 — Beneficiary (names + employment) */}
      {step === 3 && (
        <section style={{ display: 'grid', gap: 16 }}>
          <h3 style={{ margin: 0 }}>Beneficiary</h3>
          <Field label="Family name (last)">
            <BoundInput form={form} setForm={setForm} path="beneficiary.lastName" />
          </Field>
          <Field label="Given name (first)">
            <BoundInput form={form} setForm={setForm} path="beneficiary.firstName" />
          </Field>
          <Field label="Middle name">
            <BoundInput form={form} setForm={setForm} path="beneficiary.middleName" />
          </Field>

          <h4 style={{ margin: '12px 0 0' }}>Other names used</h4>
          <Field label="Family name (last)">
            <BoundInput form={form} setForm={setForm} path="beneficiary.otherNames.0.lastName" />
          </Field>
          <Field label="Given name (first)">
            <BoundInput form={form} setForm={setForm} path="beneficiary.otherNames.0.firstName" />
          </Field>
          <Field label="Middle name">
            <BoundInput form={form} setForm={setForm} path="beneficiary.otherNames.0.middleName" />
          </Field>

          <h4 style={{ margin: '12px 0 0' }}>Employment (recent)</h4>
          <div className="small" style={{ marginTop: -8 }}>Job 1</div>
          <Field label="Employer">
            <BoundInput form={form} setForm={setForm} path="beneficiary.employment.0.employer" />
          </Field>
          <Field label="Street">
            <BoundInput form={form} setForm={setForm} path="beneficiary.employment.0.street" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Unit type">
              <BoundInput form={form} setForm={setForm} path="beneficiary.employment.0.unitType" />
            </Field>
            <Field label="Unit number">
              <BoundInput form={form} setForm={setForm} path="beneficiary.employment.0.unitNum" />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr 0.7fr', gap: 10 }}>
            <Field label="City">
              <BoundInput form={form} setForm={setForm} path="beneficiary.employment.0.city" />
            </Field>
            <Field label="State/Province">
              <BoundInput form={form} setForm={setForm} path="beneficiary.employment.0.state" />
            </Field>
            <Field label="ZIP/Postal">
              <BoundInput form={form} setForm={setForm} path="beneficiary.employment.0.zip" />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Field label="Province">
              <BoundInput form={form} setForm={setForm} path="beneficiary.employment.0.province" />
            </Field>
            <Field label="Postal code">
              <BoundInput form={form} setForm={setForm} path="beneficiary.employment.0.postal" />
            </Field>
            <Field label="Country">
              <BoundInput form={form} setForm={setForm} path="beneficiary.employment.0.country" />
            </Field>
          </div>
          <Field label="Occupation">
            <BoundInput form={form} setForm={setForm} path="beneficiary.employment.0.occupation" />
          </Field>

          <div className="small" style={{ marginTop: 8 }}>Job 2</div>
          <Field label="Employer">
            <BoundInput form={form} setForm={setForm} path="beneficiary.employment.1.employer" />
          </Field>
          <Field label="Street">
            <BoundInput form={form} setForm={setForm} path="beneficiary.employment.1.street" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Unit type">
              <BoundInput form={form} setForm={setForm} path="beneficiary.employment.1.unitType" />
            </Field>
            <Field label="Unit number">
              <BoundInput form={form} setForm={setForm} path="beneficiary.employment.1.unitNum" />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr 0.7fr', gap: 10 }}>
            <Field label="City">
              <BoundInput form={form} setForm={setForm} path="beneficiary.employment.1.city" />
            </Field>
            <Field label="State/Province">
              <BoundInput form={form} setForm={setForm} path="beneficiary.employment.1.state" />
            </Field>
            <Field label="ZIP/Postal">
              <BoundInput form={form} setForm={setForm} path="beneficiary.employment.1.zip" />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Field label="Province">
              <BoundInput form={form} setForm={setForm} path="beneficiary.employment.1.province" />
            </Field>
            <Field label="Postal code">
              <BoundInput form={form} setForm={setForm} path="beneficiary.employment.1.postal" />
            </Field>
            <Field label="Country">
              <BoundInput form={form} setForm={setForm} path="beneficiary.employment.1.country" />
            </Field>
          </div>
          <Field label="Occupation">
            <BoundInput form={form} setForm={setForm} path="beneficiary.employment.1.occupation" />
          </Field>
        </section>
      )}

      {/* Step 4 — Relationship & history */}
      {step === 4 && (
        <section style={{ display: 'grid', gap: 10 }}>
          <h3 style={{ margin: 0 }}>Relationship & history</h3>
          <Field label="How did you meet? (short description)">
            <BoundInput form={form} setForm={setForm} path="history.howMet" multiline rows={4} />
          </Field>
          <Field label="Important dates (met/engaged/visited)">
            <BoundInput form={form} setForm={setForm} path="history.dates" multiline rows={3} />
          </Field>
          <Field label="Prior marriages / divorces (if any)">
            <BoundInput form={form} setForm={setForm} path="history.priorMarriages" multiline rows={3} />
          </Field>
        </section>
      )}

      {/* Step 5 — Review */}
      {step === 5 && (
        <section style={{ display: 'grid', gap: 10 }}>
          <h3 style={{ margin: 0 }}>Review & download</h3>
          <div className="small">When you’re ready, download a draft of your I-129F.</div>
          <div>
            <a className="btn btn-primary" href="/api/i129f/pdf">Download I-129F (PDF)</a>
            <span style={{ marginLeft: 10 }}>
              <a className="small" href="/api/i129f/pdf-debug" target="_blank" rel="noreferrer">debug overlay</a>
            </span>
          </div>
        </section>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={back} className="btn" disabled={step === 0}>Back</button>
          <button type="button" onClick={next} className="btn" disabled={step === STEPS.length - 1}>Next</button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={resetLocal} className="btn">Reset draft (local)</button>
          <button type="button" onClick={save} className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save progress'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="small" style={{ display: 'grid', gap: 6, minWidth: 0 }}>
      <span>{label}</span>
      <div style={{ display: 'grid', minWidth: 0 }}>{children}</div>
    </label>
  );
}
