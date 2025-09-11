// app/flow/us/i-129f/all-fields/page.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { I129F_SECTIONS } from '@/lib/i129f-mapping';

function setByPath(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    const isIndex = /^\d+$/.test(k);
    if (isIndex) {
      const idx = Number(k);
      if (!Array.isArray(cur)) return;
      if (!Array.isArray(cur[parts[i - 1]])) cur[parts[i - 1]] = [];
      if (!cur[idx]) cur[idx] = {};
    } else {
      if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = {};
      cur = cur[k];
    }
  }
  const last = parts[parts.length - 1];
  cur[last] = value;
}

function getByPath(obj, path) {
  return path.split('.').reduce((acc, k) => {
    if (acc == null) return undefined;
    return /^\d+$/.test(k) ? acc[Number(k)] : acc[k];
  }, obj);
}

function guessType(path, pdfName) {
  if (/date|from|to|dob|exp/i.test(path)) return 'date';
  if (/Checkbox|CheckBox|_ch\d+$/i.test(pdfName)) return 'checkbox';
  // phone/email
  if (/email/i.test(path)) return 'email';
  if (/phone|tel/i.test(path)) return 'tel';
  return 'text';
}

export default function AllFieldsPage() {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // flatten to [ {path, pdf, type, sectionIndex}, ... ]
  const flat = useMemo(() => {
    const out = [];
    I129F_SECTIONS.forEach((sec, si) => {
      sec.paths.forEach(p => {
        // find pdf name by path; we don't have it here, but we don't need for UI except checkbox guess — skip
        const pdf = ''; // optional
        const type = guessType(p, '');
        out.push({ path: p, pdf, type, section: si });
      });
    });
    return out;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/i129f/load', { cache: 'no-store', credentials: 'include' });
        if (r.ok) {
          const j = await r.json();
          if (j?.ok && j.data) setForm(j.data);
        }
      } catch (e) {
        console.warn('load failed', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save() {
    setSaving(true);
    try {
      const r = await fetch('/api/i129f/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ data: form }),
      });
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error || 'save failed');
      alert('Saved!');
    } catch (e) {
      alert('Save failed (are you logged in?)');
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="section container">Loading…</main>;

  return (
    <main className="section">
      <div className="container" style={{ display:'grid', gap:16 }}>
        <h1 style={{ margin: 0 }}>I-129F — All Fields (debug)</h1>
        <div className="small">Type values, click “Save”, then download <a href="/api/i129f/pdf" target="_blank" rel="noreferrer">PDF</a> or <a href="/api/i129f/pdf-debug" target="_blank" rel="noreferrer">PDF + field overlay</a>.</div>

        {I129F_SECTIONS.map((sec, i) => (
          <section key={i} className="card" style={{ display: 'grid', gap: 10 }}>
            <h3 style={{ margin: 0 }}>{sec.title}</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {sec.paths.map(path => {
                const v = getByPath(form, path);
                const type = guessType(path, '');
                return (
                  <label key={path} className="small" style={{ display: 'grid', gap: 6, minWidth: 0 }}>
                    <span>{path}</span>
                    {type === 'checkbox' ? (
                      <input
                        type="checkbox"
                        checked={!!v}
                        onChange={e => {
                          setForm(prev => {
                            const copy = structuredClone(prev || {});
                            setByPath(copy, path, e.target.checked);
                            return copy;
                          });
                        }}
                      />
                    ) : (
                      <input
                        type={type}
                        value={v ?? ''}
                        onChange={e => {
                          const val = type === 'date' ? e.target.value : e.target.value;
                          setForm(prev => {
                            const copy = structuredClone(prev || {});
                            setByPath(copy, path, val);
                            return copy;
                          });
                        }}
                      />
                    )}
                  </label>
                );
              })}
            </div>
          </section>
        ))}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <a className="btn" href="/api/i129f/pdf" target="_blank" rel="noreferrer">Download PDF</a>
            <a className="btn" href="/api/i129f/pdf-debug" target="_blank" rel="noreferrer">PDF + Overlay</a>
          </div>
          <button className="btn btn-primary" disabled={saving} onClick={save}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </main>
  );
}
