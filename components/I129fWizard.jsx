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
  const [form, setForm] = useState({
    petitioner: { lastName:'', firstName:'', middleName:'' },
    mailing: { street:'', unitType:'', unitNum:'', city:'', state:'', zip:'' },
    beneficiary: { lastName:'', firstName:'', middleName:'' },
    history: { howMet:'', dates:'', priorMarriages:'' },
  });

  // Load saved progress (send cookies)
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/i129f/load', {
          cache: 'no-store',
          credentials: 'include',
        });
        if (!r.ok) return; // likely not logged in
        const j = await r.json();
        if (j?.ok && j.data) setForm(prev => ({ ...prev, ...j.data }));
      } catch {}
    })();
  }, []);

  function update(section, field, value) {
    setForm(prev => ({
      ...prev,
      [section]: { ...(prev[section] || {}), [field]: value }
    }));
  }

  async function save() {
    setBusy(true);
    try {
      const r = await fetch('/api/i129f/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // IMPORTANT for auth cookie
        body: JSON.stringify({ data: form }),
      });
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error || 'Save failed');
      alert('Progress saved.');
    } catch (e) {
      console.error(e);
      alert('Save failed. Please ensure you are logged in.');
    } finally {
      setBusy(false);
    }
  }

  function next() { setStep(s => Math.min(s + 1, STEPS.length - 1)); }
  function back() { setStep(s => Math.max(s - 1, 0)); }

  return (
    <div className="card" style={{display:'grid', gap:12}}>
      <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
        {STEPS.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setStep(i)}
            className="small"
            style={{
              padding:'6px 10px',
              border:'1px solid #e2e8f0',
              borderRadius:8,
              background: i===step ? '#eef2ff' : '#fff'
            }}
          >
            {i+1}. {s.label}
          </button>
        ))}
      </div>

      {step===0 && (
        <section style={{display:'grid', gap:10}}>
          <h3 style={{margin:0}}>Petitioner</h3>
          <div className="small">Usually the U.S. citizen filing the petition.</div>
          <Field label="Family name (last)">
            <input
              type="text"
              value={form.petitioner.lastName}
              onChange={e=>update('petitioner','lastName',e.target.value)}
              placeholder="e.g., Smith"
            />
          </Field>
          <Field label="Given name (first)">
            <input
              type="text"
              value={form.petitioner.firstName}
              onChange={e=>update('petitioner','firstName',e.target.value)}
              placeholder="e.g., John"
            />
          </Field>
          <Field label="Middle name">
            <input
              type="text"
              value={form.petitioner.middleName}
              onChange={e=>update('petitioner','middleName',e.target.value)}
              placeholder=""
            />
          </Field>
        </section>
      )}

      {step===1 && (
        <section style={{display:'grid', gap:10}}>
          <h3 style={{margin:0}}>Mailing address</h3>
          <Field label="Street number and name">
            <input
              type="text"
              value={form.mailing.street}
              onChange={e=>update('mailing','street',e.target.value)}
              placeholder="123 Main St"
            />
          </Field>
          <Field label="Unit type (Apt/Ste/Flr)">
            <input
              type="text"
              value={form.mailing.unitType}
              onChange={e=>update('mailing','unitType',e.target.value)}
              placeholder="Apt / Ste / Flr"
            />
          </Field>
          <Field label="Unit number">
            <input
              type="text"
              value={form.mailing.unitNum}
              onChange={e=>update('mailing','unitNum',e.target.value)}
              placeholder="e.g., 4B"
            />
          </Field>
          <Field label="City">
            <input
              type="text"
              value={form.mailing.city}
              onChange={e=>update('mailing','city',e.target.value)}
            />
          </Field>
          <Field label="State">
            <input
              type="text"
              value={form.mailing.state}
              onChange={e=>update('mailing','state',e.target.value)}
              placeholder="e.g., CA"
            />
          </Field>
          <Field label="ZIP">
            <input
              type="text"
              inputMode="numeric"
              value={form.mailing.zip}
              onChange={e=>update('mailing','zip',e.target.value)}
              placeholder="e.g., 94105"
            />
          </Field>
        </section>
      )}

      {step===2 && (
        <section style={{display:'grid', gap:10}}>
          <h3 style={{margin:0}}>Beneficiary</h3>
          <Field label="Family name (last)">
            <input
              type="text"
              value={form.beneficiary.lastName}
              onChange={e=>update('beneficiary','lastName',e.target.value)}
            />
          </Field>
          <Field label="Given name (first)">
            <input
              type="text"
              value={form.beneficiary.firstName}
              onChange={e=>update('beneficiary','firstName',e.target.value)}
            />
          </Field>
          <Field label="Middle name">
            <input
              type="text"
              value={form.beneficiary.middleName}
              onChange={e=>update('beneficiary','middleName',e.target.value)}
            />
          </Field>
        </section>
      )}

      {step===3 && (
        <section style={{display:'grid', gap:10}}>
          <h3 style={{margin:0}}>Relationship & history</h3>
          <Field label="How did you meet? (short description)">
            <textarea
              rows={4}
              value={form.history.howMet}
              onChange={e=>update('history','howMet',e.target.value)}
            />
          </Field>
          <Field label="Important dates (met/engaged/visited) (MM/DD/YYYY)">
            <textarea
              rows={3}
              value={form.history.dates}
              onChange={e=>update('history','dates',e.target.value)}
              placeholder="e.g., Met 02/14/2021; Engaged 11/10/2023"
            />
          </Field>
          <Field label="Prior marriages / divorces (if any)">
            <textarea
              rows={3}
              value={form.history.priorMarriages}
              onChange={e=>update('history','priorMarriages',e.target.value)}
            />
          </Field>
        </section>
      )}

      {step===4 && (
        <section style={{display:'grid', gap:10}}>
          <h3 style={{margin:0}}>Review & download</h3>
          <div className="small">When you’re ready, download a draft of your I-129F.</div>
          <div>
            <a className="btn btn-primary" href="/api/i129f/pdf">Download I-129F (PDF)</a>
          </div>
        </section>
      )}

      <div style={{display:'flex', gap:8, justifyContent:'space-between'}}>
        <div style={{display:'flex', gap:8}}>
          <button type="button" onClick={back} className="btn" disabled={step===0}>Back</button>
          <button type="button" onClick={next} className="btn" disabled={step===STEPS.length-1}>Next</button>
        </div>
        <button type="button" onClick={save} className="btn btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save progress'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  // minWidth:0 prevents “1ch” clamp in flex/grid contexts
  return (
    <label className="small" style={{display:'grid', gap:6, minWidth:0}}>
      <span>{label}</span>
      <div style={{display:'grid', minWidth:0}}>
        {children}
      </div>
    </label>
  );
}
