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

const EMPTY = {
  petitioner: { lastName:'', firstName:'', middleName:'', otherNames: [] },
  mailing: { street:'', unitType:'', unitNum:'', city:'', state:'', zip:'' },
  beneficiary: { lastName:'', firstName:'', middleName:'', otherNames: [] },
  history: { howMet:'', dates:'', priorMarriages:'' },
};

export default function I129fWizard() {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(EMPTY);

  // ---- Load saved data (IMPORTANT: include credentials so the server sees your cookie)
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch('/api/i129f/load', {
          cache: 'no-store',
          credentials: 'include',
        });
        if (!resp.ok) return; // not an error; just means no saved data yet
        const j = await resp.json();
        if (j?.ok && j.data) {
          // Merge shallowly to keep missing sections
          setForm(prev => ({ ...prev, ...j.data }));
        }
      } catch {}
    })();
  }, []);

  // ---- Helpers to update state
  function update(section, field, value) {
    setForm(prev => ({
      ...prev,
      [section]: { ...(prev[section] || {}), [field]: value ?? '' },
    }));
  }

  // Petitioner / Beneficiary "other names"
  function addOtherName(who) {
    setForm(prev => ({
      ...prev,
      [who]: {
        ...(prev[who] || {}),
        otherNames: [ ...(prev[who]?.otherNames || []), { lastName:'', firstName:'', middleName:'' } ],
      },
    }));
  }
  function updateOtherName(who, idx, field, value) {
    setForm(prev => {
      const arr = [ ...(prev[who]?.otherNames || []) ];
      arr[idx] = { ...(arr[idx] || {}), [field]: value ?? '' };
      return { ...prev, [who]: { ...(prev[who] || {}), otherNames: arr } };
    });
  }
  function removeOtherName(who, idx) {
    setForm(prev => {
      const arr = [ ...(prev[who]?.otherNames || []) ];
      arr.splice(idx, 1);
      return { ...prev, [who]: { ...(prev[who] || {}), otherNames: arr } };
    });
  }

  // ---- Save to DB
  async function save() {
    setBusy(true);
    try {
      const resp = await fetch('/api/i129f/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // <— keep this so auth cookie is sent
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

  // ---- Download PDF using current in-memory data
  async function downloadPdfNow() {
    try {
      const resp = await fetch('/api/i129f/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ data: form }),
      });
      if (!resp.ok) {
        const j = await resp.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${resp.status}`);
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'i-129f-filled.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(`Download failed: ${e.message}`);
      console.error(e);
    }
  }

  function next() { setStep(s => Math.min(s + 1, STEPS.length - 1)); }
  function back() { setStep(s => Math.max(s - 1, 0)); }

  return (
    <div className="card" style={{display:'grid', gap:12}}>
      {/* Stepper */}
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

      {/* Petitioner */}
      {step===0 && (
        <section style={{display:'grid', gap:10, minWidth:0}}>
          <h3 style={{margin:0}}>Petitioner</h3>
          <div className="small">Usually the U.S. citizen filing the petition.</div>

          <Field label="Family name (last)">
            <input
              value={form.petitioner.lastName || ''}
              onChange={e=>update('petitioner','lastName',e.target.value)}
            />
          </Field>
          <Field label="Given name (first)">
            <input
              value={form.petitioner.firstName || ''}
              onChange={e=>update('petitioner','firstName',e.target.value)}
            />
          </Field>
          <Field label="Middle name">
            <input
              value={form.petitioner.middleName || ''}
              onChange={e=>update('petitioner','middleName',e.target.value)}
            />
          </Field>

          {/* Other names used */}
          <div className="small" style={{marginTop:6, fontWeight:600}}>Other names used (optional)</div>
          {(form.petitioner.otherNames || []).map((n, idx) => (
            <div key={idx} style={{display:'grid', gap:8, gridTemplateColumns:'1fr 1fr 1fr auto', alignItems:'end'}}>
              <Field label="Last name">
                <input
                  value={n.lastName || ''}
                  onChange={e=>updateOtherName('petitioner', idx, 'lastName', e.target.value)}
                />
              </Field>
              <Field label="First name">
                <input
                  value={n.firstName || ''}
                  onChange={e=>updateOtherName('petitioner', idx, 'firstName', e.target.value)}
                />
              </Field>
              <Field label="Middle name">
                <input
                  value={n.middleName || ''}
                  onChange={e=>updateOtherName('petitioner', idx, 'middleName', e.target.value)}
                />
              </Field>
              <button type="button" className="btn" onClick={()=>removeOtherName('petitioner', idx)}>Remove</button>
            </div>
          ))}
          <div>
            <button type="button" className="btn" onClick={()=>addOtherName('petitioner')}>Add another name</button>
          </div>
        </section>
      )}

      {/* Mailing */}
      {step===1 && (
        <section style={{display:'grid', gap:10, minWidth:0}}>
          <h3 style={{margin:0}}>Mailing address</h3>
          <Field label="Street number and name">
            <input
              value={form.mailing.street || ''}
              onChange={e=>update('mailing','street',e.target.value)}
            />
          </Field>
          <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:10}}>
            <Field label="Unit type (Apt/Ste/Flr)">
              <input
                value={form.mailing.unitType || ''}
                onChange={e=>update('mailing','unitType',e.target.value)}
              />
            </Field>
            <Field label="Unit number">
              <input
                value={form.mailing.unitNum || ''}
                onChange={e=>update('mailing','unitNum',e.target.value)}
              />
            </Field>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1.2fr 0.8fr 0.8fr', gap:10}}>
            <Field label="City">
              <input
                value={form.mailing.city || ''}
                onChange={e=>update('mailing','city',e.target.value)}
              />
            </Field>
            <Field label="State">
              <input
                value={form.mailing.state || ''}
                onChange={e=>update('mailing','state',e.target.value)}
              />
            </Field>
            <Field label="ZIP">
              <input
                value={form.mailing.zip || ''}
                onChange={e=>update('mailing','zip',e.target.value)}
              />
            </Field>
          </div>
        </section>
      )}

      {/* Beneficiary */}
      {step===2 && (
        <section style={{display:'grid', gap:10, minWidth:0}}>
          <h3 style={{margin:0}}>Beneficiary</h3>
          <Field label="Family name (last)">
            <input
              value={form.beneficiary.lastName || ''}
              onChange={e=>update('beneficiary','lastName',e.target.value)}
            />
          </Field>
          <Field label="Given name (first)">
            <input
              value={form.beneficiary.firstName || ''}
              onChange={e=>update('beneficiary','firstName',e.target.value)}
            />
          </Field>
          <Field label="Middle name">
            <input
              value={form.beneficiary.middleName || ''}
              onChange={e=>update('beneficiary','middleName',e.target.value)}
            />
          </Field>

          {/* Other names used */}
          <div className="small" style={{marginTop:6, fontWeight:600}}>Other names used (optional)</div>
          {(form.beneficiary.otherNames || []).map((n, idx) => (
            <div key={idx} style={{display:'grid', gap:8, gridTemplateColumns:'1fr 1fr 1fr auto', alignItems:'end'}}>
              <Field label="Last name">
                <input
                  value={n.lastName || ''}
                  onChange={e=>updateOtherName('beneficiary', idx, 'lastName', e.target.value)}
                />
              </Field>
              <Field label="First name">
                <input
                  value={n.firstName || ''}
                  onChange={e=>updateOtherName('beneficiary', idx, 'firstName', e.target.value)}
                />
              </Field>
              <Field label="Middle name">
                <input
                  value={n.middleName || ''}
                  onChange={e=>updateOtherName('beneficiary', idx, 'middleName', e.target.value)}
                />
              </Field>
              <button type="button" className="btn" onClick={()=>removeOtherName('beneficiary', idx)}>Remove</button>
            </div>
          ))}
          <div>
            <button type="button" className="btn" onClick={()=>addOtherName('beneficiary')}>Add another name</button>
          </div>
        </section>
      )}

      {/* Relationship & history */}
      {step===3 && (
        <section style={{display:'grid', gap:10, minWidth:0}}>
          <h3 style={{margin:0}}>Relationship & history</h3>
          <Field label="How did you meet? (short description)">
            <textarea
              rows={4}
              value={form.history.howMet || ''}
              onChange={e=>update('history','howMet',e.target.value)}
            />
          </Field>
          <Field label="Important dates (met/engaged/visited)">
            <textarea
              rows={3}
              value={form.history.dates || ''}
              onChange={e=>update('history','dates',e.target.value)}
            />
          </Field>
          <Field label="Prior marriages / divorces (if any)">
            <textarea
              rows={3}
              value={form.history.priorMarriages || ''}
              onChange={e=>update('history','priorMarriages',e.target.value)}
            />
          </Field>
        </section>
      )}

      {/* Review & download */}
      {step===4 && (
        <section style={{display:'grid', gap:10, minWidth:0}}>
          <h3 style={{margin:0}}>Review & download</h3>
          <div className="small">Download a draft of your I-129F using the info on this page (no need to click Save first).</div>
          <div style={{display:'flex', gap:8}}>
            <button type="button" className="btn" onClick={()=>alert(JSON.stringify(form, null, 2))}>Preview JSON</button>
            <button type="button" className="btn btn-primary" onClick={downloadPdfNow}>
              Download I-129F (PDF)
            </button>
          </div>
        </section>
      )}

      {/* Footer nav + Save */}
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
  // minWidth:0 prevents the 1-character “squeeze” bug in flex/grid contexts
  return (
    <label className="small" style={{ display: 'grid', gap: 6, minWidth: 0 }}>
      <span>{label}</span>
      <div style={{ display: 'grid', minWidth: 0 }}>
        {children}
      </div>
    </label>
  );
}
