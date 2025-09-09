// components/I129fWizard.jsx
'use client';

import { useEffect, useState } from 'react';

const STEPS = [
  { key: 'petitioner', label: 'Petitioner' },
  { key: 'mailing', label: 'Mailing address' },
  { key: 'beneficiary', label: 'Beneficiary' },
  { key: 'history', label: 'Relationship & history' },
  { key: 'review', label: 'Review & download' },
];

export default function I129fWizard() {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  // Default shape with nested objects so deep updates never explode
  const [form, setForm] = useState({
    petitioner: { lastName: '', firstName: '', middleName: '' },
    mailing: { street: '', unitType: '', unitNum: '', city: '', state: '', zip: '' },
    beneficiary: {
      lastName: '', firstName: '', middleName: '',
      alienNumber: '', ssn: '', dob: '',
      parents: {
        parent1: { lastName: '', firstName: '', middleName: '', country: '' },
        parent2: { lastName: '', firstName: '', middleName: '', country: '' },
      },
    },
    history: { howMet: '', dates: '', priorMarriages: '' },
  });

  // ---- generic shallow updater (still handy for top-level sections) ----
  function update(section, field, value) {
    setForm(prev => ({
      ...prev,
      [section]: { ...(prev[section] || {}), [field]: value }
    }));
  }

  // ---- safe helpers for deeply nested beneficiary fields ----
  function setBenField(field, value) {
    setForm(p => ({ ...p, beneficiary: { ...(p.beneficiary || {}), [field]: value } }));
  }
  function setParent(which, field, value) {
    setForm(p => ({
      ...p,
      beneficiary: {
        ...(p.beneficiary || {}),
        parents: {
          ...(p.beneficiary?.parents || {}),
          [which]: {
            ...(p.beneficiary?.parents?.[which] || {}),
            [field]: value
          }
        }
      }
    }));
  }

  // Load saved data (IMPORTANT: include credentials so the server sees your cookie)
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
          // Merge saved shape onto defaults so we keep all nested keys
          setForm(prev => ({ ...prev, ...j.data }));
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  async function save() {
    setBusy(true);
    try {
      const resp = await fetch('/api/i129f/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // <— keep this so cookie goes with the request
        body: JSON.stringify({ data: form }),
      });
      const j = await resp.json();
      if (!j?.ok) throw new Error(j?.error || 'Save failed');
      alert('Progress saved.');
    } catch (e) {
      console.error(e);
      alert('Save failed. Please make sure you are logged in.');
    } finally {
      setBusy(false);
    }
  }

  function next() { setStep(s => Math.min(s + 1, STEPS.length - 1)); }
  function back() { setStep(s => Math.max(s - 1, 0)); }

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
              background: i === step ? '#eef2ff' : '#fff'
            }}
          >
            {i + 1}. {s.label}
          </button>
        ))}
      </div>

      {/* Step 1: Petitioner */}
      {step === 0 && (
        <section style={{ display: 'grid', gap: 10 }}>
          <h3 style={{ margin: 0 }}>Petitioner</h3>
          <div className="small">Usually the U.S. citizen filing the petition.</div>
          <Field label="Family name (last)">
            <input
              value={form.petitioner.lastName || ''}
              onChange={e => update('petitioner', 'lastName', e.target.value)}
            />
          </Field>
          <Field label="Given name (first)">
            <input
              value={form.petitioner.firstName || ''}
              onChange={e => update('petitioner', 'firstName', e.target.value)}
            />
          </Field>
          <Field label="Middle name">
            <input
              value={form.petitioner.middleName || ''}
              onChange={e => update('petitioner', 'middleName', e.target.value)}
            />
          </Field>
        </section>
      )}

      {/* Step 2: Mailing */}
      {step === 1 && (
        <section style={{ display: 'grid', gap: 10 }}>
          <h3 style={{ margin: 0 }}>Mailing address</h3>
          <Field label="Street number and name">
            <input
              value={form.mailing.street || ''}
              onChange={e => update('mailing', 'street', e.target.value)}
            />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
            <Field label="Unit type (Apt/Ste/Flr)">
              <input
                value={form.mailing.unitType || ''}
                onChange={e => update('mailing', 'unitType', e.target.value)}
              />
            </Field>
            <Field label="Unit number">
              <input
                value={form.mailing.unitNum || ''}
                onChange={e => update('mailing', 'unitNum', e.target.value)}
              />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.8fr', gap: 10 }}>
            <Field label="City">
              <input
                value={form.mailing.city || ''}
                onChange={e => update('mailing', 'city', e.target.value)}
              />
            </Field>
            <Field label="State">
              <input
                value={form.mailing.state || ''}
                onChange={e => update('mailing', 'state', e.target.value)}
              />
            </Field>
            <Field label="ZIP">
              <input
                value={form.mailing.zip || ''}
                onChange={e => update('mailing', 'zip', e.target.value)}
              />
            </Field>
          </div>
        </section>
      )}

      {/* Step 3: Beneficiary */}
      {step === 2 && (
        <section style={{ display: 'grid', gap: 14 }}>
          <h3 style={{ margin: 0 }}>Beneficiary</h3>

          {/* Names */}
          <Field label="Family name (last)">
            <input
              value={form.beneficiary.lastName || ''}
              onChange={e => setBenField('lastName', e.target.value)}
            />
          </Field>
          <Field label="Given name (first)">
            <input
              value={form.beneficiary.firstName || ''}
              onChange={e => setBenField('firstName', e.target.value)}
            />
          </Field>
          <Field label="Middle name">
            <input
              value={form.beneficiary.middleName || ''}
              onChange={e => setBenField('middleName', e.target.value)}
            />
          </Field>

          {/* A-Number / SSN / DOB */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Field label="A-Number (if any)">
              <input
                value={form.beneficiary.alienNumber || ''}
                onChange={e => setBenField('alienNumber', e.target.value)}
              />
            </Field>
            <Field label="SSN (if any)">
              <input
                value={form.beneficiary.ssn || ''}
                onChange={e => setBenField('ssn', e.target.value)}
              />
            </Field>
            <Field label="Date of birth">
              <input
                type="date"
                value={form.beneficiary.dob || ''}
                onChange={e => setBenField('dob', e.target.value)}
              />
            </Field>
          </div>

          {/* Parents */}
          <div className="card" style={{ display: 'grid', gap: 10 }}>
            <div style={{ fontWeight: 600 }}>Parents</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
              <Field label="Parent 1 — Family">
                <input
                  value={form.beneficiary.parents?.parent1?.lastName || ''}
                  onChange={e => setParent('parent1', 'lastName', e.target.value)}
                />
              </Field>
              <Field label="Parent 1 — Given">
                <input
                  value={form.beneficiary.parents?.parent1?.firstName || ''}
                  onChange={e => setParent('parent1', 'firstName', e.target.value)}
                />
              </Field>
              <Field label="Parent 1 — Middle">
                <input
                  value={form.beneficiary.parents?.parent1?.middleName || ''}
                  onChange={e => setParent('parent1', 'middleName', e.target.value)}
                />
              </Field>
              <Field label="Parent 1 — Country">
                <input
                  value={form.beneficiary.parents?.parent1?.country || ''}
                  onChange={e => setParent('parent1', 'country', e.target.value)}
                />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
              <Field label="Parent 2 — Family">
                <input
                  value={form.beneficiary.parents?.parent2?.lastName || ''}
                  onChange={e => setParent('parent2', 'lastName', e.target.value)}
                />
              </Field>
              <Field label="Parent 2 — Given">
                <input
                  value={form.beneficiary.parents?.parent2?.firstName || ''}
                  onChange={e => setParent('parent2', 'firstName', e.target.value)}
                />
              </Field>
              <Field label="Parent 2 — Middle">
                <input
                  value={form.beneficiary.parents?.parent2?.middleName || ''}
                  onChange={e => setParent('parent2', 'middleName', e.target.value)}
                />
              </Field>
              <Field label="Parent 2 — Country">
                <input
                  value={form.beneficiary.parents?.parent2?.country || ''}
                  onChange={e => setParent('parent2', 'country', e.target.value)}
                />
              </Field>
            </div>
          </div>
        </section>
      )}

      {/* Step 4: Relationship & history */}
      {step === 3 && (
        <section style={{ display: 'grid', gap: 10 }}>
          <h3 style={{ margin: 0 }}>Relationship & history</h3>
          <Field label="How did you meet? (short description)">
            <textarea
              rows={4}
              value={form.history.howMet || ''}
              onChange={e => update('history', 'howMet', e.target.value)}
            />
          </Field>
          <Field label="Important dates (met/engaged/visited)">
            <textarea
              rows={3}
              value={form.history.dates || ''}
              onChange={e => update('history', 'dates', e.target.value)}
            />
          </Field>
          <Field label="Prior marriages / divorces (if any)">
            <textarea
              rows={3}
              value={form.history.priorMarriages || ''}
              onChange={e => update('history', 'priorMarriages', e.target.value)}
            />
          </Field>
        </section>
      )}

      {/* Step 5: Review */}
      {step === 4 && (
        <section style={{ display: 'grid', gap: 10 }}>
          <h3 style={{ margin: 0 }}>Review & download</h3>
          <div className="small">When you’re ready, download a draft of your I-129F.</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <a className="btn btn-primary" href="/api/i129f/pdf">Download I-129F (PDF)</a>
            <a className="small" href="/api/i129f/pdf-debug" target="_blank" rel="noreferrer">Debug overlay</a>
          </div>
        </section>
      )}

      {/* Navigation + Save */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={back} className="btn" disabled={step === 0}>Back</button>
          <button type="button" onClick={next} className="btn" disabled={step === STEPS.length - 1}>Next</button>
        </div>
        <button type="button" onClick={save} className="btn btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save progress'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="small" style={{ display: 'grid', gap: 6, minWidth: 0 }}>
      <span>{label}</span>
      <div style={{ display: 'grid', minWidth: 0 }}>
        {children}
      </div>
    </label>
  );
}
