// app/flow/us/i-129f/all-fields/page.jsx
'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { I129F_SECTIONS } from '@/lib/i129f-mapping';

export default function AllFieldsPage() {
  const [form, setForm] = useState({});
  const [downloading, setDownloading] = useState(false);

  // fill with blanks so every input is editable
  const flatFields = useMemo(() => {
    const out = [];
    (I129F_SECTIONS || []).forEach(sec => {
      (sec.fields || []).forEach(f => out.push(f));
    });
    return out;
  }, []);

  function setByPath(path, value) {
    setForm(prev => {
      const next = structuredClone(prev ?? {});
      const parts = String(path).replaceAll('[', '.').replaceAll(']', '').split('.');
      let cur = next;
      for (let i = 0; i < parts.length; i++) {
        const k = parts[i];
        const last = i === parts.length - 1;
        if (last) {
          cur[k] = value;
        } else {
          if (cur[k] == null || typeof cur[k] !== 'object') {
            // array index?
            const n = Number(parts[i + 1]);
            cur[k] = Number.isInteger(n) ? [] : {};
          }
          cur = cur[k];
        }
      }
      return next;
    });
  }

  async function save() {
    const r = await fetch('/api/i129f/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ data: form }),
    });
    const j = await r.json();
    if (!j.ok) alert(j.error || 'Save failed');
    else alert('Saved!');
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
      alert('Download failed. Try saving first, then use the GET download.');
      console.error(e);
    } finally {
      setDownloading(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/i129f/load', { cache: 'no-store', credentials: 'include' });
        const j = await r.json();
        if (j?.ok && j.data) setForm(j.data);
      } catch {}
    })();
  }, []);

  return (
    <main className="section">
      <div className="container" style={{ display:'grid', gap:12 }}>
        <h1>All fields (debug)</h1>
        <div className="card" style={{ display:'grid', gap:8 }}>
          {flatFields.map(({ path, label, type }) => (
            <label key={path} className="small" style={{ display:'grid', gap:6 }}>
              <span>{label} <code style={{ color:'#64748b' }}>({path})</code></span>
              {type === 'checkbox' ? (
                <input
                  type="checkbox"
                  checked={!!getValue(form, path)}
                  onChange={e => setByPath(path, e.target.checked)}
                />
              ) : (
                <input
                  value={String(getValue(form, path) ?? '')}
                  onChange={e => setByPath(path, e.target.value)}
                />
              )}
            </label>
          ))}
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            <button className="btn btn-primary" onClick={save}>Save</button>
            <button className="btn" onClick={downloadPdf} disabled={downloading}>
              {downloading ? 'Downloading…' : 'Download PDF (POST current form)'}
            </button>
            <a className="btn" href="/api/i129f/pdf">Download PDF (GET from saved)</a>
            <a className="btn" href="/api/i129f/mapping-report">Mapping report</a>
          </div>
        </div>
      </div>
    </main>
  );
}

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
