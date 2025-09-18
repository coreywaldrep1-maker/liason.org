// app/api/i129f/pdf-inspect/route.js
// Inspect which fields exist in the template and what gets filled by your mapping.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import path from "node:path";
import { readFile, access } from "node:fs/promises";
import { constants as FS } from "node:fs";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { applyI129fMapping, I129F_DEBUG_FIELD_LIST } from "@/lib/i129f-mapping";

// ---- keep in sync with your pdf route ----
const CANDIDATE_PDFS = [
  "public/i-129f.pdf",
  "public/forms/i-129f.pdf",
  "public/us/i-129f.pdf",
];

async function resolveTemplatePath() {
  for (const rel of CANDIDATE_PDFS) {
    const p = path.join(process.cwd(), rel);
    try { await access(p, FS.R_OK); return p; } catch {}
  }
  return path.join(process.cwd(), CANDIDATE_PDFS[0]);
}

async function loadTemplate() {
  const filePath = await resolveTemplatePath();
  return readFile(filePath);
}

async function fetchJsonOrNull(url, cookie) {
  try {
    const res = await fetch(url, { headers: cookie ? { cookie } : {}, cache: "no-store" });
    if (!res.ok) return null;
    return await res.json().catch(() => null);
  } catch { return null; }
}

function extractSaved(json) {
  if (!json || typeof json !== "object") return null;
  if (json.data && typeof json.data === "object") return json.data;
  if (json.saved && typeof json.saved === "object") return json.saved;
  if (json.i129f && typeof json.i129f === "object") return json.i129f;
  if (json.form && typeof json.form === "object") return json.form;
  if (Array.isArray(json.rows) && json.rows[0]?.data && typeof json.rows[0].data === "object") {
    return json.rows[0].data;
  }
  if (Array.isArray(json.items) && json.items[0] && typeof json.items[0] === "object") {
    return json.items[0];
  }
  const guessKeys = ["petitioner", "beneficiary", "mailing", "employment", "physicalAddresses"];
  if (guessKeys.some(k => k in json)) return json;
  return null;
}

async function loadSavedFromAppEndpoints(request) {
  const cookie = request.headers.get("cookie") || "";
  const url = new URL(request.url);
  const origin = url.origin;

  // userId override helps when not logged in
  const qUserId = url.searchParams.get("userId");
  if (qUserId && /^\d+$/.test(qUserId)) {
    // if you ever add a DB fallback, you could use it here
  }

  const j1 = await fetchJsonOrNull(`${origin}/api/i129f/data`, cookie);
  const s1 = extractSaved(j1);
  if (s1) return { source: "/api/i129f/data", saved: s1 };

  const j2 = await fetchJsonOrNull(`${origin}/api/i129f/load`, cookie);
  const s2 = extractSaved(j2);
  if (s2) return { source: "/api/i129f/load", saved: s2 };

  const j3 = await fetchJsonOrNull(`${origin}/api/i129f`, cookie);
  const s3 = extractSaved(j3);
  if (s3) return { source: "/api/i129f", saved: s3 };

  return { source: null, saved: null };
}

export async function GET(request) {
  try {
    const { source, saved } = await loadSavedFromAppEndpoints(request);
    if (!saved) {
      return NextResponse.json({
        ok: false,
        error: "No saved data visible to this session.",
        hint: "Open /api/i129f/data in the same browser tab you used to save, or pass ?userId=... if you later add DB fallback.",
      }, { status: 404 });
    }

    const pdfBytes = await loadTemplate();
    const pdfDoc = await PDFDocument.load(pdfBytes, { updateMetadata: true, ignoreEncryption: true });
    const form = pdfDoc.getForm();
    const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
    try { form.updateFieldAppearances(helv); } catch {}

    // Collect original field names and values BEFORE filling
    const fields = form.getFields();
    const templateFields = fields.map(f => f.getName());

    // Run your mapping to fill the form
    applyI129fMapping(saved, form);
    try { form.updateFieldAppearances(helv); } catch {}

    // Read back values AFTER mapping
    const filled = {};
    const checked = {};
    for (const f of form.getFields()) {
      const name = f.getName();
      const ctor = f.constructor?.name || "";
      if (ctor.includes("Text")) {
        try { filled[name] = f.getText(); } catch { /* ignore */ }
      } else if (ctor.includes("CheckBox")) {
        try { checked[name] = f.isChecked(); } catch { /* ignore */ }
      } else if (ctor.includes("RadioGroup")) {
        try { filled[name] = f.getSelected()?.value ?? ""; } catch { /* ignore */ }
      } else {
        // ignore other field types for now
      }
    }

    // Optionally focus on a curated list if you exported I129F_DEBUG_FIELD_LIST
    const shortlist = Array.isArray(I129F_DEBUG_FIELD_LIST) && I129F_DEBUG_FIELD_LIST.length
      ? I129F_DEBUG_FIELD_LIST
      : templateFields;

    const unfilled = shortlist.filter(n => !(n in filled) || filled[n] === "");

    // Optional trimming for readability
    const limit = Math.max(0, Math.min(500, Number(new URL(request.url).searchParams.get("limit")) || 0));
    const limited = (obj) => {
      if (!limit) return obj;
      const out = {};
      let count = 0;
      for (const k of Object.keys(obj)) {
        out[k] = obj[k];
        if (++count >= limit) break;
      }
      return out;
    };

    return NextResponse.json({
      ok: true,
      source,
      keys: Object.keys(saved),
      totals: {
        templateFields: templateFields.length,
        filled: Object.keys(filled).length,
        checked: Object.values(checked).filter(Boolean).length,
        shortlistCount: shortlist.length,
        unfilled: unfilled.length,
      },
      templateFields: limit ? templateFields.slice(0, limit) : templateFields,
      filled: limited(filled),
      checked: limited(checked),
      unfilled: limit ? unfilled.slice(0, limit) : unfilled,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err && err.stack ? err.stack : err) }, { status: 500 });
  }
}
