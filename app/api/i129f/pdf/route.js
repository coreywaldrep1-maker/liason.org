// app/api/i129f/pdf/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import path from "node:path";
import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { applyI129fMapping } from "@/lib/i129f-mapping";

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
  // If endpoint returned a standard {ok:false,...} shape, treat as no data.
  if (Object.prototype.hasOwnProperty.call(json, "ok") && json.ok === false) return null;
  if (json.ok === true && json.data && typeof json.data === "object") return json.data;
  if (json.data && typeof json.data === "object") return json.data;
  if (json.saved && typeof json.saved === "object") return json.saved;
  if (json.i129f && typeof json.i129f === "object") return json.i129f;
  if (json.form && typeof json.form === "object") return json.form;
  return json;
}

async function loadSavedForSession(request) {
  const cookie = request.headers.get("cookie") || "";
  const origin = new URL(request.url).origin;

  // these are the endpoints your wizard already uses
  const j1 = await fetchJsonOrNull(`${origin}/api/i129f/load`, cookie);
  const s1 = extractSaved(j1);
  if (s1) return s1;

  const j2 = await fetchJsonOrNull(`${origin}/api/i129f/data`, cookie);
  const s2 = extractSaved(j2);
  if (s2) return s2;

  return null;
}

async function resolveTemplateBytes() {
  // IMPORTANT:
  // Your mapping file (lib/i129f-mapping.js) targets the *renamed* AcroForm field names.
  // The PDF at /public/i-129f.pdf in this repo has those renamed fields.
  // The PDF at /public/forms/i-129f.pdf has the *original* USCIS field names (Pt1Line..., etc.)
  // and will result in a blank filled PDF.
  const candidates = [
    path.join(process.cwd(), "public", "i-129f.pdf"),
    path.join(process.cwd(), "public", "forms", "i-129f.pdf"),
    path.join(process.cwd(), "public", "forms", "i-129f (81).pdf"),
    path.join(process.cwd(), "public", "us", "i-129f.pdf"),
  ];

  for (const p of candidates) {
    try {
      const bytes = await readFile(p);
      return { bytes, usedPath: p };
    } catch {}
  }

  throw new Error(`I-129F template PDF not found. Checked: ${candidates.join(" | ")}`);
}

// GET is what your UI link uses: <a href="/api/i129f/pdf">
export async function GET(request) {
  try {
    const saved = await loadSavedForSession(request);
    if (!saved) {
      return NextResponse.json(
        { ok: false, error: "No saved data found for this session. Save the form first." },
        { status: 404 }
      );
    }

    const flatten = request.nextUrl.searchParams.get("flatten") === "1";

    const { bytes: templateBytes, usedPath } = await resolveTemplateBytes();
    const pdfDoc = await PDFDocument.load(templateBytes, {
      ignoreEncryption: true,
      updateMetadata: true,
    });

    const form = pdfDoc.getForm();

    // ✅ This is the critical line: ALWAYS pass the pdf-lib form
    applyI129fMapping(saved, form);

    // Make values visible in most PDF viewers
    try {
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      form.updateFieldAppearances(font);
    } catch {}

    if (flatten) {
      try { form.flatten(); } catch {}
    }

    const out = await pdfDoc.save();

    return new NextResponse(out, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="i-129f-filled.pdf"',
        "Cache-Control": "no-store",
        // Helpful when debugging which template was used on Vercel
        "X-I129F-Template": path.relative(process.cwd(), usedPath),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || "PDF generation failed" },
      { status: 500 }
    );
  }
}

// Optional: POST support
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const saved = body?.data || body || {};

    const { bytes: templateBytes, usedPath } = await resolveTemplateBytes();
    const pdfDoc = await PDFDocument.load(templateBytes, {
      ignoreEncryption: true,
      updateMetadata: true,
    });

    const form = pdfDoc.getForm();
    applyI129fMapping(saved, form);

    try {
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      form.updateFieldAppearances(font);
    } catch {}

    const out = await pdfDoc.save();

    return new NextResponse(out, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="i-129f-filled.pdf"',
        "Cache-Control": "no-store",
        "X-I129F-Template": path.relative(process.cwd(), usedPath),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || "PDF generation failed" },
      { status: 500 }
    );
  }
}
