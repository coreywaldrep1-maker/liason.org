// components/I129fWizard.jsx
'use client';

import { useEffect, useMemo, useRef, useState, createContext, useContext } from 'react';

/**
 * This wizard renders inputs for *all* Acrobat field names found in your I-129F PDF template.
 * It pulls the field list from /api/i129f/fields (so it matches your PDF exactly),
 * saves values into form.pdf[FIELD_NAME], and lets you download a draft PDF to verify population.
 *
 * Sections 2–10 are intentionally the “bulk” of the template fields so you can quickly see
 * what is / isn’t populating, then later you can replace these with nicer, curated inputs.
 */

/* ---------- Sections ---------- */
const SECTIONS = [
  { key: 'p1_ident', label: 'Part 1 — Petitioner (Identity / Classification)' },
  { key: 'p1_addr',  label: 'Part 1 — Addresses & Contact' },
  { key: 'p1_emp',   label: 'Part 1 — Employment' },
  { key: 'p1_par',   label: 'Part 1 — Parents / Other / Additional' },

  { key: 'p2_ident', label: 'Part 2 — Beneficiary (Identity)' },
  { key: 'p2_addr',  label: 'Part 2 — Beneficiary Addresses' },
  { key: 'p2_emp',   label: 'Part 2 — Beneficiary Employment' },
  { key: 'p2_par',   label: 'Part 2 — Beneficiary Parents / Other' },

  { key: 'p5_7',     label: 'Parts 5–7 — Petitioner Signature / Interpreter' },
  { key: 'p8',       label: 'Part 8 — Preparer & Additional Info' },

  { key: 'review',   label: 'Review & Download' },
];

/* ---------- Numbering context (keeps your old "1., 2., 3." style) ---------- */
const NumCtx = createContext({ show: true, next: () => '' });

export default function I129fWizard() {
  const [step, setStep] = useState(0);
  const [showNums, setShowNums] = useState(true);
  const [showNames, setShowNames] = useState(true);
  const [filter, setFilter] = useState('');
  const counterRef = useRef(0);

  const [form, setForm] = useState({ pdf: {} });

  const [pdfFieldList, setPdfFieldList] = useState([]); // from /api/i129f/fields
  const [loadingFields, setLoadingFields] = useState(true);
  const [status, setStatus] = useState({ saving: false, savedAt: null, error: null });

  const active = SECTIONS[step]?.key || 'review';

  function resetCounter() { counterRef.current = 0; }
  function nextNumber() { counterRef.current += 1; return String(counterRef.current); }

  /* ---- helpers: update form.pdf[FIELD_NAME] ---- */
  function setPdfValue(name, value) {
    setForm(prev => {
      const next = structuredClone(prev ?? {});
      if (!next.pdf || typeof next.pdf !== 'object') next.pdf = {};
      next.pdf[name] = value;
      return next;
    });
  }

  function getPdfValue(name) {
    return form?.pdf?.[name];
  }

  /* ---- group fields into Sections 1–10 (based on your naming convention) ---- */
  const fieldsBySection = useMemo(() => {
    const out = {
      p1_ident: [],
      p1_addr: [],
      p1_emp: [],
      p1_par: [],
      p2_ident: [],
      p2_addr: [],
      p2_emp: [],
      p2_par: [],
      p5_7: [],
      p8: [],
      other: [],
    };

    const pick = (name, type) => {
      const n = String(name || '').toLowerCase();

      const isPet = n.startsWith('petitioner');
      const isBen = n.startsWith('beneficiary');
      const isInterp = n.startsWith('interpreter');
      const isPrep = n.startsWith('prepare');
      const isPetSig = n.startsWith('petitioners'); // petitioner's contact/signature fields
      const isAdd = n.startsWith('additional') || n.startsWith('continued');

      if (isInterp || isPetSig) return 'p5_7';
      if (isPrep || isAdd) return 'p8';

      const hasAddrWords =
        n.includes('address') ||
        n.includes('mailing') ||
        n.includes('physical') ||
        n.includes('residence') ||
        n.includes('street') ||
        n.includes('city') ||
        n.includes('state') ||
        n.includes('province') ||
        n.includes('postal') ||
        n.includes('zip') ||
        n.includes('country') ||
        n.includes('apt') ||
        n.includes('suite') ||
        n.includes('floor');

      const hasEmpWords = n.includes('employment') || n.includes('employer') || n.includes('occupation');

      const hasParentWords = n.includes('parent');

      if (isPet) {
        if (hasEmpWords) return 'p1_emp';
        if (hasParentWords) return 'p1_par';
        if (hasAddrWords) return 'p1_addr';
        return 'p1_ident';
      }
      if (isBen) {
        if (hasEmpWords) return 'p2_emp';
        if (hasParentWords) return 'p2_par';
        if (hasAddrWords) return 'p2_addr';
        return 'p2_ident';
      }

      // fallback based on page if your field names embed it
      if (n.includes('page10') || n.includes('page_10') || n.includes('page11') || n.includes('page_11')) return 'p5_7';
      if (n.includes('page12') || n.includes('page_12')) return 'p8';

      return 'other';
    };

    for (const f of pdfFieldList) {
      const sec = pick(f.name, f.type);
      (out[sec] || out.other).push(f);
    }

    return out;
  }, [pdfFieldList]);

  /* ---- load current saved data ---- */
  useEffect(() => {
    (async () => {
      try {
        // Prefer /api/i129f/load (we’ll update this to read DB). If it doesn't exist, fall back.
        const r = await fetch('/api/i129f/load', { cache: 'no-store', credentials: 'include' });
        if (!r.ok) return;
        const j = await r.json();
        if (j?.ok && j?.data && typeof j.data === 'object') setForm(j.data);
      } catch {}
    })();
  }, []);

  /* ---- load PDF field names from server so they match the template exactly ---- */
  useEffect(() => {
    (async () => {
      setLoadingFields(true);
      try {
        const r = await fetch('/api/i129f/fields', { cache: 'no-store' });
        const j = await r.json();
        if (j?.ok && Array.isArray(j.fields)) {
          setPdfFieldList(j.fields.map(x => ({ name: x.name, type: x.type || 'Unknown' })));
        }
      } catch {}
      setLoadingFields(false);
    })();
  }, []);

  async function save() {
    try {
      setStatus({ saving: true, savedAt: status.savedAt, error: null });
      const r = await fetch('/api/i129f/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ data: form }),
      });
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error || 'Save failed');
      setStatus({ saving: false, savedAt: new Date().toISOString(), error: null });
    } catch (e) {
      setStatus({ saving: false, savedAt: status.savedAt, error: String(e?.message || e) });
    }
  }

  async function downloadDraftFromCurrent() {
    // Uses POST /api/i129f/pdf so you can check population even before DB/load issues are perfect.
    // Sends only the pdf map to keep payload small.
    try {
      const r = await fetch('/api/i129f/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ data: { pdf: form?.pdf || {} } }),
      });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(t || 'PDF build failed');
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'i-129f-draft.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(String(e?.message || e));
    }
  }

  const Tabs = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
      {SECTIONS.map((s, i) => (
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
            cursor: 'pointer',
          }}
          title={s.label}
        >
          {i + 1}. {s.label}
        </button>
      ))}
    </div>
  );

  const activeFields = useMemo(() => {
    if (active === 'review') return [];
    const list = fieldsBySection[active] || [];
    const q = filter.trim().toLowerCase();
    if (!q) return list;
    return list.filter(f =>
      String(f.name).toLowerCase().includes(q) ||
      String(f.type).toLowerCase().includes(q)
    );
  }, [active, fieldsBySection, filter]);

  useEffect(() => { resetCounter(); }, [step, showNums, filter, pdfFieldList]);

  return (
    <NumCtx.Provider value={{ show: showNums, next: nextNumber }}>
      <main className="section">
        <div className="container" style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0 }}>I-129F Wizard</h1>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <label className="small" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="checkbox" checked={showNums} onChange={e => setShowNums(e.target.checked)} />
                Number questions
              </label>
              <label className="small" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="checkbox" checked={showNames} onChange={e => setShowNames(e.target.checked)} />
                Show PDF field names
              </label>
            </div>
          </div>

          {Tabs}

          {/* Status box (this is the “Saved!” box you mentioned) */}
          <div className="card" style={{ padding: 12, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div className="small" style={{ display: 'grid', gap: 4 }}>
              <div>
                <strong>Status:</strong>{' '}
                {status.saving ? 'Saving…' : status.error ? `Error: ${status.error}` : status.savedAt ? 'Saved' : 'Not saved yet'}
              </div>
              {status.savedAt && (
                <div style={{ color: '#64748b' }}>
                  Saved at: {new Date(status.savedAt).toLocaleString()}
                </div>
              )}
              {loadingFields && (
                <div style={{ color: '#64748b' }}>
                  Loading PDF field list…
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-primary" onClick={save} disabled={status.saving}>
                Save
              </button>
              <button type="button" className="btn" onClick={downloadDraftFromCurrent}>
                Download draft (current)
              </button>
              <a className="btn" href="/api/i129f" title="Downloads using the latest saved data">
                Download PDF (saved)
              </a>
            </div>
          </div>

          {/* Section content */}
          {active !== 'review' ? (
            <section className="card" style={{ padding: 16, display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0 }}>{SECTIONS[step]?.label}</h2>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    placeholder="Filter fields (name/type)…"
                    style={{ minWidth: 260 }}
                  />
                  <span className="small" style={{ color: '#64748b' }}>
                    Showing {activeFields.length} field(s)
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                {activeFields.map(f => (
                  <PdfFieldRow
                    key={f.name}
                    field={f}
                    value={getPdfValue(f.name)}
                    onChange={setPdfValue}
                    showName={showNames}
                  />
                ))}

                {!loadingFields && activeFields.length === 0 && (
                  <div className="small" style={{ color: '#64748b' }}>
                    No fields matched this section/filter.
                  </div>
                )}
              </div>
            </section>
          ) : (
            <ReviewSection form={form} fieldsBySection={fieldsBySection} />
          )}

          {/* Back/Next */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <button type="button" onClick={() => setStep(s => Math.max(s - 1, 0))} className="btn" disabled={step === 0}>
              Back
            </button>
            <button type="button" onClick={() => setStep(s => Math.min(s + 1, SECTIONS.length - 1))} className="btn" disabled={step === SECTIONS.length - 1}>
              Next
            </button>
          </div>
        </div>
      </main>
    </NumCtx.Provider>
  );
}

/* ---------- Single field row ---------- */
function PdfFieldRow({ field, value, onChange, showName }) {
  const name = field?.name;
  const type = field?.type || 'Unknown';
  const isCheckbox =
    /checkbox/i.test(type) ||
    /check/i.test(type) ||
    /checkbox/i.test(String(name || ''));

  const label = prettyLabel(name);

  return (
    <Field
      label={
        <span style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <span>{label}</span>
          {showName && (
            <code style={{ color: '#64748b' }}>{name}</code>
          )}
          <span style={{ color: '#94a3b8' }}>({type})</span>
        </span>
      }
    >
      {isCheckbox ? (
        <input
          type="checkbox"
          checked={!!value}
          onChange={e => onChange(name, e.target.checked)}
        />
      ) : (
        <input
          value={value == null ? '' : String(value)}
          onChange={e => onChange(name, e.target.value)}
        />
      )}
    </Field>
  );
}

function prettyLabel(name) {
  if (!name) return '';
  // Convert underscores to spaces but keep “page_#” readable
  return String(name)
    .replaceAll('_', ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ---------- Review ---------- */
function ReviewSection({ form, fieldsBySection }) {
  const counts = useMemo(() => {
    const out = {};
    Object.keys(fieldsBySection || {}).forEach(k => (out[k] = (fieldsBySection[k] || []).length));
    return out;
  }, [fieldsBySection]);

  const filled = useMemo(() => {
    const pdf = form?.pdf || {};
    let n = 0;
    for (const k of Object.keys(pdf)) {
      const v = pdf[k];
      if (v === true) n += 1;
      else if (typeof v === 'string' && v.trim()) n += 1;
      else if (typeof v === 'number' && !Number.isNaN(v)) n += 1;
    }
    return n;
  }, [form]);

  return (
    <section className="card" style={{ padding: 16, display: 'grid', gap: 12 }}>
      <h2 style={{ margin: 0 }}>Review</h2>

      <div className="small" style={{ color: '#64748b' }}>
        Your values are saved under <code>data.pdf[PDF_FIELD_NAME]</code>. Download the draft PDF and confirm which fields populate.
      </div>

      <div className="card" style={{ padding: 12, display: 'grid', gap: 6 }}>
        <div><strong>PDF values currently filled:</strong> {filled}</div>
        <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>
          {SECTIONS.filter(s => s.key !== 'review').map(s => (
            <div key={s.key} className="small">
              {s.label}: <span style={{ color: '#64748b' }}>{counts[s.key] ?? 0} field(s)</span>
            </div>
          ))}
        </div>
      </div>

      <div className="small" style={{ color: '#64748b' }}>
        Tip: Use the filter box in each section and try filling a handful of fields (5–10), then download and check the PDF.
      </div>
    </section>
  );
}

/* ---------- Field wrapper ---------- */
function Field({ label, children }) {
  const { show, next } = useContext(NumCtx);
  const prefix = show ? `${next()}. ` : '';
  return (
    <label className="small" style={{ display: 'grid', gap: 6, minWidth: 0 }}>
      <span data-i18n="label">{prefix}{label}</span>
      <div style={{ display: 'grid', minWidth: 0 }}>{children}</div>
    </label>
  );
}
