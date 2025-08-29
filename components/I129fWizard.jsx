'use client';

import { useEffect, useMemo, useState } from 'react';
import AiHelp from './AiHelp';

const SECTION_STYLE = { display: 'grid', gap: 12 };
const INPUT_STYLE = { width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 8 };

// ---- Minimal schema (extend as needed) ----
const SECTIONS = [
  {
    id: 'petitioner',
    title: 'Petitioner',
    fields: [
      { id: 'petitioner_full_name', label: 'Full name', help: 'The person filing the petition (usually a U.S. citizen).', type: 'text' },
      { id: 'petitioner_dob', label: 'Date of birth', help: 'Format: YYYY-MM-DD.', type: 'date' },
      { id: 'petitioner_us_citizen', label: 'U.S. citizen?', help: 'Petitioner must be a U.S. citizen for K-1.', type: 'select', options: ['Yes','No'] },
      { id: 'petitioner_phone', label: 'Phone number', help: 'Best number to reach you.', type: 'text' },
      { id: 'petitioner_email', label: 'Email', help: 'We’ll use this for contact about the petition.', type: 'email' },
      { id: 'petitioner_address', label: 'Current address', help: 'Street, city, state, ZIP.', type: 'textarea' },
      // TODO: Add Alien Number (if any), SSN, etc.
    ],
  },
  {
    id: 'beneficiary',
    title: 'Beneficiary',
    fields: [
      { id: 'beneficiary_full_name', label: 'Full name', help: 'Your fiancé(e) (the person seeking the visa).', type: 'text' },
      { id: 'beneficiary_dob', label: 'Date of birth', help: 'Format: YYYY-MM-DD.', type: 'date' },
      { id: 'beneficiary_citizenship', label: 'Country of citizenship', help: 'Primary citizenship.', type: 'text' },
      { id: 'beneficiary_passport', label: 'Passport number', help: 'If available.', type: 'text' },
      { id: 'beneficiary_address', label: 'Current address', help: 'Street, city, province/state, postal code, country.', type: 'textarea' },
      // TODO: Prior names, A-number (if any), etc.
    ],
  },
  {
    id: 'relationship',
    title: 'Relationship & Intent',
    fields: [
      { id: 'met_in_person', label: 'Met in person within 2 years?', help: 'K-1 generally requires an in-person meeting within the last 2 years unless a waiver applies.', type: 'select', options: ['Yes','No (seeking waiver)'] },
      { id: 'meeting_details', label: 'How you met / meeting details', help: 'Describe how and when you met. Include dates/locations if possible.', type: 'textarea' },
      { id: 'intent_to_marry', label: 'Intent to marry within 90 days', help: 'A short statement confirming you intend to marry within 90 days of U.S. entry.', type: 'textarea' },
      // TODO: Evidence descriptions, engagement details, etc.
    ],
  },
  {
    id: 'prior_marriages',
    title: 'Prior Marriages',
    fields: [
      { id: 'petitioner_prior_marriages', label: 'Petitioner prior marriages', help: 'List names, marriage dates, divorce/death dates, and locations.', type: 'textarea' },
      { id: 'beneficiary_prior_marriages', label: 'Beneficiary prior marriages', help: 'List names, marriage dates, divorce/death dates, and locations.', type: 'textarea' },
    ],
  },
  {
    id: 'uploads',
    title: 'Uploads',
    fields: [
      { id: 'supporting_docs', label: 'Supporting documents', help: 'Upload PDFs/JPGs/PNGs (evidence of relationship, passport bio page, intent letters, etc.).', type: 'file' },
      { id: 'notes', label: 'Notes (optional)', help: 'Anything else you want us to know.', type: 'textarea' },
    ],
  },
];

export default function I129fWizard() {
  const [values, setValues] = useState({});
  const [active, setActive] = useState(SECTIONS[0].id);
  const [downloading, setDownloading] = useState(false);

  // restore from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('i129f_values');
      if (raw) setValues(JSON.parse(raw));
    } catch {}
  }, []);

  // save to localStorage
  const saveLocal = () => {
    try {
      localStorage.setItem('i129f_values', JSON.stringify(values));
      alert('Progress saved on this device.');
    } catch (e) {
      console.error(e);
      alert('Could not save locally.');
    }
  };

  // unified onChange for inputs
  const onChange = (id, v) => setValues((prev) => ({ ...prev, [id]: v }));

  // simple section nav
  const nav = useMemo(() => SECTIONS.map(s => ({ id: s.id, title: s.title })), []);

  // download draft PDF via API
  const downloadPdf = async () => {
    try {
      setDownloading(true);
      const res = await fetch('/api/i129f', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ answers: values }),
      });
      if (!res.ok) throw new Error(`PDF error: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'I-129F-draft.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Could not generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // render field types
  const Field = ({ f }) => {
    const common = { id: f.id, name: f.id };
    const val = values[f.id] ?? '';

    if (f.type === 'textarea') {
      return (
        <label className="small">
          {f.label}
          <div style={{ opacity: 0.75 }}>{f.help}</div>
          <textarea
            {...common}
            rows={4}
            value={val}
            onChange={(e) => onChange(f.id, e.target.value)}
            style={INPUT_STYLE}
          />
        </label>
      );
    }

    if (f.type === 'select') {
      return (
        <label className="small">
          {f.label}
          <div style={{ opacity: 0.75 }}>{f.help}</div>
          <select
            {...common}
            value={val}
            onChange={(e) => onChange(f.id, e.target.value)}
            style={INPUT_STYLE}
          >
            <option value="">Select…</option>
            {(f.options || []).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </label>
      );
    }

    if (f.type === 'file') {
      return (
        <label className="small">
          {f.label}
          <div style={{ opacity: 0.75 }}>{f.help}</div>
          <input
            {...common}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => onChange(f.id, Array.from(e.target.files || []).map(f => f.name))}
            style={{ ...INPUT_STYLE, padding: 4 }}
          />
          {Array.isArray(val) && val.length > 0 && (
            <div className="small" style={{ marginTop: 6 }}>
              Selected: {val.join(', ')}
            </div>
          )}
        </label>
      );
    }

    // default text/date/email
    return (
      <label className="small">
        {f.label}
        <div style={{ opacity: 0.75 }}>{f.help}</div>
        <input
          {...common}
          type={f.type || 'text'}
          value={val}
          onChange={(e) => onChange(f.id, e.target.value)}
          style={INPUT_STYLE}
        />
      </label>
    );
  };

  const activeSection = SECTIONS.find(s => s.id === active) || SECTIONS[0];

  return (
    <div className="card" style={{ display: 'grid', gap: 16 }}>
      {/* top nav */}
      <div className="small" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {nav.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActive(item.id)}
            className="btn"
            style={{
              padding: '6px 10px',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              background: active === item.id ? '#f1f5f9' : 'white'
            }}
          >
            {item.title}
          </button>
        ))}
      </div>

      {/* fields */}
      <div style={SECTION_STYLE}>
        <h3 style={{ margin: 0 }}>{activeSection.title}</h3>
        {activeSection.fields.map(f => (
          <Field key={f.id} f={f} />
        ))}
      </div>

      {/* actions */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className="btn" onClick={saveLocal}>Save progress</button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={downloadPdf}
          disabled={downloading}
        >
          {downloading ? 'Building PDF…' : 'Download Draft I-129F (PDF)'}
        </button>
      </div>

      {/* Single AI helper at the very bottom */}
      <AiHelp section={activeSection.id} context={`I-129F • ${activeSection.title}`} />
    </div>
  );
}
