'use client';

import { useEffect, useMemo, useState } from 'react';

// -------------------------
// helpers for deep get/set
// -------------------------
function getAt(obj, path, fallback = '') {
  if (!path) return fallback;
  const parts = Array.isArray(path) ? path : path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return fallback;
    cur = cur[p];
  }
  // Always return a string for text inputs
  if (cur === undefined || cur === null) return fallback;
  return typeof cur === 'string' ? cur : String(cur);
}

function setAt(obj, path, value) {
  const parts = Array.isArray(path) ? path : path.replace(/\[(\d+)\]/g, '.$1').split('.');
  const copy = Array.isArray(obj) ? [...obj] : { ...obj };
  let cur = copy;
  for (let i = 0; i < parts.length; i++) {
    const key = parts[i];
    const last = i === parts.length - 1;
    if (last) {
      cur[key] = value;
    } else {
      const next = cur[key];
      const nextContainer =
        next == null
          ? (Number.isInteger(+parts[i + 1]) ? [] : {})
          : (Array.isArray(next) ? [...next] : { ...next });
      cur[key] = nextContainer;
      cur = cur[key];
    }
  }
  return copy;
}

// A minimal input wrapper that always binds safely
function BoundInput({ form, setForm, path, placeholder, multiline, rows = 3 }) {
  const value = getAt(form, path, '');
  const onChange = (e) => {
    setForm((prev) => setAt(prev, path, e.target.value));
  };
  if (multiline) {
    return (
      <textarea
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    );
  }
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
}

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

  // Seed all sections so bound inputs always get strings, not undefined
  const [form, setForm] = useState(() => ({
    petitioner: { lastName: '', firstName: '', middleName: '' },
    mailing: { street: '', unitType: '', unitNum: '', city: '', state: '', zip: '' },
    beneficiary: { lastName: '', firstName: '', middleName: '' },
    history: { howMet: '', dates: '', priorMarriages: '' },
  }));

  // Load saved data (IMPORTANT: include credentials)
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
        credentials: 'include', // keep cookie!
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

  function next() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  return (
    <div className="card" style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{stepButtons}</div>

      {step === 0 && (
        <section style={{ display: 'grid', gap: 10 }}>
          <h3 style={{ margin: 0 }}>Petitioner</h3>
          <div className="small">Usually the U.S. citizen filing the petition.</div>

          <Field label="Family name (last)">
            <BoundInput form={form} setForm={setForm} path="petitioner.lastName" />
          </Field>
          <Field label="Given name (first)">
            <BoundInput form={form} setForm={setForm} path="petitioner.firstName" />
          </Field>
          <Field label="Middle name">
            <BoundInput form={form} setForm={setForm} path="petitioner.middleName" />
          </Field>
        </section>
      )}

      {step === 1 && (
        <section style={{ display: 'grid', gap: 10 }}>
          <h3 style={{ margin: 0 }}>Mailing address</h3>

          <Field label="Street number and name">
            <BoundInput form={form} setForm={setForm} path="mailing.street" />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
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
        </section>
      )}

      {step === 2 && (
        <section style={{ display: 'grid', gap: 10 }}>
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
        </section>
      )}

      {step === 3 && (
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

      {step === 4 && (
        <section style={{ display: 'grid', gap: 10 }}>
          <h3 style={{ margin: 0 }}>Review & download</h3>
          <div className="small">When you’re ready, download a draft of your I-129F.</div>
          <div>
            <a className="btn btn-primary" href="/api/i129f/pdf">Download I-129F (PDF)</a>
            <span style={{ marginLeft: 10 }}>
              <a className="small" href="/api/i129f/pdf-debug" target="_blank" rel="noreferrer">
                debug overlay
              </a>
            </span>
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

function Field({ label, children }) {
  return (
    <label className="small" style={{ display: 'grid', gap: 6, minWidth: 0 }}>
      <span>{label}</span>
      <div style={{ display: 'grid', minWidth: 0 }}>{children}</div>
    </label>
  );
}
