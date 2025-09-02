'use client';

import { useCallback, useMemo, useState } from 'react';
import { I129F } from '@/lib/i129f-schema';

// --- helpers: get/set nested values like "petitioner.name.family"
function getByPath(obj, path) {
  if (!path) return undefined;
  return path.split('.').reduce((acc, k) => (acc ? acc[k] : undefined), obj);
}
function setByPath(draft, path, value) {
  const segs = path.split('.');
  let ptr = draft;
  for (let i = 0; i < segs.length - 1; i++) {
    const k = segs[i];
    if (!ptr[k] || typeof ptr[k] !== 'object') ptr[k] = {};
    ptr = ptr[k];
  }
  ptr[segs[segs.length - 1]] = value;
}

export default function I129fWizard({ initialAnswers = {} }) {
  const [answers, setAnswers] = useState(initialAnswers);
  const [cursor, setCursor] = useState({ s: 0, g: 0 }); // section index, group index
  const section = I129F.sections[cursor.s];
  const group = section.groups[cursor.g];

  const steps = useMemo(() => {
    const arr = [];
    I129F.sections.forEach((sec, si) => {
      sec.groups.forEach((grp, gi) => {
        arr.push({ s: si, g: gi, title: `${sec.title} — ${grp.title}` });
      });
    });
    return arr;
  }, []);

  const stepIndex = steps.findIndex((x) => x.s === cursor.s && x.g === cursor.g);
  const isFirst = stepIndex <= 0;
  const isLast = stepIndex >= steps.length - 1;

  const goNext = useCallback(() => {
    if (isLast) return;
    const nxt = steps[stepIndex + 1];
    setCursor({ s: nxt.s, g: nxt.g });
  }, [isLast, stepIndex, steps]);

  const goBack = useCallback(() => {
    if (isFirst) return;
    const prev = steps[stepIndex - 1];
    setCursor({ s: prev.s, g: prev.g });
  }, [isFirst, stepIndex, steps]);

  // --- Save progress to your API
  const onSave = useCallback(async () => {
    try {
      const res = await fetch('/api/i129f/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });
      if (!res.ok) throw new Error('Save failed');
      alert('Progress saved.');
    } catch (e) {
      alert('Could not save progress.');
    }
  }, [answers]);

  // --- Basic condition handler (showIf supports equality on simple keys)
  function isVisible(fieldOrGroup) {
    if (!fieldOrGroup?.showIf) return true;
    const cond = fieldOrGroup.showIf;
    return Object.entries(cond).every(([k, v]) => {
      const current = getByPath(answers, k);
      return current === v;
    });
  }

  function onFieldChange(field, value, idx /* for repeaters */) {
    setAnswers((prev) => {
      const draft = structuredClone(prev);
      if (group.repeat && typeof idx === 'number') {
        const key = group.id;
        const rows = Array.isArray(prev[key]) ? structuredClone(prev[key]) : [];
        rows[idx] = rows[idx] || {};
        rows[idx][field.key] = value;
        draft[key] = rows;
      } else {
        setByPath(draft, field.key, value);
      }
      return draft;
    });
  }

  return (
    <div className="card" style={{ padding: 20, display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <span className="small" style={{ opacity: 0.8 }}>
          Step {stepIndex + 1} of {steps.length}
        </span>
        <strong>{section.title}</strong>
        <span className="small" style={{ opacity: 0.8 }}>› {group.title}</span>
      </div>

      {group.help && <p className="small" style={{ opacity: 0.8, marginTop: -4 }}>{group.help}</p>}

      {/* Group body */}
      <div style={{ display: 'grid', gap: 12 }}>
        {/* Repeater groups */}
        {group.repeat ? (
          <Repeater
            group={group}
            rows={answers[group.id] || []}
            onChange={(idx, field, val) => onFieldChange(field, val, idx)}
          />
        ) : (
          (group.fields || [])
            .filter(isVisible)
            .map((f) => (
              <FieldRow
                key={f.key}
                field={f}
                value={getByPath(answers, f.key)}
                onChange={(val) => onFieldChange(f, val)}
              />
            ))
        )}
      </div>

      {/* Navigation & Actions */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginTop: 4 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={goBack} disabled={isFirst}>Back</button>
          <button className="btn" onClick={goNext} disabled={isLast}>Next</button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={onSave}>Save progress</button>
          <a className="btn btn-primary" href="/api/i129f?download=pdf">Download draft PDF</a>
        </div>
      </div>
    </div>
  );
}

/** One row/field with inline help */
function FieldRow({ field, value, onChange }) {
  if (!field) return null;
  return (
    <label className="small" style={{ display: 'grid', gap: 6 }}>
      <span>{field.label}</span>
      <FieldInput field={field} value={value} onChange={onChange} />
      {field.help && <span className="micro" style={{ opacity: 0.7 }}>{field.help}</span>}
    </label>
  );
}

/** Renders an individual input by type */
function FieldInput({ field, value, onChange }) {
  const common = {
    style: { width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 8 },
    value: value ?? '',
    onChange: (e) => onChange(e.target.value)
  };

  switch (field.type) {
    case 'textarea':
      return <textarea {...common} rows={4} />;
    case 'radio':
      return (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {(field.options || []).map((opt) => (
            <label key={opt.value} className="small" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              <input
                type="radio"
                name={field.key}
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      );
    case 'select':
      return (
        <select
          {...common}
          onChange={(e) => onChange(e.target.value)}
        >
          {(field.options || []).map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );
    case 'number':
      return <input {...common} type="number" />;
    case 'email':
      return <input {...common} type="email" />;
    case 'tel':
      return <input {...common} type="tel" />;
    case 'date':
      return <input {...common} type="date" />;
    default:
      // text, state, country fallback to text inputs (you can swap to real pickers later)
      return <input {...common} type="text" />;
  }
}

/** Repeater (add/remove rows) */
function Repeater({ group, rows, onChange }) {
  const [localRows, setLocalRows] = useState(rows.length ? rows : [{}]);

  const addRow = () => {
    const max = group.repeat?.max ?? 99;
    if (localRows.length >= max) return;
    setLocalRows((r) => [...r, {}]);
  };
  const removeRow = (idx) => {
    const min = group.repeat?.min ?? 0;
    if (localRows.length <= Math.max(min, 1)) return;
    setLocalRows((r) => r.filter((_, i) => i !== idx));
  };

  // reflect to parent on field change
  const handleField = (idx, field, val) => {
    const next = localRows.map((row, i) => (i === idx ? { ...row, [field.key]: val } : row));
    setLocalRows(next);
    onChange(idx, field, val);
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {localRows.map((row, idx) => (
        <div key={idx} className="card" style={{ padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <strong className="small">{group.title} #{idx + 1}</strong>
            <div style={{ display: 'flex', gap: 8 }}>
              {localRows.length > (group.repeat?.min ?? 0) && (
                <button type="button" className="small" onClick={() => removeRow(idx)} style={{ textDecoration: 'underline' }}>
                  Remove
                </button>
              )}
            </div>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {(group.itemFields || []).map((f) => (
              <FieldRow
                key={f.key}
                field={f}
                value={row[f.key]}
                onChange={(val) => handleField(idx, f, val)}
              />
            ))}
          </div>
        </div>
      ))}
      {localRows.length < (group.repeat?.max ?? 99) && (
        <button type="button" className="btn" onClick={addRow}>Add another</button>
      )}
    </div>
  );
}
