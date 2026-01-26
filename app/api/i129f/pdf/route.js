// app/api/i129f/pdf/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import path from "node:path";
import { readFile, access } from "node:fs/promises";
import { constants as FS } from "node:fs";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { applyI129fMapping } from "@/lib/i129f-mapping";

// Keep in sync with your other endpoints
const CANDIDATE_PDFS = [
  "public/i-129f.pdf",
  "public/forms/i-129f.pdf",
  "public/us/i-129f.pdf",
];

async function resolveTemplatePath() {
  for (const rel of CANDIDATE_PDFS) {
    const p = path.join(process.cwd(), rel);
    try {
      await access(p, FS.R_OK);
      return p;
    } catch {}
  }
  return path.join(process.cwd(), CANDIDATE_PDFS[0]);
}

async function loadTemplateBytes() {
  const filePath = await resolveTemplatePath();
  return readFile(filePath);
}

async function fetchJsonOrNull(url, cookie) {
  try {
    const res = await fetch(url, { headers: cookie ? { cookie } : {}, cache: "no-store" });
    if (!res.ok) return null;
    return await res.json().catch(() => null);
  } catch {
    return null;
  }
}

function extractSaved(json) {
  if (!json || typeof json !== "object") return null;
  if (json.data && typeof json.data === "object") return json.data;
  if (json.saved && typeof json.saved === "object") return json.saved;
  if (json.i129f && typeof json.i129f === "object") return json.i129f;
  if (json.form && typeof json.form === "object") return json.form;
  if (Array.isArray(json.rows) && json.rows[0]?.data && typeof json.rows[0].data === "object") return json.rows[0].data;
  if (Array.isArray(json.items) && json.items[0] && typeof json.items[0] === "object") return json.items[0];

  // if it already looks like the wizard shape
  const guessKeys = ["petitioner", "beneficiary", "mailing", "employment", "physicalAddresses"];
  if (guessKeys.some((k) => k in json)) return json;

  return null;
}

async function loadSavedFromAppEndpoints(request) {
  const cookie = request.headers.get("cookie") || "";
  const url = new URL(request.url);
  const origin = url.origin;

  const j1 = await fetchJsonOrNull(`${origin}/api/i129f/data`, cookie);
  const s1 = extractSaved(j1);
  if (s1) return { source: "/api/i129f/data", saved: s1 };

  const j2 = await fetchJsonOrNull(`${origin}/api/i129f/load`, cookie);
  const s2 = extractSaved(j2);
  if (s2) return { source: "/api/i129f/load", saved: s2 };

  return { source: null, saved: null };
}

async function buildFilledPdf(saved, flatten = true) {
  const pdfBytes = await loadTemplateBytes();
  const pdfDoc = await PDFDocument.load(pdfBytes, { updateMetadata: true, ignoreEncryption: true });

  const form = pdfDoc.getForm();

  // Improve appearance reliability
  const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
  try { form.updateFieldAppearances(helv); } catch {}

  // Write values into AcroForm
  applyI129fMapping(saved, form);

  // Update appearances again after setting values
  try { form.updateFieldAppearances(helv); } catch {}

  if (flatten) {
    try { form.flatten(); } catch {}
  }

  return pdfDoc.save();
}

// GET: used by your <a href="/api/i129f/pdf">Download</a>
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const flatten = url.searchParams.get("flatten") !== "0";

    const { saved, source } = await loadSavedFromAppEndpoints(request);
    if (!saved) {
      return NextResponse.json(
        { ok: false, error: "No saved I-129F data found for this session.", hint: "Save the form, then download in the same logged-in browser." },
        { status: 404 }
      );
    }

    const out = await buildFilledPdf(saved, flatten);

    return new NextResponse(out, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="i-129f-filled.pdf"`,
        "X-Data-Source": source || "unknown",
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e?.stack || e) }, { status: 500 });
  }
}

// POST: optional (handy for testing with raw JSON)
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const flatten = body?.flatten !== false;

    const saved = body?.data || body?.saved || body || {};
    const out = await buildFilledPdf(saved, flatten);

    return new NextResponse(out, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="i-129f-filled.pdf"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e?.stack || e) }, { status: 500 });
  }
}
