// components/I129fWizard.jsx
'use client';

import { useEffect, useState } from 'react';

const STEPS = [
  { key: 'petitioner', label: 'Petitioner' },
  { key: 'addresses', label: 'Addresses (5 yrs)' },
  { key: 'employment', label: 'Employment (5 yrs)' },
  { key: 'parents', label: 'Parents & prior filings' },
  { key: 'beneficiary', label: 'Beneficiary' },
  { key: 'benefEmp', label: 'Beneficiary employment' },
  { key: 'review', label: 'Review & download' },
];

/* ---------- immutable deep get / set helpers ---------- */
function getIn(obj, path, fallback = '') {
  let cur = obj;
  for (const key of path) {
    if (cur == null) return fallback;
    cur = cur[key];
  }
  return cur == null ? fallback : cur;
}

function cloneOf(x) {
  return Array.isArray(x) ? x.slice() : { ...x };
}

// setIn creates intermediate objects/arrays and never mutates the original root
function setIn(root, path, value) {
  const out = cloneOf(root || {});
  let cur = out;
  for (let i = 0; i < path.length - 1; i++) {
    const k = path[i];
    const nextK = path[i + 1];

    // ensure the current slot exists
    let next = cur[k];

    // if missing, create by looking at what's next (array if number, object if string)
    if (next == null) {
      next = typeof nextK === 'number' ? [] : {};
    } else {
      // clone to avoid mutating original references
      next = cloneOf(next);
    }

    // if it's an array and nextK is a number, ensure length
    if (Array.isArray(next) && typeof nextK === 'number') {
      while (next.length <= nextK) next.push(undefined);
    }

    cur[k] = next;
    cur = next;
  }
  const last = path[path.length - 1];
  cur[last] = value;
  return out;
}

/* ---------- small field components ---------- */
function Field({ label, children }) {
  return (
    <label className="small" style={{ display: 'grid', gap: 6, minWidth: 0 }}>
      <span>{label}</span>
      <div style={{ display: 'grid', minWidth: 0 }}>{children}</div>
    </label>
  );
}

function Input({ form, setForm, path, label, type = 'text', placeholder }) {
  const val = getIn(form, path, '');
  return (
    <Field label={label}>
      <input
        type={type}
        value={val}
        placeholder={placeholder}
        onChange={(e) => setForm((f) => setIn(f, path, e.target.value))}
      />
    </Field>
  );
}

function TextArea({ form, setForm, path, label, rows = 3, placeholder }) {
  const val = getIn(form, path, '');
  return (
    <Field label={label}>
      <textarea
        rows={rows}
        value={val}
        placeholder={placeholder}
        onChange={(e) => setForm((f) => setIn(f, path, e.target.value))}
      />
    </Field>
  );
}

function Select({ form, setForm, path, label, options = [] }) {
  const val = getIn(form, path, '');
  return (
    <Field label={label}>
      <select value={val} onChange={(e) => setForm((f) => setIn(f, path, e.target.value))}>
        <option value="">—</option>
        {options.map(([v, t]) => (
          <option key={v} value={v}>{t}</option>
        ))}
      </select>
    </Field>
  );
}

/* ---------- main wizard ---------- */
export default function I129fWizard() {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  // start with a broad shape so index [0], [1] exist and are editable immediately
  const [form, setForm] = useState({
    petitioner: {
      lastName: '', firstName: '', middleName: '',
      otherNames: [ { lastName:'', firstName:'', middleName:'' } ],
    },
    // Page 2 — two addresses (current + one older)
    physicalAddresses: [
      { street:'', unitType:'', unitNum:'', city:'', state:'', zip:'', province:'', postal:'', country:'' },
      { street:'', unitType:'', unitNum:'', city:'', state:'', zip:'', province:'', postal:'', country:'' },
    ],
    // Employment 5 yrs (2 rows to start)
    employment: [
      { employer:'', street:'', unitType:'', unitNum:'', city:'', state:'', zip:'', province:'', postal:'', country:'', occupation:'', dateFrom:'', dateTo:'' },
      { employer:'', street:'', unitType:'', unitNum:'', city:'', state:'', zip:'', province:'', postal:'', country:'', occupation:'', dateFrom:'', dateTo:'' },
    ],
    parents: [
      { lastName:'', firstName:'', middleName:'', dob:'', sex:'', country:'', cityRes:'', countryRes:'' },
      { lastName:'', firstName:'', middleName:'', dob:'', sex:'', country:'', cityRes:'', countryRes:'' },
    ],
    priorSpouses: [ { lastName:'', firstName:'', middleName:'', dob:'', country:'' } ],
    priorI129f:   [ { aNumber:'', lastName:'', firstName:'', middleName:'', uscisAction:'' } ],
    residenceSince18: [ { state:'', country:'' }, { state:'', country:'' } ],

    beneficiary: {
      lastName: '', firstName: '', middleName: '',
      otherNames: [ { lastName:'', firstName:'', middleName:'' } ],
      employment: [
        { employer:'', street:'', unitType:'', unitNum:'', city:'', state:'', zip:'', province:'', postal:'', country:'', occupation:'', dateFrom:'', dateTo:'' },
        { employer:'', street:'', unitType:'', unitNum:'', city:'', state:'', zip:'', province:'', postal:'', country:'', occupation:'', dateFrom:'', dateTo:'' },
      ],
    },
    history: { howMet:'', dates:'', priorMarriages:'' },
  });

  // Load saved data
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch('/api/i129f/load', { cache: 'no-store', credentials: 'include' });
        if (!resp.ok) return;
        const j = await resp.json();
        if (j?.ok && j.data) setForm((prev) => ({ ...prev, ...j.data }));
      } catch {}
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

  function next() { setStep((s) => Math.min(s + 1, STEPS.length - 1)); }
  function back() { setStep((s) => Math.max(s - 1, 0)); }

  return (
    <div className="card" style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {STEPS.map((s, i) => (
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
        ))}
      </div>

      {/* Step 0: Petitioner + other name row 0 */}
      {step === 0 && (
        <section style={{ display: 'grid', gap: 10 }}>
          <h3 style={{ margin: 0 }}>Petitioner</h3>
          <Input form={form} setForm={setForm} path={['petitioner','lastName']}  label="Family name (last)" />
          <Input form={form} setForm={setForm} path={['petitioner','firstName']} label="Given name (first)" />
          <Input form={form} setForm={setForm} path={['petitioner','middleName']} label="Middle name" />

          <h4 style={{ margin: '10px 0 0' }}>Other names used (row 1)</h4>
          <Input form={form} setForm={setForm} path={['petitioner','otherNames',0,'lastName']}  label="Other last name" />
          <Input form={form} setForm={setForm} path={['petitioner','otherNames',0,'firstName']} label="Other first name" />
          <Input form={form} setForm={setForm} path={['petitioner','otherNames',0,'middleName']} label="Other middle name" />
        </section>
      )}

      {/* Step 1: Physical addresses rows 0 & 1 */}
      {step === 1 && (
        <section style={{ display: 'grid', gap: 16 }}>
          <h3 style={{ margin: 0 }}>Addresses (last 5 years)</h3>

          {[0,1].map((idx) => (
            <div key={idx} className="card" style={{ display:'grid', gap:10 }}>
              <div className="small" style={{ fontWeight: 600 }}>Address {idx + 1}</div>
              <Input form={form} setForm={setForm} path={['physicalAddresses',idx,'street']} label="Street number and name" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Input form={form} setForm={setForm} path={['physicalAddresses',idx,'unitType']} label="Unit type (Apt/Ste/Flr)" />
                <Input form={form} setForm={setForm} path={['physicalAddresses',idx,'unitNum']}  label="Unit number" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.8fr', gap: 10 }}>
                <Input form={form} setForm={setForm} path={['physicalAddresses',idx,'city']}  label="City" />
                <Input form={form} setForm={setForm} path={['physicalAddresses',idx,'state']} label="State/Province" />
                <Input form={form} setForm={setForm} path={['physicalAddresses',idx,'zip']}   label="ZIP/Postal" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Input form={form} setForm={setForm} path={['physicalAddresses',idx,'province']} label="Province (if any)" />
                <Input form={form} setForm={setForm} path={['physicalAddresses',idx,'postal']}   label="Postal code (if any)" />
              </div>
              <Input form={form} setForm={setForm} path={['physicalAddresses',idx,'country']} label="Country" />
            </div>
          ))}
        </section>
      )}

      {/* Step 2: Petitioner employment rows 0 & 1 */}
      {step === 2 && (
        <section style={{ display: 'grid', gap: 16 }}>
          <h3 style={{ margin: 0 }}>Employment (last 5 years)</h3>

          {[0,1].map((idx) => (
            <div key={idx} className="card" style={{ display:'grid', gap:10 }}>
              <div className="small" style={{ fontWeight: 600 }}>Employer {idx + 1}</div>
              <Input form={form} setForm={setForm} path={['employment',idx,'employer']} label="Employer name" />
              <Input form={form} setForm={setForm} path={['employment',idx,'street']}   label="Street number and name" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Input form={form} setForm={setForm} path={['employment',idx,'unitType']} label="Unit type (Apt/Ste/Flr)" />
                <Input form={form} setForm={setForm} path={['employment',idx,'unitNum']}  label="Unit number" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.8fr', gap: 10 }}>
                <Input form={form} setForm={setForm} path={['employment',idx,'city']}  label="City" />
                <Input form={form} setForm={setForm} path={['employment',idx,'state']} label="State/Province" />
                <Input form={form} setForm={setForm} path={['employment',idx,'zip']}   label="ZIP/Postal" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Input form={form} setForm={setForm} path={['employment',idx,'province']} label="Province (if any)" />
                <Input form={form} setForm={setForm} path={['employment',idx,'postal']}   label="Postal code (if any)" />
              </div>
              <Input form={form} setForm={setForm} path={['employment',idx,'country']}    label="Country" />
              <Input form={form} setForm={setForm} path={['employment',idx,'occupation']} label="Occupation" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Input form={form} setForm={setForm} path={['employment',idx,'dateFrom']} label="From (mm/dd/yyyy)" />
                <Input form={form} setForm={setForm} path={['employment',idx,'dateTo']}   label="To (mm/dd/yyyy or Present)" />
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Step 3: Parents & prior filings */}
      {step === 3 && (
        <section style={{ display: 'grid', gap: 16 }}>
          <h3 style={{ margin: 0 }}>Parents & Prior Filings</h3>

          {[0,1].map((idx) => (
            <div key={idx} className="card" style={{ display:'grid', gap:10 }}>
              <div className="small" style={{ fontWeight: 600 }}>Parent {idx + 1}</div>
              <Input form={form} setForm={setForm} path={['parents',idx,'lastName']}  label="Last name" />
              <Input form={form} setForm={setForm} path={['parents',idx,'firstName']} label="First name" />
              <Input form={form} setForm={setForm} path={['parents',idx,'middleName']} label="Middle name" />
              <Input form={form} setForm={setForm} path={['parents',idx,'dob']}        label="Date of birth (mm/dd/yyyy)" />
              <Select
                form={form}
                setForm={setForm}
                path={['parents',idx,'sex']}
                label="Sex"
                options={[['male','Male'], ['female','Female']]}
              />
              <Input form={form} setForm={setForm} path={['parents',idx,'country']}    label="Country of citizenship" />
              <Input form={form} setForm={setForm} path={['parents',idx,'cityRes']}    label="Current city of residence" />
              <Input form={form} setForm={setForm} path={['parents',idx,'countryRes']} label="Current country of residence" />
            </div>
          ))}

          <div className="card" style={{ display:'grid', gap:10 }}>
            <div className="small" style={{ fontWeight: 600 }}>Prior I-129F (if any)</div>
            <Input form={form} setForm={setForm} path={['priorI129f',0,'aNumber']}     label="A-Number (if any)" />
            <Input form={form} setForm={setForm} path={['priorI129f',0,'lastName']}    label="Beneficiary last name" />
            <Input form={form} setForm={setForm} path={['priorI129f',0,'firstName']}   label="Beneficiary first name" />
            <Input form={form} setForm={setForm} path={['priorI129f',0,'middleName']}  label="Beneficiary middle name" />
            <Input form={form} setForm={setForm} path={['priorI129f',0,'uscisAction']} label="USCIS action/result" />
          </div>

          <div className="card" style={{ display:'grid', gap:10 }}>
            <div className="small" style={{ fontWeight: 600 }}>Every U.S. state/country since age 18</div>
            {[0,1].map((idx) => (
              <div key={idx} style={{ display:'grid', gap:10 }}>
                <Input form={form} setForm={setForm} path={['residenceSince18',idx,'state']}   label={`State ${idx+1}`} />
                <Input form={form} setForm={setForm} path={['residenceSince18',idx,'country']} label={`Country ${idx+1}`} />
                <hr style={{ border:'0', borderTop:'1px solid #e2e8f0' }} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Step 4: Beneficiary basic + other name row 0 */}
      {step === 4 && (
        <section style={{ display: 'grid', gap: 10 }}>
          <h3 style={{ margin: 0 }}>Beneficiary</h3>
          <Input form={form} setForm={setForm} path={['beneficiary','lastName']}  label="Family name (last)" />
          <Input form={form} setForm={setForm} path={['beneficiary','firstName']} label="Given name (first)" />
          <Input form={form} setForm={setForm} path={['beneficiary','middleName']} label="Middle name" />

          <h4 style={{ margin: '10px 0 0' }}>Other names used (row 1)</h4>
          <Input form={form} setForm={setForm} path={['beneficiary','otherNames',0,'lastName']}  label="Other last name" />
          <Input form={form} setForm={setForm} path={['beneficiary','otherNames',0,'firstName']} label="Other first name" />
          <Input form={form} setForm={setForm} path={['beneficiary','otherNames',0,'middleName']} label="Other middle name" />
        </section>
      )}

      {/* Step 5: Beneficiary employment rows 0 & 1 */}
      {step === 5 && (
        <section style={{ display: 'grid', gap: 16 }}>
          <h3 style={{ margin: 0 }}>Beneficiary Employment</h3>

          {[0,1].map((idx) => (
            <div key={idx} className="card" style={{ display:'grid', gap:10 }}>
              <div className="small" style={{ fontWeight: 600 }}>Employer {idx + 1}</div>
              <Input form={form} setForm={setForm} path={['beneficiary','employment',idx,'employer']} label="Employer name" />
              <Input form={form} setForm={setForm} path={['beneficiary','employment',idx,'street']}   label="Street number and name" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Input form={form} setForm={setForm} path={['beneficiary','employment',idx,'unitType']} label="Unit type (Apt/Ste/Flr)" />
                <Input form={form} setForm={setForm} path={['beneficiary','employment',idx,'unitNum']}  label="Unit number" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.8fr', gap: 10 }}>
                <Input form={form} setForm={setForm} path={['beneficiary','employment',idx,'city']}  label="City" />
                <Input form={form} setForm={setForm} path={['beneficiary','employment',idx,'state']} label="State/Province" />
                <Input form={form} setForm={setForm} path={['beneficiary','employment',idx,'zip']}   label="ZIP/Postal" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Input form={form} setForm={setForm} path={['beneficiary','employment',idx,'province']} label="Province (if any)" />
                <Input form={form} setForm={setForm} path={['beneficiary','employment',idx,'postal']}   label="Postal code (if any)" />
              </div>
              <Input form={form} setForm={setForm} path={['beneficiary','employment',idx,'country']}    label="Country" />
              <Input form={form} setForm={setForm} path={['beneficiary','employment',idx,'occupation']} label="Occupation" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Input form={form} setForm={setForm} path={['beneficiary','employment',idx,'dateFrom']} label="From (mm/dd/yyyy)" />
                <Input form={form} setForm={setForm} path={['beneficiary','employment',idx,'dateTo']}   label="To (mm/dd/yyyy or Present)" />
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Step 6: Review + Download */}
      {step === 6 && (
        <section style={{ display: 'grid', gap: 10 }}>
          <h3 style={{ margin: 0 }}>Review & download</h3>
          <div className="small">When you’re ready, download a draft of your I-129F.</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <a className="btn" href="/api/i129f/pdf-debug">Debug grid PDF</a>
            <a className="btn btn-primary" href="/api/i129f/pdf">Download I-129F (PDF)</a>
          </div>
        </section>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={back} className="btn" disabled={step === 0}>
            Back
          </button>
          <button type="button" onClick={next} className="btn" disabled={step === STEPS.length - 1}>
            Next
          </button>
        </div>
        <button type="button" onClick={save} className="btn btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save progress'}
        </button>
      </div>
    </div>
  );
}
