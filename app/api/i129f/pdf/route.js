// app/api/i129f/pdf/route.js
// Node runtime; dynamic so we see current session cookies on each request
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { PDFDocument, StandardFonts } from "pdf-lib";

import { applyI129fMapping } from "@/lib/i129f-mapping";

// ---- Adjust this to your actual template path if different
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
  // common shapes we've used across iterations
  return obj.data ?? obj.saved ?? obj.i129f ?? obj.payload ?? obj;
}

function sampleSaved() {
  // minimal but valid sample to prove the pipeline works without auth
  return {
    petitioner: {
      lastName: "Doe",
      firstName: "John",
      middleName: "",
      aNumber: "123-456-789",
      uscisOnlineAccount: "A00112233",
      ssn: "111-22-3333",
    },
    mailing: {
      inCareOf: "Jane Helper",
      street: "123 Main St",
      unitType: "Apt",
      unitNum: "5B",
      city: "Austin",
      state: "TX",
      zip: "78701",
      country: "USA",
    },
    physicalAddresses: [
      { street: "123 Main St", city: "Austin", state: "TX", zip: "78701", country: "USA", from: "01/01/2020", to: "" },
    ],
    employment: [
      { employer: "Acme Inc.", street: "1 Market", city: "Austin", state: "TX", zip: "78701", country: "USA", occupation: "Engineer", from: "01/01/2021", to: "" },
    ],
    beneficiary: {
      lastName: "Smith",
      firstName: "Anna",
      middleName: "",
      aNumber: "",
      ssn: "",
      dob: "02/02/1995",
      cityBirth: "Toronto",
      countryBirth: "Canada",
      nationality: "Canadian",
      mailing: { street: "77 King St", city: "Toronto", province: "ON", postal: "M5H 1J9", country: "Canada" },
      physicalAddress: { street: "77 King St", city: "Toronto", province: "ON", postal: "M5H 1J9", country: "Canada" },
      employment: []
    },
    part8: {}
  };
}

/**
 * Try to load saved JSON tied to this request:
 *  1) /api/i129f/data   (preferred – your “current state” endpoint)
 *  2) /api/i129f/load   (alt – legacy loader)
 *  If `?userId=123` is present, try both with that override.
 */
async function loadSavedForRequest(request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const cookie = request.headers.get("cookie") || "";
  const userId = url.searchParams.get("userId");

  // 1) Try /api/i129f/data with session cookie
  {
    const { ok, json } = await fetchJson(`${origin}/api/i129f/data`, cookie);
    const cand = pickCandidate(json);
    if (ok && cand) return { source: "/api/i129f/data", saved: cand };
  }

  // 2) Try /api/i129f/load with session cookie
  {
    const { ok, json } = await fetchJson(`${origin}/api/i129f/load`, cookie);
    const cand = pickCandidate(json);
    if (ok && cand) return { source: "/api/i129f/load", saved: cand };
  }

  // 3) If userId override present, try parameterized calls (useful on Vercel where you’re not logged in)
  if (userId) {
    const paths = [
      `/api/i129f/data?userId=${encodeURIComponent(userId)}`,
      `/api/i129f/load?userId=${encodeURIComponent(userId)}`,
    ];
    for (const p of paths) {
      const { ok, json } = await fetchJson(`${origin}${p}`, cookie);
      const cand = pickCandidate(json);
      if (ok && cand) return { source: p, saved: cand };
    }
  }

  // none worked
  return { source: null, saved: null };
}

// ---------- route ----------
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const flatten = url.searchParams.get("flatten") === "1";
    const wantSample = url.searchParams.get("sample") === "1";

    // (Optional) quick test mode without auth or DB
    if (wantSample) {
      const pdfBytes = await loadTemplate();
      const pdfDoc = await PDFDocument.load(pdfBytes, { updateMetadata: true, ignoreEncryption: true });
      const pdfForm = pdfDoc.getForm();
      const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
      try { pdfForm.updateFieldAppearances(helv); } catch {}
      applyI129fMapping(sampleSaved(), pdfForm);
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

    // Normal path: load the user’s saved JSON
    const { source, saved } = await loadSavedForRequest(request);
    if (!saved) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No saved I-129F data found for this session/environment (auth cookie missing or data not saved).",
          hint:
            "Make sure you’re logged in and clicked “Save progress”, then retry. For testing, add ?sample=1 or ?userId=YOUR_ID to this URL.",
          tried: { data: "/api/i129f/data", load: "/api/i129f/load" },
        },
        { status: 401 }
      );
    }

    // Open template & fill
    const pdfBytes = await loadTemplate();
    const pdfDoc = await PDFDocument.load(pdfBytes, { updateMetadata: true, ignoreEncryption: true });
    const pdfForm = pdfDoc.getForm();
    const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);

    try { pdfForm.updateFieldAppearances(helv); } catch {}
    applyI129fMapping(saved, pdfForm);
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
      {
        ok: false,
        error: String(err && err.stack ? err.stack : err),
      },
      { status: 500 }
    );
  }
}
