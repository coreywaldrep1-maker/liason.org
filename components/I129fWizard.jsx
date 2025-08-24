'use client';
import { useEffect, useMemo, useState } from 'react';
import AiHelp from './AiHelp'; // assumes components/AiHelp.jsx already exists

const STORAGE_KEY = 'liason:i129f';

const DEFAULT_STEPS = [
  {
    id: 'petitioner',
    title: 'Petitioner',
    fields: [
      { id: 'petitioner_full_name', label: 'Full name', type: 'text', required: true },
      { id: 'petitioner_dob', label: 'Date of birth (YYYY-MM-DD)', type: 'text' },
      { id: 'petitioner_us_citizen', label: 'U.S. citizen?', type: 'select', options: ['Yes','No'] },
      { id: 'petitioner_address', label: 'Address', type: 'textarea' },
      { id: 'petitioner_phone', label: 'Phone', type: 'text' },
      { id: 'petitioner_email', label: 'Email', type: 'text' },
    ],
  },
  {
    id: 'beneficiary',
    title: 'Beneficiary',
    fields: [
      { id: 'beneficiary_full_name', label: 'Full name', type: 'text', required: true },
      { id: 'beneficiary_dob', label: 'Date of birth (YYYY-MM-DD)', type: 'text' },
      { id: 'beneficiary_birth_country', label: 'Birth country', type: 'text' },
      { id: 'beneficiary_passport_number', label: 'Passport number', type: 'text' },
      { id: 'beneficiary_address', label: 'Address', type: 'textarea' },
    ],
  },
  {
    id: 'relationship',
    title: 'Relationship',
    fields: [
      { id: 'met_in_person', label: 'Have you met in person?', type: 'select', options: ['Yes','No'] },
      { id: 'met_date', label: 'Most recent in-person date (YYYY-MM-DD)', type: 'text' },
      { id: 'how_met', label: 'How you met (short summary)', type: 'textarea' },
      { id: 'intent_to_marry_90_days', label: 'Intent to marry within 90 days?', type: 'select', options: ['Yes','No'] },
    ],
  },
  {
    id: 'history',
    title: 'Prior filings / marriages',
    fields: [
      { id: 'prior_filings', label: 'Any prior I-129F filings?', type: 'textarea' },
      { id: 'petitioner_prior_marriages', label: 'Petitioner prior marriages?', type: 'textarea' },
      { id: 'beneficiary_prior_marriages', label: 'Beneficiary prior marriages?', type: 'textarea' },
      { id: 'notes', label: 'Notes (optional)', type: 'textarea' },
    ],
  },
];

export default function I129fWizard() {
  const steps = DEFAULT_STEPS;
  const [idx, setIdx] = useState(0);
  const [values, setValues] = useState({});

  // Load/save local storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setValues(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(values)); } catch {}
  }, [values]);

  const step = steps[idx];
  const percent = Math.round(((idx + 1) / steps.length) * 100);

  function update(id, v) {
    setValues((old) => ({ ...old, [id]: v }));
  }

  function next() { if (idx < steps.length - 1) setIdx(idx + 1); }
  function prev() { if (idx > 0) setIdx(idx - 1); }

  async function downloadDraft() {
    const res = await fetch('/api/i129f', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({
        profileName: values.petitioner_full_name || 'I-129F_Draft',
        values,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(()=>null);
      alert(j?.error || 'Could not generate PDF.');
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'I-129F_Draft_Liason.pdf'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="card" style={{display:'grid', gap:12}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h3 style={{margin:0}}>{step.title}</h3>
        <div className="small">{percent}%</div>
      </div>

      <div style={{display:'grid', gap:12}}>
        {step.fields.map((f) => (
          <label key={f.id} className="small">
            {f.label}{f.required ? ' *' : ''}
            <br/>
            {f.type === 'textarea' ? (
              <textarea
                rows={4}
                value={values[f.id] || ''}
                onChange={(e)=>update(f.id, e.target.value)}
              />
            ) : f.type === 'select' ? (
              <select
                value={values[f.id] || ''}
                onChange={(e)=>update(f.id, e.target.value)}
              >
                <option value="">Select…</option>
                {(f.options || []).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={values[f.id] || ''}
                onChange={(e)=>update(f.id, e.target.value)}
              />
            )}
          </label>
        ))}
      </div>

      {/* Friendly AI panel for this section */}
      <AiHelp section={step.id} context="Form: I-129F" />

      <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
        <button className="btn" onClick={prev} disabled={idx===0}>Back</button>
        <button className="btn" onClick={next} disabled={idx===steps.length-1}>Next</button>
        <button className="btn" onClick={downloadDraft}>Download Draft PDF</button>
        <a className="btn btn-primary" href="/checkout/us/i-129f">Continue to Checkout</a>
      </div>

      <div className="small" style={{color:'#64748b'}}>
        Not legal advice. For legal advice, consult a licensed attorney.
      </div>
    </div>
  );
}
