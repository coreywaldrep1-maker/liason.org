"use client";

import { useEffect, useMemo, useState } from "react";

const EMPTY = { pdf: {}, metaVersion: 1 };

function humanize(name) {
  if (!name) return "";
  let s = String(name);

  // remove child suffix like .a, .b (keep key separately if needed)
  s = s.replace(/\.[a-z]\b/gi, "");

  s = s.replace(/_page\d+\b/gi, "");
  s = s.replace(/_+/g, " ");
  s = s.replace(/\bCheckbox(es)?\b/gi, "");
  s = s.replace(/\bNum\b/gi, "");
  s = s.replace(/\s+/g, " ").trim();

  return s;
}

function isDateLike(name) {
  const s = String(name).toLowerCase();
  return s.includes("date") || s.includes("dob");
}

function usToIso(us) {
  const m = String(us || "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return "";
  const mm = m[1].padStart(2, "0");
  const dd = m[2].padStart(2, "0");
  const yyyy = m[3];
  return `${yyyy}-${mm}-${dd}`;
}

function isoToUs(iso) {
  const m = String(iso || "").trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  return `${m[2]}/${m[3]}/${m[1]}`;
}

function DateInput({ value, onChange }) {
  const isoValue = useMemo(() => {
    const v = String(value || "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(v)) return usToIso(v);
    return "";
  }, [value]);

  return (
    <input
      type="date"
      value={isoValue}
      onChange={(e) => {
        const nextIso = e.target.value;
        onChange(nextIso ? isoToUs(nextIso) : "");
      }}
      // Calendar width fix (prevents layout blowup)
      style={{ maxWidth: 220 }}
    />
  );
}

export default function I129fWizard() {
  const [form, setForm] = useState(EMPTY);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showKeys, setShowKeys] = useState(false);
  const [pageIdx, setPageIdx] = useState(0);

  // Load fields from PDF (API)
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch("/api/i129f/fields", { cache: "no-store" });
        const json = await res.json();
        if (!ignore && json?.ok) {
          setFields(json.fields || []);
        }
      } catch (e) {
        console.error(e);
      }
    })();
    return () => (ignore = true);
  }, []);

  // Load saved data
  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/i129f/load", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!ignore && json?.ok && json?.data) {
          const loaded = json.data;
          setForm({
            ...EMPTY,
            ...loaded,
            pdf: { ...(loaded.pdf || {}) },
            metaVersion: 1,
          });
        } else if (!ignore) {
          setForm(EMPTY);
        }
      } catch (e) {
        if (!ignore) setMessage("Unable to load saved data.");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => (ignore = true);
  }, []);

  const pages = useMemo(() => {
    const max = Math.max(12, ...fields.map((f) => f.page || 0));
    const arr = [];
    for (let i = 1; i <= max; i++) arr.push(i);
    return arr;
  }, [fields]);

  const isReview = pageIdx === pages.length;
  const currentPage = pages[pageIdx];

  const pageFields = useMemo(() => {
    if (isReview) return [];
    return fields.filter((f) => (f.page || 0) === currentPage);
  }, [fields, isReview, currentPage]);

  function setPdfValue(pdfName, value) {
    setForm((prev) => ({
      ...prev,
      pdf: { ...(prev.pdf || {}), [pdfName]: value },
    }));
  }

  function getPdfValue(pdfName) {
    return (form.pdf || {})[pdfName] ?? "";
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/i129f/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.ok) setMessage("Saved.");
      else setMessage("Save failed.");
    } catch (e) {
      setMessage("Save failed.");
    } finally {
      setSaving(false);
    }
  }

  function next() {
    setPageIdx((i) => Math.min(i + 1, pages.length));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setPageIdx((i) => Math.max(i - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (loading) {
    return (
      <div className="card">
        <div className="small">Loading I‑129F…</div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Top Nav */}
      <div className="card">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {pages.map((p, idx) => (
            <button
              key={p}
              type="button"
              className={pageIdx === idx ? "btn btn-primary" : "btn"}
              onClick={() => setPageIdx(idx)}
            >
              Page {p}
            </button>
          ))}

          <button
            type="button"
            className={isReview ? "btn btn-primary" : "btn"}
            onClick={() => setPageIdx(pages.length)}
          >
            Review / Download
          </button>

          <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
            <label className="small" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={showKeys}
                onChange={(e) => setShowKeys(e.target.checked)}
              />
              <span>Show PDF field keys</span>
            </label>

            <button className="btn" type="button" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        {message ? <div className="small" style={{ marginTop: 10 }}>{message}</div> : null}
      </div>

      {/* Page Content */}
      {!isReview ? (
        <div className="card">
          <h2 style={{ margin: 0, marginBottom: 10 }}>I‑129F — Page {currentPage}</h2>

          <div className="grid-2">
            {pageFields.map((f) => (
              <FieldRenderer
                key={f.name}
                field={f}
                value={getPdfValue(f.name)}
                onChange={(v) => setPdfValue(f.name, v)}
                showKeys={showKeys}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="card">
          <h2 style={{ margin: 0, marginBottom: 10 }}>Review / Download</h2>
          <div className="small" style={{ marginBottom: 10 }}>
            Save your data, then download the filled PDF.
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn" type="button" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>

            <a className="btn btn-primary" href="/api/i129f/pdf" target="_blank" rel="noreferrer">
              Download I‑129F PDF
            </a>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button className="btn" type="button" onClick={back} disabled={pageIdx === 0}>
            Back
          </button>

          <button className="btn btn-primary" type="button" onClick={next}>
            {isReview ? "Stay on Review" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldRenderer({ field, value, onChange, showKeys }) {
  const label = humanize(field.name) || field.name;

  // checkbox
  if (field.kind === "checkbox") {
    return (
      <label className="small">
        <span>
          {label}
          {showKeys ? <span className="muted"> — {field.name}</span> : null}
        </span>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6 }}>
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span className="muted">Check if applicable</span>
        </div>
      </label>
    );
  }

  // radio / dropdown
  if (field.kind === "radio" || field.kind === "dropdown") {
    return (
      <label className="small" style={{ gridColumn: "1 / -1" }}>
        <span>
          {label}
          {showKeys ? <span className="muted"> — {field.name}</span> : null}
        </span>
        <select value={String(value || "")} onChange={(e) => onChange(e.target.value)}>
          <option value="">— Select —</option>
          {(field.options || []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>
    );
  }

  // text (date vs normal)
  if (isDateLike(field.name)) {
    return (
      <label className="small">
        <span>
          {label}
          {showKeys ? <span className="muted"> — {field.name}</span> : null}
        </span>
        <DateInput value={value} onChange={onChange} />
      </label>
    );
  }

  return (
    <label className="small">
      <span>
        {label}
        {showKeys ? <span className="muted"> — {field.name}</span> : null}
      </span>
      <input type="text" value={String(value || "")} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
