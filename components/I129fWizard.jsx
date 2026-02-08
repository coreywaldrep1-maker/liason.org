'use client';

import { useEffect, useMemo, useState } from 'react';

// Dynamic, PDF-driven I-129F wizard
// - Renders *every* fillable AcroForm field from the template PDF
// - Persists values under `data.pdf` (keyed by PDF field name)
// - Downloads a filled PDF using POST /api/i129f/pdf (no need to save first)

const PAGES = Array.from({ length: 12 }, (_, i) => i + 1);

const SECTIONS = [
  ...PAGES.map((p) => ({ key: `page${p}`, label: `Page ${p}` })),
  { key: 'review', label: 'Review & Download' },
];

const WEIGHT_FIELDS = {
  hundreds: 'Beneficiary_Information_Biographic_Information_Weight_100_Pound_Digit_Checkbox_page9_4',
  tens: 'Beneficiary_Information_Biographic_Information_Weight_10_Digit_Holder_Checkbox_page9_4',
  ones: 'Beneficiary_Information_Biographic_Information_Weight_Single_Pound_Digit_Checkbox_page9_4',
};

const DATE_HINT_RE = /(\bdate\b|dob|birth|from|to|expires|expiration|issued|signature)/i;
const TEXTAREA_HINT_RE = /(explanation|additional|details|describe|reason|provide|information)/i;

function prettyPrefix(name) {
  if (!name) return '';
  if (name.startsWith('Petitioner_')) return 'Petitioner';
  if (name.startsWith('Beneficiary_')) return 'Beneficiary';
  if (name.startsWith('Petitioners_Contact')) return 'Petitioner contact';
  if (name.startsWith('Interpreter_')) return 'Interpreter';
  if (name.startsWith('Preparer_') || name.startsWith('Prepare_')) return 'Preparer';
  if (name.startsWith('Pt') || name.startsWith('Part')) return 'Form';
  return '';
}

function stripPrefix(name) {
  return String(name || '')
    .replace(/^Petitioner_\s*/i, '')
    .replace(/^Beneficiary_\s*/i, '')
    .replace(/^Petitioners_Contact_?/i, '')
    .replace(/^Interpreter_?/i, '')
    .replace(/^Preparer_?/i, '')
    .replace(/^Prepare_?/i, '');
}

function stripPageSuffix(core) {
  return String(core || '').replace(/(?:_page|Page)(?:_)?\d{1,2}.*$/i, '');
}

function extractItemRef(name) {
  const s = String(name || '');
  const m = s.match(/(?:_page|Page)(?:_)?\d{1,2}[_ ]([^_]+)$/);
  return m ? m[1] : '';
}

function humanize(s) {
  const out = String(s || '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return out
    .replace(/\bU S\b/g, 'U.S.')
    .replace(/\bUSCIS\b/g, 'USCIS')
    .replace(/\bSSN\b/g, 'SSN')
    .replace(/\bA Number\b/gi, 'A-Number')
    .replace(/\bZIP\b/g, 'ZIP')
    .replace(/\bI 94\b/g, 'I-94');
}

function prettyFieldLabel(name) {
  const prefix = prettyPrefix(name);
  const itemRef = extractItemRef(name);
  let core = stripPrefix(name);
  core = stripPageSuffix(core);
  core = humanize(core);
  const label = prefix ? `${prefix}: ${core}` : core;
  return { label, itemRef };
}

function prettyOptionLabel(option) {
  const s = String(option || '').replace(/^\//, '');
  const lower = s.toLowerCase();

  if (lower.includes('_yes') || lower.endsWith('yes')) return 'Yes';
  if (lower.includes('_no') || lower.endsWith('no')) return 'No';

  if (/_apt_/i.test(s) || /\bapt\b/i.test(s)) return 'Apt';
  if (/_ste_/i.test(s) || /\bste\b/i.test(s) || /suite/i.test(s)) return 'Suite';
  if (/_flr_/i.test(s) || /\bflr\b/i.test(s) || /floor/i.test(s)) return 'Floor';

  if (/female/i.test(s)) return 'Female';
  if (/male/i.test(s)) return 'Male';

  return humanize(s);
}

function toStringValue(v) {
  if (v === undefined || v === null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return String(v);
}

function DateInput({ value, onChange }) {
  const iso = useMemo(() => {
    if (!value) return '';
    const parts = String(value).split('/');
    if (parts.length !== 3) return '';
    const [mm, dd, yyyy] = parts;
    if (!yyyy || !mm || !dd) return '';
    return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
  }, [value]);

  return (
    <input
      type="date"
      value={iso}
      onChange={(e) => {
        const v = e.target.value;
        if (!v) return onChange('');
        const [yyyy, mm, dd] = v.split('-');
        if (!yyyy || !mm || !dd) return onChange('');
        onChange(`${mm}/${dd}/${yyyy}`);
      }}
    />
  );
}

function Field({ name, label, itemRef, showKey, children }) {
  return (
    <label className="small" style={{ display: 'grid', gap: 6, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        {itemRef ? (
          <span
            data-no-translate
            style={{
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize: 12,
              color: '#64748b',
              whiteSpace: 'nowrap',
            }}
          >
            {itemRef}
          </span>
        ) : null}
      </div>

      {showKey ? (
        <code style={{ color: '#64748b', fontSize: 12, overflowWrap: 'anywhere' }}>{name}</code>
      ) : null}

      {children}
    </label>
  );
}

function WeightInput({ pdf, onChange, showKey }) {
  const h = toStringValue(pdf?.[WEIGHT_FIELDS.hundreds]);
  const t = toStringValue(pdf?.[WEIGHT_FIELDS.tens]);
  const o = toStringValue(pdf?.[WEIGHT_FIELDS.ones]);
  const composed = `${h}${t}${o}`.replace(/^0+(?=\d)/, '');

  return (
    <Field
      name="(weight)"
      label="Beneficiary: Biographic information — Weight (lbs)"
      itemRef="(p9)"
      showKey={showKey}
    >
      <input
        type="number"
        min={0}
        max={999}
        value={composed}
        onChange={(e) => {
          const raw = e.target.value;
          if (!raw) {
            onChange({
              [WEIGHT_FIELDS.hundreds]: '',
              [WEIGHT_FIELDS.tens]: '',
              [WEIGHT_FIELDS.ones]: '',
            });
            return;
          }
          const n = Math.max(0, Math.min(999, Number(raw)));
          const s = String(Math.trunc(n)).padStart(3, '0');
          onChange({
            [WEIGHT_FIELDS.hundreds]: s[0],
            [WEIGHT_FIELDS.tens]: s[1],
            [WEIGHT_FIELDS.ones]: s[2],
          });
        }}
      />
    </Field>
  );
}

export default function I129fWizard() {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const [showKeys, setShowKeys] = useState(false);
  const [fields, setFields] = useState([]);
  const [form, setForm] = useState({ pdf: {} });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [fieldsRes, savedRes] = await Promise.all([
          fetch('/api/i129f/fields', { cache: 'no-store', credentials: 'include' }),
          fetch('/api/i129f/load', { cache: 'no-store', credentials: 'include' }),
        ]);

        const fieldsJson = await fieldsRes.json().catch(() => null);
        const savedJson = await savedRes.json().catch(() => null);

        if (cancelled) return;

        if (fieldsJson?.ok && Array.isArray(fieldsJson.fields)) {
          const sorted = [...fieldsJson.fields].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
          setFields(sorted);
        }

        if (savedJson?.ok && savedJson.data && typeof savedJson.data === 'object') {
          const d = savedJson.data;
          setForm({
            ...d,
            pdf: d.pdf && typeof d.pdf === 'object' ? d.pdf : {},
          });
        } else {
          setForm({ pdf: {} });
        }
      } catch {
        if (!cancelled) {
          setFields([]);
          setForm({ pdf: {} });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const current = SECTIONS[step] || SECTIONS[0];

  const fieldsForCurrentPage = useMemo(() => {
    if (!current?.key?.startsWith('page')) return [];
    const page = Number(current.key.replace('page', ''));
    return fields.filter((f) => Number(f.page) === page);
  }, [current, fields]);

  function setPdfValue(name, value) {
    setForm((prev) => ({
      ...prev,
      pdf: {
        ...(prev.pdf || {}),
        [name]: value,
      },
    }));
  }

  function setPdfValues(map) {
    setForm((prev) => ({
      ...prev,
      pdf: {
        ...(prev.pdf || {}),
        ...(map || {}),
      },
    }));
  }

  async function save() {
    setSaving(true);
    try {
      const r = await fetch('/api/i129f/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ data: form }),
      });
      const j = await r.json().catch(() => null);
      if (!j?.ok) alert(j?.error || 'Save failed');
      else alert('Saved!');
    } catch (e) {
      console.error(e);
      alert('Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function downloadPdf() {
    setDownloading(true);
    try {
      const r = await fetch('/api/i129f/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ data: form }),
      });

      const ct = (r.headers.get('content-type') || '').toLowerCase();
      if (!r.ok || !ct.includes('application/pdf')) {
        const txt = await r.text().catch(() => '');
        throw new Error(txt || `Download failed (status ${r.status})`);
      }

      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'i-129f-filled.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Download failed. Check server logs.');
    } finally {
      setDownloading(false);
    }
  }

  function renderOneField(meta) {
    const name = meta.name;
    const type = meta.type;
    const options = Array.isArray(meta.options) ? meta.options : [];

    if (name === WEIGHT_FIELDS.hundreds || name === WEIGHT_FIELDS.tens || name === WEIGHT_FIELDS.ones) {
      return null;
    }

    const { label, itemRef } = prettyFieldLabel(name);
    const value = form.pdf ? form.pdf[name] : undefined;

    if (type === 'checkbox') {
      const checked = value === true || value === 'true' || value === 1;
      return (
        <Field key={name} name={name} label={label} itemRef={itemRef} showKey={showKeys}>
          <input
            type="checkbox"
            checked={!!checked}
            onChange={(e) => setPdfValue(name, e.target.checked)}
          />
        </Field>
      );
    }

    if (type === 'radio' || type === 'dropdown') {
      const currentVal = toStringValue(value);
      return (
        <Field key={name} name={name} label={label} itemRef={itemRef} showKey={showKeys}>
          <select value={currentVal} onChange={(e) => setPdfValue(name, e.target.value)}>
            <option value="">(blank)</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {prettyOptionLabel(opt)}
              </option>
            ))}
          </select>
        </Field>
      );
    }

    const v = toStringValue(value);
    const dateLike = DATE_HINT_RE.test(name);
    const useTextarea = TEXTAREA_HINT_RE.test(name) && !dateLike;

    return (
      <Field key={name} name={name} label={label} itemRef={itemRef} showKey={showKeys}>
        {dateLike ? (
          <DateInput value={v} onChange={(next) => setPdfValue(name, next)} />
        ) : useTextarea ? (
          <textarea rows={4} value={v} onChange={(e) => setPdfValue(name, e.target.value)} />
        ) : (
          <input value={v} onChange={(e) => setPdfValue(name, e.target.value)} />
        )}
      </Field>
    );
  }

  function renderPage(pageFields) {
    const pageNum = Number(current.key.replace('page', ''));
    const nodes = [];
    let weightInserted = false;

    for (const f of pageFields) {
      if (
        pageNum === 9 &&
        (f.name === WEIGHT_FIELDS.hundreds || f.name === WEIGHT_FIELDS.tens || f.name === WEIGHT_FIELDS.ones)
      ) {
        if (!weightInserted) {
          nodes.push(
            <WeightInput
              key="__weight__"
              pdf={form.pdf || {}}
              showKey={showKeys}
              onChange={(map) => setPdfValues(map)}
            />
          );
          weightInserted = true;
        }
        continue;
      }

      const node = renderOneField(f);
      if (node) nodes.push(node);
    }

    return (
      <div className="card" style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
          <h3 style={{ margin: 0 }}>Page {pageNum}</h3>
          <div className="small" style={{ color: '#64748b' }}>
            {pageFields.length} fields
          </div>
        </div>

        {pageFields.length === 0 ? (
          <div className="small" style={{ color: '#b45309' }}>
            No fields detected for this page.
          </div>
        ) : (
          <div className="grid-auto">{nodes}</div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
            ← Prev
          </button>
          <button
            className="btn"
            disabled={step >= SECTIONS.length - 1}
            onClick={() => setStep((s) => Math.min(SECTIONS.length - 1, s + 1))}
          >
            Next →
          </button>
        </div>
      </div>
    );
  }

  function renderReview() {
    return (
      <div className="card" style={{ display: 'grid', gap: 12 }}>
        <h3 style={{ margin: 0 }}>Review & Download</h3>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>

          <button className="btn" onClick={downloadPdf} disabled={downloading}>
            {downloading ? 'Generating…' : 'Download filled PDF'}
          </button>

          <a className="btn" href="/api/i129f/pdf" target="_blank" rel="noreferrer">
            Download from saved (GET)
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="card" style={{ display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SECTIONS.map((s, i) => (
              <button
                key={s.key}
                className={`btn ${i === step ? 'primary' : ''}`}
                onClick={() => setStep(i)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <label className="small" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={showKeys} onChange={(e) => setShowKeys(e.target.checked)} />
            Show field keys
          </label>
        </div>
      </div>

      {loading ? (
        <div className="card">Loading…</div>
      ) : current.key === 'review' ? (
        renderReview()
      ) : (
        renderPage(fieldsForCurrentPage)
      )}
    </div>
  );
}
