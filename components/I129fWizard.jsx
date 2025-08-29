'use client';

import { useEffect, useMemo, useState } from 'react';
import AiHelp from './AiHelp';

const SECTION_STYLE = { display: 'grid', gap: 12 };
const INPUT_STYLE = {
  width: '100%',
  padding: 10,
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  lineHeight: 1.4,
  fontSize: 14,
  boxSizing: 'border-box',
};

// ---- Minimal schema (extend as needed) ----
const SECTIONS = [
  {
    id: 'petitioner',
    title: 'Petitioner',
    fields: [
      { id: 'petitioner_full_name', label: 'Full name', help: 'The person filing the petition (usually a U.S. citizen).', type: 'text', autoComplete: 'name' },
      { id: 'petitioner_dob', label: 'Date of birth', help: 'Format: YYYY-MM-DD.', type: 'date' },
      { id: 'petitioner_us_citizen', label: 'U.S. citizen?', help: 'Petitioner must be a U.S. citizen for K-1.', type: 'select', options: ['Yes','No'] },
      { id: 'petitioner_phone', label: 'Phone number', help: 'Best number to reach you.', type: 'tel', autoComplete: 'tel' },
      { id: 'petitioner_email', label: 'Email', help: 'We’ll use this for contact about the petition.', type: 'email', autoComplete: 'email' },
      { id: 'petitioner_address', label: 'Current address', help: 'Street, city, state, ZIP.', type: 'textarea', rows: 3 },
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
      { id: 'beneficiary_address', label: 'Current address', help: 'Street, city, province/state, postal code, country.', type: 'textarea', rows: 3 },
    ],
  },
  {
    id: 'relationship',
    title: 'Relationship & Intent',
    fields: [
      { id: 'met_in_person', label: 'Met in person within 2 years?', help: 'K-1 generally requires an in-person meeting within the last 2 years unless a waiver applies.', type: 'select', options: ['Yes','No (seeking waiver)'] },
      { id: 'meeting_details', label: 'How you met / meeting details', help: 'Describe how and when you met. Include dates/locations if possible.', type: 'textarea', rows: 5 },
      { id: 'intent_to_marry', label: 'Intent to marry within 90 days', help: 'A short statement confirming you intend to marry within 90 days of U.S. entry.', type: 'textarea', rows: 4 },
    ],
  },
  {
    id: 'prior_marriages',
    title: 'Prior Marriages',
    fields: [
      { id: 'petitioner_prior_marriages', label: 'Petitioner prior marriages', help: 'List names, marriage dates, divorce/death dates, and locations.', type: 'textarea', rows: 5 },
      { id: 'beneficiary_prior_marriages', label: 'Beneficiary prior marriages', help: 'List names, marriage dates, divorce/death dates, and locations.', type: 'textarea', rows: 5 },
    ],
  },
  {
    id: 'uploads',
    title: 'Uploads',
    fields: [
      { id: 'supporting_docs', label: 'Supporting documents', help: 'Upload PDFs/JPGs/PNGs (evidence of relationship, passport bio page, intent letters, etc.).', type: 'file' },
      { id: 'notes', label: 'Notes (optional)', help: 'Anything else you want us to know.', type: 'textarea', rows: 4 },
    ],
  },
];

export default function I129fWizard() {
  const [values, setValues] = useState({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const active = SECTIONS[activeIndex]?.id ?? SECTIONS[0].id;
  const total = SECTIONS.length;

  // restore from localStorage only once
  useEffect(() => {
    try {
      const raw = localStorage.getItem('i129f_values');
      if (raw) setValues(JSON.parse(raw));
    } catch {}
  }, []);

  const saveLocal = () => {
    try {
      localStorage.setItem('i129f_values', JSON.stringify(values));
      alert('Progress saved on this device.');
    } catch (e) {
      console.error(e);
      alert('Could not save locally.');
    }
  };

  // unified onChange (use currentTarget to avoid strange IME issues)
  const onChange = (id, v) => {
    setValues(prev => ({ ...prev, [id]: v }));
  };

  const goNext = () => setActiveIndex(i => Math.min(i + 1, total - 1));
  const goBack = () => setActiveIndex(i => Math.max(i - 1, 0));

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
    const common = {
      id: f.id,
      name: f.id,
      autoComplete: f.autoComplete || 'off',
      inputMode: f.type === 'tel' ? 'tel' : undefined,
      'aria-label': f.label,
    };
    const val = values[f.id] ?? '';

    if (f.type === 'textarea') {
      return (
        <div>
          <label htmlFor={f.id} className="small" style={{ display: 'block', marginBottom: 4 }}>
            {f.label}
          </label>
          <div className="small" style={{ opacity: 0.75, marginBottom: 6 }}>{f.help}</div>
          <textarea
            {...common}
            rows={f.rows || 4}
            value={val}
            onChange={(e) => onChange(f.id, e.currentTarget.value)}
            style={{ ...INPUT_STYLE, resize: 'vertical' }}
            autoCapitalize="sentences"
            autoCorrect="on"
          />
        </div>
      );
    }

    if (f.type === 'select') {
      return (
        <div>
          <label htmlFor={f.id} className="small" style={{ display: 'block', marginBottom: 4 }}>
            {f.label}
          </label>
          <div className="small" style={{ opacity: 0.75, marginBottom: 6 }}>{f.help}</div>
          <select
            {...common}
            value={val}
            onChange={(e) => onChange(f.id, e.currentTarget.value)}
            style={INPUT_STYLE}
          >
            <option value="">Select…</option>
            {(f.options || []).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }

    if (f.type === 'file') {
      return (
        <div>
          <label htmlFor={f.id} className="small" style={{ display: 'block', marginBottom: 4 }}>
            {f.label}
          </label>
          <div className="small" style={{ opacity: 0.75, marginBottom: 6 }}>{f.help}</div>
          <input
            {...common}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) =>
              onChange(
                f.id,
                Array.from(e.currentTarget.files || []).map(file => file.name)
              )
            }
            style={{ ...INPUT_STYLE, padding: 6 }}
          />
          {Array.isArray(val) && val.length > 0 && (
            <div className="small" style={{ marginTop: 6 }}>
              Selected: {val.join(', ')}
            </div>
          )}
        </div>
      );
    }

    // default: text/date/email/tel
    return (
      <div>
        <label htmlFor={f.id} className="small" style={{ display: 'block', marginBottom: 4 }}>
          {f.label}
        </label>
        <div className="small" style={{ opacity: 0.75, marginBottom: 6 }}>{f.help}</div>
        <input
          {...common}
          type={f.type || 'text'}
          value={val}
          onChange={(e) => onChange(f.id, e.currentTarget.value)}
          style={INPUT_STYLE}
          autoCapitalize="sentences"
          autoCorrect="on"
        />
      </div>
    );
  };

  const activeSection = SECTIONS[activeIndex];

  return (
    <div className="card" style={{ display: 'grid', gap: 16 }}>
      {/* header / progress */}
      <div className="small" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <strong>{activeSection.title}</strong>
        <span style={{ opacity: 0.7 }}>
          • Step {activeIndex + 1} of {total}
        </span>
      </div>

      {/* fields */}
      <div style={SECTION_STYLE}>
        {activeSection.fields.map(f => (
          <Field key={f.id} f={f} />
        ))}
      </div>

      {/* actions (Back / Next / Save / Download) */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn"
          onClick={goBack}
          disabled={activeIndex === 0}
          aria-disabled={activeIndex === 0}
        >
          ← Back
        </button>

        <button
          type="button"
          className="btn"
          onClick={goNext}
          disabled={activeIndex === total - 1}
          aria-disabled={activeIndex === total - 1}
        >
          Next →
        </button>

        <button type="button" className="btn" onClick={saveLocal}>
          Save progress
        </button>

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
      <AiHelp key={activeSection.id} section={activeSection.id} context={`I-129F • ${activeSection.title}`} />
    </div>
  );
}
