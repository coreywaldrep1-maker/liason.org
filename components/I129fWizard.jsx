// components/I129fWizard.jsx
'use client';

import { useEffect, useState } from 'react';

export default function I129fWizard() {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // keep key names stable; we'll map them to PDF later
  const [form, setForm] = useState({
    petitioner: {
      aNumber: '',
      uscisAccount: '',
      ssn: '',
      lastName: '',
      firstName: '',
      middleName: ''
    },
    classification: {
      k1: false,
      k3: false,
      i130Filed: null // true/false/null
    },
    mailing: {
      inCareOf: '',
      street: '',
      unitType: '',   // 'Apt' | 'Ste' | 'Flr'
      unitNumber: '',
      city: '',
      state: '',
      zip: '',
      province: '',
      postalCode: '',
      country: ''
    },
    mailingSameAsPhysical: true
  });

  // Load saved data on mount
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/i129f/data', { cache: 'no-store' });
        const j = await r.json();
        if (j.ok && j.data) {
          setForm(prev => ({ ...prev, ...j.data }));
        }
      } catch (_) {}
      setLoading(false);
    })();
  }, []);

  const update = (path, val) => {
    setForm(prev => {
      const parts = path.split('.');
      const next = { ...prev };
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        cur[p] = Array.isArray(cur[p]) ? [...cur[p]] : { ...(cur[p] || {}) };
        cur = cur[p];
      }
      cur[parts[parts.length - 1]] = val;
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    const r = await fetch('/api/i129f/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const j = await r.json();
    setSaving(false);
    if (!j.ok) alert('Save failed: ' + j.error);
    else alert('Saved!');
  };

  if (loading) {
    return <div className="card">Loading…</div>;
  }

  return (
    <div className="card" style={{ display: 'grid', gap: 16 }}>
      <h2 style={{ margin: 0 }}>I-129F Wizard</h2>

      {step === 0 && (
        <section style={{ display: 'grid', gap: 12 }}>
          <h3 style={{ margin: 0 }}>Part 1 — Your Information</h3>
          <div className="small">Alien Registration Number (if any)</div>
          <input
            value={form.petitioner.aNumber || ''}
            onChange={e => update('petitioner.aNumber', e.target.value)}
            placeholder="A-number"
          />
          <div className="small">USCIS Online Account Number (if any)</div>
          <input
            value={form.petitioner.uscisAccount || ''}
            onChange={e => update('petitioner.uscisAccount', e.target.value)}
            placeholder="USCIS Online Account Number"
          />
          <div className="small">U.S. Social Security Number (if any)</div>
          <input
            value={form.petitioner.ssn || ''}
            onChange={e => update('petitioner.ssn', e.target.value)}
            placeholder="SSN"
          />
          <div className="small">Family Name (Last)</div>
          <input
            value={form.petitioner.lastName || ''}
            onChange={e => update('petitioner.lastName', e.target.value)}
            placeholder="Last name"
          />
          <div className="small">Given Name (First)</div>
          <input
            value={form.petitioner.firstName || ''}
            onChange={e => update('petitioner.firstName', e.target.value)}
            placeholder="First name"
          />
          <div className="small">Middle Name</div>
          <input
            value={form.petitioner.middleName || ''}
            onChange={e => update('petitioner.middleName', e.target.value)}
            placeholder="Middle name"
          />
        </section>
      )}

      {step === 1 && (
        <section style={{ display: 'grid', gap: 12 }}>
          <h3 style={{ margin: 0 }}>Classification</h3>
          <label><input type="checkbox" checked={!!form.classification.k1} onChange={e => update('classification.k1', e.target.checked)} /> K-1 (Fiancé(e))</label>
          <label><input type="checkbox" checked={!!form.classification.k3} onChange={e => update('classification.k3', e.target.checked)} /> K-3 (Spouse)</label>

          <div className="small">If K-3, did you file Form I-130?</div>
          <div style={{ display:'flex', gap:12 }}>
            <label><input type="radio" name="i130Filed" checked={form.classification.i130Filed === true} onChange={() => update('classification.i130Filed', true)} /> Yes</label>
            <label><input type="radio" name="i130Filed" checked={form.classification.i130Filed === false} onChange={() => update('classification.i130Filed', false)} /> No</label>
            <label><input type="radio" name="i130Filed" checked={form.classification.i130Filed === null} onChange={() => update('classification.i130Filed', null)} /> N/A</label>
          </div>
        </section>
      )}

      {step === 2 && (
        <section style={{ display: 'grid', gap: 12 }}>
          <h3 style={{ margin: 0 }}>Mailing Address</h3>
          <input placeholder="In care of" value={form.mailing.inCareOf || ''} onChange={e => update('mailing.inCareOf', e.target.value)} />
          <input placeholder="Street number and name" value={form.mailing.street || ''} onChange={e => update('mailing.street', e.target.value)} />
          <div style={{ display:'flex', gap:8 }}>
            <select value={form.mailing.unitType || ''} onChange={e => update('mailing.unitType', e.target.value)}>
              <option value="">— Unit type —</option>
              <option value="Apt">Apt</option>
              <option value="Ste">Ste</option>
              <option value="Flr">Flr</option>
            </select>
            <input placeholder="Unit #" value={form.mailing.unitNumber || ''} onChange={e => update('mailing.unitNumber', e.target.value)} />
          </div>
          <input placeholder="City or Town" value={form.mailing.city || ''} onChange={e => update('mailing.city', e.target.value)} />
          <input placeholder="State" value={form.mailing.state || ''} onChange={e => update('mailing.state', e.target.value)} />
          <input placeholder="ZIP" value={form.mailing.zip || ''} onChange={e => update('mailing.zip', e.target.value)} />
          <input placeholder="Province" value={form.mailing.province || ''} onChange={e => update('mailing.province', e.target.value)} />
          <input placeholder="Postal Code" value={form.mailing.postalCode || ''} onChange={e => update('mailing.postalCode', e.target.value)} />
          <input placeholder="Country" value={form.mailing.country || ''} onChange={e => update('mailing.country', e.target.value)} />
          <label style={{ marginTop: 6 }}>
            <input type="checkbox" checked={!!form.mailingSameAsPhysical} onChange={e => update('mailingSameAsPhysical', e.target.checked)} />
            {' '}Mailing address is the same as my physical address
          </label>
        </section>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
        <button type="button" className="btn" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>Back</button>
        <div style={{ display:'flex', gap:8 }}>
          <button type="button" className="btn" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save progress'}</button>
          <button type="button" className="btn btn-primary" onClick={() => setStep(s => Math.min(2, s + 1))} disabled={step === 2}>Next</button>
        </div>
      </div>

      {/* Download */}
      <div style={{ textAlign:'right' }}>
        <a className="btn" href="/api/i129f">Download Draft I-129F (PDF)</a>
      </div>
    </div>
  );
}
