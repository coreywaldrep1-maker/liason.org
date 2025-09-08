// components/I129fWizard.jsx
'use client';

import { useEffect, useState } from 'react';

const STEPS = [
  { key: 'petitioner', label: 'Petitioner' },
  { key: 'addresses', label: 'Addresses (5 years)' },
  { key: 'employment', label: 'Employment (5 years)' },
  { key: 'history', label: 'Relationship & history' },
  { key: 'review', label: 'Review & download' },
];

// small helpers
function emptyAddress() {
  return {
    street: '', unitType: 'Apt', unitNum: '',
    city: '', state: '', zip: '',
    from: '', to: ''
  };
}
function emptyEmployer() {
  return {
    name: '', occupation: '',
    street: '', unitType: 'Apt', unitNum: '',
    city: '', state: '', zip: '',
    from: '', to: ''
  };
}
function emptyOtherName() {
  return { lastName: '', firstName: '', middleName: '' };
}

export default function I129fWizard() {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    petitioner: {
      lastName: '', firstName: '', middleName: '',
      otherNames: [emptyOtherName()], // dynamic list
    },
    mailing: { street:'', unitType:'Apt', unitNum:'', city:'', state:'', zip:'' },
    addresses: [emptyAddress()],       // dynamic list (last 5 years)
    employers: [emptyEmployer()],      // dynamic list (last 5 years)
    beneficiary: { lastName:'', firstName:'', middleName:'' },
    history: { howMet:'', dates:'', priorMarriages:'' },
  });

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
          // merge shallowly but keep arrays at least length 1
          setForm(prev => {
            const merged = { ...prev, ...j.data };
            if (!merged.petitioner) merged.petitioner = prev.petitioner;
            if (!Array.isArray(merged.petitioner.otherNames) || merged.petitioner.otherNames.length === 0) {
              merged.petitioner.otherNames = [emptyOtherName()];
            }
            if (!Array.isArray(merged.addresses) || merged.addresses.length === 0) {
              merged.addresses = [emptyAddress()];
            }
            if (!Array.isArray(merged.employers) || merged.employers.length === 0) {
              merged.employers = [emptyEmployer()];
            }
            return merged;
          });
        }
      } catch {}
    })();
  }, []);

  function update(section, field, value) {
    setForm(prev => ({
      ...prev,
      [section]: { ...(prev[section] || {}), [field]: value }
    }));
  }

  function updateArray(section, index, field, value) {
    setForm(prev => {
      const arr = Array.isArray(prev[section]) ? [...prev[section]] : [];
      arr[index] = { ...(arr[index] || {}), [field]: value };
      return { ...prev, [section]: arr };
    });
  }

  function addRow(section, factory) {
    setForm(prev => {
      const arr = Array.isArray(prev[section]) ? [...prev[section]] : [];
      arr.push(factory());
      return { ...prev, [section]: arr };
    });
  }

  function removeRow(section, index) {
    setForm(prev => {
      const arr = Array.isArray(prev[section]) ? [...prev[section]] : [];
      if (arr.length > 1) arr.splice(index, 1);
      return { ...prev, [section]: arr };
    });
  }

  async function save() {
    setBusy(true);
    try {
      const resp = await fetch('/api/i129f/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',           // <— keep this
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

      {/* Step 1: Petitioner + Other Names Used */}
      {step===0 && (
        <section style={{display:'grid', gap:10}}>
          <h3 style={{margin:0}}>Petitioner</h3>
          <div className="small">Usually the U.S. citizen filing the petition.</div>
          <Field label="Family name (last)">
            <input value={form.petitioner.lastName || ''} onChange={e=>update('petitioner','lastName',e.target.value)} />
          </Field>
          <Field label="Given name (first)">
            <input value={form.petitioner.firstName || ''} onChange={e=>update('petitioner','firstName',e.target.value)} />
          </Field>
          <Field label="Middle name">
            <input value={form.petitioner.middleName || ''} onChange={e=>update('petitioner','middleName',e.target.value)} />
          </Field>

          <h4 style={{margin:'8px 0 0'}}>Other names used</h4>
          <div className="small">If you have used other names (for example, maiden name), add them below.</div>
          {form.petitioner.otherNames.map((n, i) => (
            <div key={i} className="card" style={{display:'grid', gap:10}}>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10}}>
                <Field label="Family name (last)">
                  <input value={n.lastName || ''} onChange={e=>updateArray('petitioner', 'otherNames' in form.petitioner ? 'otherNames' : 'otherNames', '', '')} />
                </Field>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Step 2: Addresses (mailing + physical last 5 years) */}
      {step===1 && (
        <section style={{display:'grid', gap:12}}>
          <h3 style={{margin:0}}>Mailing address</h3>
          <Field label="Street number and name">
            <input value={form.mailing.street || ''} onChange={e=>update('mailing','street',e.target.value)} />
          </Field>
          <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:10}}>
            <Field label="Unit type">
              <select value={form.mailing.unitType || 'Apt'} onChange={e=>update('mailing','unitType',e.target.value)}>
                <option>Apt</option>
                <option>Ste</option>
                <option>Flr</option>
              </select>
            </Field>
            <Field label="Unit number">
              <input value={form.mailing.unitNum || ''} onChange={e=>update('mailing','unitNum',e.target.value)} />
            </Field>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1.2fr 0.8fr 0.8fr', gap:10}}>
            <Field label="City">
              <input value={form.mailing.city || ''} onChange={e=>update('mailing','city',e.target.value)} />
            </Field>
            <Field label="State">
              <input value={form.mailing.state || ''} onChange={e=>update('mailing','state',e.target.value)} />
            </Field>
            <Field label="ZIP">
              <input value={form.mailing.zip || ''} onChange={e=>update('mailing','zip',e.target.value)} />
            </Field>
          </div>

          <h3 style={{margin:'12px 0 0'}}>Physical addresses — last 5 years</h3>
          <div className="small">Add previous addresses until you cover 5 years of residence.</div>
          {form.addresses.map((a, i) => (
            <div key={i} className="card" style={{display:'grid', gap:10}}>
              <div style={{fontWeight:600}}>Address {i+1}</div>
              <Field label="Street number and name">
                <input value={a.street || ''} onChange={e=>updateArray('addresses', i, 'street', e.target.value)} />
              </Field>
              <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:10}}>
                <Field label="Unit type">
                  <select value={a.unitType || 'Apt'} onChange={e=>updateArray('addresses', i, 'unitType', e.target.value)}>
                    <option>Apt</option><option>Ste</option><option>Flr</option>
                  </select>
                </Field>
                <Field label="Unit number">
                  <input value={a.unitNum || ''} onChange={e=>updateArray('addresses', i, 'unitNum', e.target.value)} />
                </Field>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1.2fr 0.8fr 0.8fr', gap:10}}>
                <Field label="City">
                  <input value={a.city || ''} onChange={e=>updateArray('addresses', i, 'city', e.target.value)} />
                </Field>
                <Field label="State/Province">
                  <input value={a.state || ''} onChange={e=>updateArray('addresses', i, 'state', e.target.value)} />
                </Field>
                <Field label="ZIP/Postal">
                  <input value={a.zip || ''} onChange={e=>updateArray('addresses', i, 'zip', e.target.value)} />
                </Field>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                <Field label="From (MM/DD/YYYY)">
                  <input type="date" value={a.from || ''} onChange={e=>updateArray('addresses', i, 'from', e.target.value)} />
                </Field>
                <Field label="To (MM/DD/YYYY)">
                  <input type="date" value={a.to || ''} onChange={e=>updateArray('addresses', i, 'to', e.target.value)} />
                </Field>
              </div>

              <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
                <button type="button" className="btn" onClick={()=>removeRow('addresses', i)} disabled={form.addresses.length<=1}>Remove</button>
              </div>
            </div>
          ))}
          <div>
            <button type="button" className="btn" onClick={()=>addRow('addresses', emptyAddress)}>+ Add another address</button>
          </div>
        </section>
      )}

      {/* Step 3: Employment last 5 years */}
      {step===2 && (
        <section style={{display:'grid', gap:12}}>
          <h3 style={{margin:0}}>Employment — last 5 years</h3>
          {form.employers.map((eRow, i) => (
            <div key={i} className="card" style={{display:'grid', gap:10}}>
              <div style={{fontWeight:600}}>Employer {i+1}</div>
              <Field label="Employer name">
                <input value={eRow.name || ''} onChange={e=>updateArray('employers', i, 'name', e.target.value)} />
              </Field>
              <Field label="Occupation / job title">
                <input value={eRow.occupation || ''} onChange={e=>updateArray('employers', i, 'occupation', e.target.value)} />
              </Field>

              <Field label="Street number and name">
                <input value={eRow.street || ''} onChange={e=>updateArray('employers', i, 'street', e.target.value)} />
              </Field>
              <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:10}}>
                <Field label="Unit type">
                  <select value={eRow.unitType || 'Apt'} onChange={e=>updateArray('employers', i, 'unitType', e.target.value)}>
                    <option>Apt</option><option>Ste</option><option>Flr</option>
                  </select>
                </Field>
                <Field label="Unit number">
                  <input value={eRow.unitNum || ''} onChange={e=>updateArray('employers', i, 'unitNum', e.target.value)} />
                </Field>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1.2fr 0.8fr 0.8fr', gap:10}}>
                <Field label="City">
                  <input value={eRow.city || ''} onChange={e=>updateArray('employers', i, 'city', e.target.value)} />
                </Field>
                <Field label="State/Province">
                  <input value={eRow.state || ''} onChange={e=>updateArray('employers', i, 'state', e.target.value)} />
                </Field>
                <Field label="ZIP/Postal">
                  <input value={eRow.zip || ''} onChange={e=>updateArray('employers', i, 'zip', e.target.value)} />
                </Field>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                <Field label="From (MM/DD/YYYY)">
                  <input type="date" value={eRow.from || ''} onChange={e=>updateArray('employers', i, 'from', e.target.value)} />
                </Field>
                <Field label="To (MM/DD/YYYY)">
                  <input type="date" value={eRow.to || ''} onChange={e=>updateArray('employers', i, 'to', e.target.value)} />
                </Field>
              </div>

              <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
                <button type="button" className="btn" onClick={()=>removeRow('employers', i)} disabled={form.employers.length<=1}>Remove</button>
              </div>
            </div>
          ))}
          <div>
            <button type="button" className="btn" onClick={()=>addRow('employers', emptyEmployer)}>+ Add another employer</button>
          </div>
        </section>
      )}

      {/* Step 4: Relationship & history (unchanged for now) */}
      {step===3 && (
        <section style={{display:'grid', gap:10}}>
          <h3 style={{margin:0}}>Relationship & history</h3>
          <Field label="How did you meet? (short description)">
            <textarea rows={4} value={form.history.howMet || ''} onChange={e=>update('history','howMet',e.target.value)} />
          </Field>
          <Field label="Important dates (met/engaged/visited)">
            <textarea rows={3} value={form.history.dates || ''} onChange={e=>update('history','dates',e.target.value)} />
          </Field>
          <Field label="Prior marriages / divorces (if any)">
            <textarea rows={3} value={form.history.priorMarriages || ''} onChange={e=>update('history','priorMarriages',e.target.value)} />
          </Field>
        </section>
      )}

      {/* Step 5: Review */}
      {step===4 && (
        <section style={{display:'grid', gap:10}}>
          <h3 style={{margin:0}}>Review & download</h3>
          <div className="small">When you’re ready, download a draft of your I-129F.</div>
          <div style={{display:'flex', gap:8}}>
            <a className="btn btn-primary" href="/api/i129f/pdf">Download I-129F (PDF)</a>
            <a className="btn" href="/api/i129f/pdf-debug">Debug: show field IDs</a>
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
  return (
    <label className="small" style={{display:'grid', gap:6, minWidth:0}}>
      <span>{label}</span>
      <div style={{display:'grid', minWidth:0}}>
        {children}
      </div>
    </label>
  );
}
