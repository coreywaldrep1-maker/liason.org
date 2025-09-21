// app/api/i129f/pdf/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { applyI129fMapping } from "@/lib/i129f-mapping";

const TEMPLATE_RELATIVE = "public/i-129f.pdf";

// ---------- helpers ----------
async function loadTemplate() {
  const filePath = path.join(process.cwd(), TEMPLATE_RELATIVE);
  return readFile(filePath);
}
async function fetchJson(url, cookie) {
  const res = await fetch(url, { headers: { cookie }, cache: "no-store" });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }
  return { ok: res.ok, status: res.status, json, raw: text };
}
function pickCandidate(obj) {
  if (!obj || typeof obj !== "object") return null;
  return obj.data ?? obj.saved ?? obj.i129f ?? obj.payload ?? obj;
}
function sampleSaved() {
  return {
    petitioner: {
      lastName: "Doe", firstName: "John", middleName: "",
      aNumber: "123-456-789", uscisOnlineAccount: "A00112233", ssn: "111-22-3333",
    },
    mailing: {
      inCareOf: "Jane Helper", street: "123 Main St", unitType: "Apt", unitNum: "5B",
      city: "Austin", state: "TX", zip: "78701", country: "USA",
    },
    physicalAddresses: [
      { street: "123 Main St", city: "Austin", state: "TX", zip: "78701", country: "USA", from: "01/01/2020", to: "" },
    ],
    employment: [
      { employer: "Acme Inc.", street: "1 Market", city: "Austin", state: "TX", zip: "78701", country: "USA", occupation: "Engineer", from: "01/01/2021", to: "" },
    ],
    beneficiary: {
      lastName: "Smith", firstName: "Anna", middleName: "",
      aNumber: "", ssn: "", dob: "02/02/1995",
      cityBirth: "Toronto", countryBirth: "Canada", nationality: "Canadian",
      mailing: { street: "77 King St", city: "Toronto", province: "ON", postal: "M5H 1J9", country: "Canada" },
      physicalAddress: { street: "77 King St", city: "Toronto", province: "ON", postal: "M5H 1J9", country: "Canada" },
      employment: []
    },
    part8: {}
  };
}
async function loadSavedForRequest(request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const cookie = request.headers.get("cookie") || "";
  const userId = url.searchParams.get("userId");

  // prefer /api/i129f/data
  {
    const { ok, json } = await fetchJson(`${origin}/api/i129f/data`, cookie);
    const cand = pickCandidate(json);
    if (ok && cand) return { source: "/api/i129f/data", saved: cand };
  }
  // fallback /api/i129f/load
  {
    const { ok, json } = await fetchJson(`${origin}/api/i129f/load`, cookie);
    const cand = pickCandidate(json);
    if (ok && cand) return { source: "/api/i129f/load", saved: cand };
  }
  // optional userId override (useful on Vercel)
  if (userId) {
    for (const p of [
      `/api/i129f/data?userId=${encodeURIComponent(userId)}`,
      `/api/i129f/load?userId=${encodeURIComponent(userId)}`
    ]) {
      const { ok, json } = await fetchJson(`${origin}${p}`, cookie);
      const cand = pickCandidate(json);
      if (ok && cand) return { source: p, saved: cand };
    }
  }
  return { source: null, saved: null };
}

// set a temporary global for legacy mappers that reference `form`
function withGlobalForm(pdfForm, fn) {
  const prev1 = globalThis.form;
  const prev2 = globalThis.__pdfForm;
  globalThis.form = pdfForm;
  globalThis.__pdfForm = pdfForm;
  try {
    return fn();
  } finally {
    if (prev1 === undefined) delete globalThis.form; else globalThis.form = prev1;
    if (prev2 === undefined) delete globalThis.__pdfForm; else globalThis.__pdfForm = prev2;
  }
}

// ---------- route ----------
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const flatten = url.searchParams.get("flatten") === "1";
    const wantSample = url.searchParams.get("sample") === "1";

    // SAMPLE MODE (no auth needed)
    if (wantSample) {
      const pdfBytes = await loadTemplate();
      const pdfDoc = await PDFDocument.load(pdfBytes, { updateMetadata: true, ignoreEncryption: true });
      const pdfForm = pdfDoc.getForm();
      const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);

      try { pdfForm.updateFieldAppearances(helv); } catch {}

      // support both (saved, form) and legacy (saved) mappers
      withGlobalForm(pdfForm, () => {
        try { applyI129fMapping(sampleSaved(), pdfForm); } catch { applyI129fMapping(sampleSaved()); }
      });

      try { pdfForm.updateFieldAppearances(helv); } catch {}
      if (flatten) pdfForm.flatten();

      const out = await pdfDoc.save();
      return new NextResponse(out, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="i-129f-sample.pdf"',
          "Cache-Control": "no-store",
        },
      });
    }

    // NORMAL PATH
    const { source, saved } = await loadSavedForRequest(request);
    if (!saved) {
      return NextResponse.json(
        {
          ok: false,
          error: "No saved I-129F data found for this session/environment (auth cookie missing or data not saved).",
          hint: "Log in, click “Save progress”, then retry. For testing, use ?sample=1 or ?userId=YOUR_ID.",
          tried: { data: "/api/i129f/data", load: "/api/i129f/load" },
        },
        { status: 401 }
      );
    }

    const pdfBytes = await loadTemplate();
    const pdfDoc = await PDFDocument.load(pdfBytes, { updateMetadata: true, ignoreEncryption: true });
    const pdfForm = pdfDoc.getForm();
    const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);

    try { pdfForm.updateFieldAppearances(helv); } catch {}

    // support both (saved, form) and legacy (saved) mappers
    withGlobalForm(pdfForm, () => {
      try { applyI129fMapping(saved, pdfForm); } catch { applyI129fMapping(saved); }
    });

    try { pdfForm.updateFieldAppearances(helv); } catch {}
    if (flatten) pdfForm.flatten();

    const out = await pdfDoc.save();
    return new NextResponse(out, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="i-129f.pdf"',
        "Cache-Control": "no-store",
        "X-Filled-From": source || "unknown",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err && err.stack ? err.stack : err) },
      { status: 500 }
    );
  }
}
