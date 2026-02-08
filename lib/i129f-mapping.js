// lib/i129f-mapping.js
//
// Generic I-129F PDF mapper (Liason)
//
// Goal: Every website field should populate into the PDF.
// Strategy: Store website answers in `data.pdf` using *PDF field names* as keys,
// then fill the AcroForm generically by field name + value type.
//
// Supported value types in `data.pdf`:
//  - string/number  -> text fields, radio selections, dropdown selections
//  - boolean        -> checkboxes
//
// opts.onMissingPdfField (optional) can be used by reporting/debug endpoints.

function normalizeRoot(saved) {
  if (saved && typeof saved === "object" && saved.data && typeof saved.data === "object") {
    return saved.data;
  }
  return saved && typeof saved === "object" ? saved : {};
}

function fmtDateMaybe(v) {
  if (typeof v !== "string") return v;
  const s = v.trim();
  // Convert YYYY-MM-DD -> MM/DD/YYYY (browser date input -> PDF)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-");
    return `${m}/${d}/${y}`;
  }
  return s;
}

function trySetText(form, name, value) {
  try {
    form.getTextField(name).setText(value ?? "");
    return true;
  } catch {
    return false;
  }
}

function trySetCheckbox(form, name, checked) {
  try {
    const cb = form.getCheckBox(name);
    if (checked) cb.check();
    else cb.uncheck();
    return true;
  } catch {
    return false;
  }
}

function trySetRadio(form, name, value) {
  try {
    const rg = form.getRadioGroup(name);
    if (value) rg.select(value);
    return true;
  } catch {
    return false;
  }
}

function trySetDropdown(form, name, value) {
  try {
    const dd = form.getDropdown(name);
    if (value) dd.select(value);
    return true;
  } catch {
    return false;
  }
}

export function applyI129fMapping(saved = {}, form, opts = {}) {
  const root = normalizeRoot(saved);
  const pdfMap = root.pdf && typeof root.pdf === "object" ? root.pdf : {};
  const onMissing = typeof opts.onMissingPdfField === "function" ? opts.onMissingPdfField : null;

  for (const [pdfName, raw] of Object.entries(pdfMap)) {
    if (!pdfName) continue;
    if (raw === undefined || raw === null) continue;

    // Booleans -> checkbox
    if (typeof raw === "boolean") {
      const ok = trySetCheckbox(form, pdfName, raw);
      if (!ok && onMissing) onMissing({ pdfName, value: raw });
      continue;
    }

    // Arrays not used in this UI right now
    if (Array.isArray(raw)) continue;

    const value = fmtDateMaybe(typeof raw === "string" ? raw : String(raw));

    // Try common field types
    if (trySetRadio(form, pdfName, value)) continue;
    if (trySetDropdown(form, pdfName, value)) continue;
    if (trySetText(form, pdfName, value)) continue;

    // Last resort: string-ish checkbox values
    const lowered = value.toLowerCase();
    if (lowered === "true" || lowered === "yes" || lowered === "on") {
      if (trySetCheckbox(form, pdfName, true)) continue;
    }
    if (lowered === "false" || lowered === "no" || lowered === "off") {
      if (trySetCheckbox(form, pdfName, false)) continue;
    }

    if (onMissing) onMissing({ pdfName, value: raw });
  }
}
