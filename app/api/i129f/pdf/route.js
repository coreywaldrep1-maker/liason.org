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

  const j1 = await fetchJsonOrNull(`${origin}/api/i129f/load`, cookie);
  const s1 = extractSaved(j1);
  if (s1) return s1;

  const j2 = await fetchJsonOrNull(`${origin}/api/i129f/data`, cookie);
  const s2 = extractSaved(j2);
  if (s2) return s2;

  return null;
}

async function resolveTemplateBytes() {
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

function isTruthy(v) {
  if (v === true) return true;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return !!s && s !== "off" && s !== "false" && s !== "0" && s !== "no";
  }
  return false;
}

function fillAnyField(field, val) {
  if (val === undefined || val === null) return;

  if (typeof field.check === "function" && typeof field.uncheck === "function") {
    if (isTruthy(val)) field.check();
    else field.uncheck();
    return;
  }

  if (typeof field.select === "function") {
    const s = String(val ?? "").trim();
    if (!s) return;
    try {
      field.select(s);
    } catch {}
    return;
  }

  if (typeof field.setText === "function") {
    const s = String(val ?? "").trim();
    if (!s) return;
    field.setText(s);
  }
}

function applyDirectPdfMap(pdfForm, saved) {
  const direct = saved && typeof saved === "object" && saved.pdf && typeof saved.pdf === "object" ? saved.pdf : null;
  if (!direct) return;

  for (const field of pdfForm.getFields()) {
    const name = field.getName();
    const v = direct[name];
    if (v === undefined || v === null || v === "") continue;
    fillAnyField(field, v);
  }
}

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
    const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true, updateMetadata: true });

    const form = pdfDoc.getForm();

    applyI129fMapping(saved, form);
    applyDirectPdfMap(form, saved);

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
        "X-I129F-Template": path.relative(process.cwd(), usedPath),
      },
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err?.message || "PDF generation failed" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const saved = body?.data || body || {};

    const { bytes: templateBytes, usedPath } = await resolveTemplateBytes();
    const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true, updateMetadata: true });

    const form = pdfDoc.getForm();

    applyI129fMapping(saved, form);
    applyDirectPdfMap(form, saved);

    try {
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      form.updateFieldAppearances(font);
    } catch {}

    const flatten = request.nextUrl.searchParams.get("flatten") === "1";
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
        "X-I129F-Template": path.relative(process.cwd(), usedPath),
      },
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err?.message || "PDF generation failed" }, { status: 500 });
  }
}
