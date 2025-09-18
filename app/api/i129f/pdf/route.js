// app/api/i129f/pdf/route.js
// Fill PDF from your app's own endpoints only (no DB). Keeps AcroForms by default.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import path from "node:path";
import { readFile, access } from "node:fs/promises";
import { constants as FS } from "node:fs";
import { PDFDocument, StandardFonts } from "pdf-lib";

import { applyI129fMapping } from "@/lib/i129f-mapping";

// Common places a template might live
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
  // fallback to first (will error later if really missing)
  return path.join(process.cwd(), CANDIDATE_PDFS[0]);
}

async function loadTemplate() {
  const filePath = await resolveTemplatePath();
  return readFile(filePath);
}

// -------- fetch helpers --------
async function fetchJsonOrNull(url, cookie) {
  try {
    const res = await fetch(url, {
      headers: cookie ? { cookie } : {},
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json().catch(() => null);
  } catch {
    return null;
  }
}

// Accept lots of shapes your endpoints might return
function extractSaved(json) {
  if (!json || typeof json !== "object") return null;

  // Most common
  if (json.data && typeof json.data === "object") return json.data;
  if (json.saved && typeof json.saved === "object") return json.saved;
  if (json.i129f && typeof json.i129f === "object") return json.i129f;
  if (json.form && typeof json.form === "object") return json.form;

  // Arrays / rows
  if (Array.isArray(json.rows) && json.rows[0]?.data && typeof json.rows[0].data === "object") {
    return json.rows[0].data;
  }
  if (Array.isArray(json.items) && json.items[0] && typeof json.items[0] === "object") {
    return json.items[0];
  }

  // Heuristic: looks like the saved object itself
  const guessKeys = ["petitioner", "beneficiary", "mailing", "employment", "physicalAddresses"];
  if (guessKeys.some(k => k in json)) return json;

  return null;
}

async function loadSavedFromAppEndpoints(request, dbg) {
  const cookie = request.headers.get("cookie") || "";
  const origin = new URL(request.url).origin;

  // Try /api/i129f/data
  const j1 = await fetchJsonOrNull(`${origin}/api/i129f/data`, cookie);
  dbg.tried.data = Boolean(j1);
  const s1 = extractSaved(j1);
  if (s1) return { source: "/api/i129f/data", saved: s1 };

  // Try /api/i129f/load
  const j2 = await fetchJsonOrNull(`${origin}/api/i129f/load`, cookie);
  dbg.tried.load = Boolean(j2);
  const s2 = extractSaved(j2);
  if (s2) return { source: "/api/i129f/load", saved: s2 };

  // Try /api/i129f (some apps return the current saved object here)
  const j3 = await fetchJsonOrNull(`${origin}/api/i129f`, cookie);
  dbg.tried.root = Boolean(j3);
  const s3 = extractSaved(j3);
  if (s3) return { source: "/api/i129f", saved: s3 };

  return { source: null, saved: null };
}

export async function GET(request) {
