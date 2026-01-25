// app/flow/us/i-129f/all-fields/AllFieldsClient.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { I129F_SECTIONS } from '@/lib/i129f-mapping';

function getValue(obj, path) {
  if (!obj) return undefined;
  const parts = String(path).replaceAll('[', '.').replaceAll(']', '').split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function setByPath(prev, path, value) {
  const next = typeof structuredClone === 'function' ? structuredClone(prev ?? {}) : JSON.parse(JSON.stringify(prev ?? {}));
  const parts = String(path).replaceAll('[', '.').replaceAll(']', '').split('.');
  let cur = next;
  for (let i = 0; i < parts.length; i++) {
    const k = parts[i];
    const last = i === parts.length - 1;
    if (last) {
      cur[k] = value;
    } else {
      if (cur[k] == null || typeof cur[k] !== 'object') {
        const n = Number(parts[i + 1]);
        cur[k] = Number.isInteger(n) ? [] : {};
      }
      cur = cur[k];
    }
  }
  return next;
}

export default function AllFieldsClient() {
  const [form, setForm] = useState({});
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);

  const flatFields = useMemo(() => {
    const out = [];
    (I129F_SECTIONS || []).forEach((sec) => {
      (sec.fields || []).forEach((f) => out.push(f));
    });
    return out;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/i129f/load', { cache: 'no-store', credentials: 'include' });
        const j = await r.json();
        if (j?.ok && j.data) setForm(j.data);
      } catch {
        // ignore
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
      if (!j.ok) alert(j.error || 'Save failed');
      else alert('Saved!');
    } catch (e) {
      alert('Save failed');
      console.error(e);
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

  return (
    <main className="section">
      <div className="container" style={{ display: 'grid', gap: 12 }}>
        <h1>All fields (debug)</h1>

        <div className="card" style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button className="btn" onClick={downloadPdf} disabled={downloading}>
              {downloading ? 'Downloading…' : 'Download PDF (POST)'}
            </button>
            <a className="btn" href="/flow/us/i-129f">Back to Wizard</a>
          </div>

          {flatFields.length === 0 ? (
            <div className="small" style={{ color: '#b45309' }}>
              No fields found in <code>I129F_SECTIONS</code>. (This page reads from <code>lib/i129f-mapping</code>.)
            </div>
          ) : null}

          {flatFields.map(({ path, label, type }) => (
            <label key={path} className="small" style={{ display: 'grid', gap: 6 }}>
              <span>
                {label} <code style={{ color: '#64748b' }}>({path})</code>
              </span>

              {type === 'checkbox' ? (
                <input
                  type="checkbox"
                  checked={!!getValue(form, path)}
                  onChange={(e) => setForm((prev) => setByPath(prev, path, e.target.checked))}
                />
              ) : (
                <input
                  value={String(getValue(form, path) ?? '')}
                  onChange={(e) => setForm((prev) => setByPath(prev, path, e.target.value))}
                />
              )}
            </label>
          ))}
        </div>
      </div>
    </main>
  );
}
