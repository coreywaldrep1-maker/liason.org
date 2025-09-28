// lib/i129f-mapping.js
//
// New mapper for your remapped I-129F PDF.
// - Uses the exact field names from your Excel where available.
// - Covers Parts 1–8 including: petitioner, beneficiary, addresses,
//   employment, "beneficiary in the U.S." (38a–h), IMB (55–61),
//   criminal (1–5d), interpreter, preparer, Part 8 (3d–7d).
// - Safer booleans/dates to avoid .toLowerCase() crashes.
// - Fallback "includes" matching for checkboxes whose exact names vary.
// - Honors Part 8 "spillover" text you already generate in the wizard.

function get(obj, path, dflt = '') {
  try {
    const parts = Array.isArray(path) ? path : String(path).split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur == null) return dflt;
      if (p.endsWith(']')) {
        const m = /(.+)\[(\d+)\]$/.exec(p);
        if (!m) return dflt;
        cur = cur[m[1]]?.[Number(m[2])];
      } else {
        cur = cur[p];
      }
    }
    return cur ?? dflt;
  } catch {
    return dflt;
  }
}

function s(v) {
  if (v === null || v === undefined) return '';
  return (typeof v === 'string') ? v : String(v);
}

function truthy(v) {
  if (v === true) return true;
  if (v === false) return false;
  const t = s(v).trim().toLowerCase();
  return ['y','yes','true','1','on','checked'].includes(t);
}

function fmtDate(v) {
  if (!v) return '';
  try {
    // Accepts MM/DD/YYYY, YYYY-MM-DD, Date, or any parseable string.
    if (typeof v === 'string') {
      const iso = /^\d{4}-\d{2}-\d{2}$/.test(v);
      const us  = /^\d{1,2}\/\d{1,2}\/(\d{2}|\d{4})$/.test(v);
      if (iso) {
        const [y,m,d] = v.split('-');
        return `${m}/${d}/${y}`;
      }
      if (us) return v;
    }
    const d = new Date(v);
    if (isNaN(d.getTime())) return s(v);
    const mm = String(d.getMonth() + 1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    const yyyy = String(d.getFullYear());
    return `${mm}/${dd}/${yyyy}`;
  } catch {
    return s(v);
  }
}

/* ---------- low-level PDF helpers ---------- */
function setText1(form, name, value) {
  try {
    const tf = form.getTextField(name);
    tf.setText(value ?? '');
    return true;
  } catch { return false; }
}

function check1(form, name, on = true) {
  try {
    const cb = form.getCheckBox(name);
    on ? cb.check() : cb.uncheck();
    return true;
  } catch { return false; }
}

function setManyText(form, names, value) {
  for (const n of names) setText1(form, n, value);
}
function setManyChecks(form, names, on)
