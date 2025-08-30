'use client';

import { useEffect, useState } from 'react';
import AiHelp from './AiHelp';

export default function I129fWizard() {
  const [values, setValues] = useState({
    petitioner_fullname: '',
    petitioner_dob: '',
    petitioner_ssn: '',
    beneficiary_fullname: '',
    notes: '',
  });

  // Generic change handler (no slicing, no maxlength)
  const onChange = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
  };

  // Optional: load saved progress (if you wire it up later)
  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('i129f_values') || '{}');
      if (cached && typeof cached === 'object') {
        setValues((v) => ({ ...v, ...cached }));
      }
    } catch {}
  }, []);

  const saveProgress = () => {
    localStorage.setItem('i129f_values', JSON.stringify(values));
    alert('Progress saved.');
  };

  return (
    <div className="card" style={{ display: 'grid', gap: 16 }}>
      <h2 style={{ margin: 0 }}>I-129F — Starter Fields</h2>

      <label className="small">
        Petitioner full name
        <br />
        <input
          type="text"
          name="petitioner_fullname"
          value={values.petitioner_fullname}
          onChange={onChange('petitioner_fullname')}
          placeholder="e.g., MARIA SANTOS"
        />
      </label>

      <label className="small">
        Petitioner date of birth
        <br />
        <input
          type="date"
          name="petitioner_dob"
          value={values.petitioner_dob}
          onChange={onChange('petitioner_dob')}
        />
      </label>

      <label className="small">
        Petitioner SSN (optional)
        <br />
        <input
          type="text"
          name="petitioner_ssn"
          value={values.petitioner_ssn}
          onChange={onChange('petitioner_ssn')}
          placeholder="123-45-6789"
          inputMode="numeric"
        />
      </label>

      <label className="small">
        Beneficiary full name
        <br />
        <input
          type="text"
          name="beneficiary_fullname"
          value={values.beneficiary_fullname}
          onChange={onChange('beneficiary_fullname')}
          placeholder="e.g., JOHN DOE"
        />
      </label>

      <label className="small">
        Notes (optional)
        <br />
        <textarea
          name="notes"
          value={values.notes}
          onChange={onChange('notes')}
          placeholder="Anything we should know?"
          rows={4}
        />
      </label>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className="btn" onClick={saveProgress}>
          Save progress
        </button>

        <button
          type="button"
          className="btn"
          onClick={async () => {
            // Example POST to your PDF filler with current values
            try {
              const payload = {
                petitioner: {
                  fullName: values.petitioner_fullname,
                  dob: values.petitioner_dob,
                  ssn: values.petitioner_ssn,
                },
                beneficiary: {
                  fullName: values.beneficiary_fullname,
                },
                notes: values.notes,
              };

              const res = await fetch('/api/i129f/fill', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers: payload }),
              });
              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                alert('PDF error: ' + (err?.error || res.statusText));
                return;
              }
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'i-129f-draft.pdf';
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
            } catch (e) {
              console.error(e);
              alert('Could not generate PDF: ' + e.message);
            }
          }}
        >
          Download Draft I-129F (PDF)
        </button>
      </div>

      {/* Keep only ONE instance of AiHelp on the page */}
      <div style={{ marginTop: 12 }}>
        <AiHelp section="petitioner" context="Form: I-129F • Section: Basic info" />
      </div>
    </div>
  );
}
