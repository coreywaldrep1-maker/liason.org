// app/api/i129f/pdf/route.js
// Keeps AcroForm fields (no flatten) by default; aggressively finds saved data using tagged templates.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import path from "node:path";
import { readFile, access } from "node:fs/promises";
import { constants as FS } from "node:fs";
import { PDFDocument, StandardFonts } from "pdf-lib";

import { sql } from "@/lib/db";
import { applyI129fMapping } from "@/lib/i129f-mapping";

// --- locate the template from common spots ---
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

// ---- helpers: session + fetch ----
async function fetchJsonOrNull(url, cookie) {
  try {
    const res = await fetch(url, { headers: { cookie }, cache: "no-store" });
    if (!res.ok) return null;
    return await res.json().catch(() => null);
  } catch { return null; }
}

// Accept many possible /api/i129f/data shapes
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

/**
 * Robust DB fallback using ONLY tagged-template queries (no sql.unsafe):
 * Tries several common table names + json column names + order columns.
 */
async function fetchLatestRowFromAnyTableTagged(debug) {
  const attempts = [
    // i129f with typical json col names
    async () => { const r = await sql`select data as data from i129f order by updated_at desc limit 1`; return { r, q: "i129f.data via updated_at" }; },
    async () => { const r = await sql`select data as data from i129f order by created_at desc limit 1`; return { r, q: "i129f.data via created_at" }; },
    async () => { const r = await sql`select data as data from i129f order by id desc limit 1`; return { r, q: "i129f.data via id" }; },

    async () => { const r = await sql`select payload as data from i129f order by updated_at desc limit 1`; return { r, q: "i129f.payload via updated_at" }; },
    async () => { const r = await sql`select payload as data from i129f order by created_at desc limit 1`; return { r, q: "i129f.payload via created_at" }; },
    async () => { const r = await sql`select payload as data from i129f order by id desc limit 1`; return { r, q: "i129f.payload via id" }; },

    async () => { const r = await sql`select json as data from i129f order by updated_at desc limit 1`; return { r, q: "i129f.json via updated_at" }; },
    async () => { const r = await sql`select json as data from i129f order by created_at desc limit 1`; return { r, q: "i129f.json via created_at" }; },
    async () => { const r = await sql`select json as data from i129f order by id desc limit 1`; return { r, q: "i129f.json via id" }; },

    async () => { const r = await sql`select form_json as data from i129f order by updated_at desc limit 1`; return { r, q: "i129f.form_json via updated_at" }; },
    async () => { const r = await sql`select form_json as data from i129f order by created_at desc limit 1`; return { r, q: "i129f.form_json via created_at" }; },
    async () => { const r = await sql`select form_json as data from i129f order by id desc limit 1`; return { r, q: "i129f.form_json via id" }; },

    // i129f_saves
    async () => { const r = await sql`select data as data from i129f_saves order by updated_at desc limit 1`; return { r, q: "i129f_saves.data via updated_at" }; },
    async () => { const r = await sql`select data as data from i129f_saves order by created_at desc limit 1`; return { r, q: "i129f_saves.data via created_at" }; },
    async () => { const r = await sql`select data as data from i129f_saves order by id desc limit 1`; return { r, q: "i129f_saves.data via id" }; },

    async () => { const r = await sql`select payload as data from i129f_saves order by updated_at desc limit 1`; return { r, q: "i129f_saves.payload via updated_at" }; },
    async () => { const r = await sql`select payload as data from i129f_saves order by created_at desc limit 1`; return { r, q: "i129f_saves.payload via created_at" }; },
    async () => { const r = await sql`select payload as data from i129f_saves order by id desc limit 1`; return { r, q: "i129f_saves.payload via id" }; },

    async () => { const r = await sql`select json as data from i129f_saves order by updated_at desc limit 1`; return { r, q: "i129f_saves.json via updated_at" }; },
    async () => { const r = await sql`select json as data from i129f_saves order by created_at desc limit 1`; return { r, q: "i129f_saves.json via created_at" }; },
    async () => { const r = await sql`select json as data from i129f_saves order by id desc limit 1`; return { r, q: "i129f_saves.json via id" }; },

    // i129f_data
    async () => { const r = await sql`select data as data from i129f_data order by updated_at desc limit 1`; return { r, q: "i129f_data.data via updated_at" }; },
    async () => { const r = await sql`select data as data from i129f_data order by created_at desc limit 1`; return { r, q: "i129f_data.data via created_at" }; },
    async () => { const r = await sql`select data as data from i129f_data order by id desc limit 1`; return { r, q: "i129f_data.data via id" }; },

    async () => { const r = await sql`select payload as data from i129f_data order by updated_at desc limit 1`; return { r, q: "i129f_data.payload via updated_at" }; },
    async () => { const r = await sql`select payload as data from i129f_data order by created_at desc limit 1`; return { r, q: "i129f_data.payload via created_at" }; },
    async () => { const r = await sql`select payload as data from i129f_data order by id desc limit 1`; return { r, q: "i129f_data.payload via id" }; },

    async () => { const r = await sql`select json as data from i129f_data order by updated_at desc limit 1`; return { r, q: "i129f_data.json via updated_at" }; },
    async () => { const r = await sql`select json as data from i129f_data order by created_at desc limit 1`; return { r, q: "i129f_data.json via created_at" }; },
    async () => { const r = await sql`select json as data from i129f_data order by id desc limit 1`; return { r, q: "i129f_data.json via id" }; },

    async () => { const r = await sql`select form_json as data from i129f_data order by updated_at desc limit 1`; return { r, q: "i129f_data.form_json via updated_at" }; },
    async () => { const r = await sql`select form_json as data from i129f_data order by created_at desc limit 1`; return { r, q: "i129f_data.form_json via created_at" }; },
    async () => { const r = await sql`select form_json as data from i129f_data order by id desc limit 1`; return { r, q: "i129f_data.form_json via id" }; },
  ];

  for (const fn of attempts) {
    try {
      const { r, q } = await fn();
      const data = r?.[0]?.data;
      if (data && typeof data === "object") {
        debug.dbQuery = q;
        return data;
      }
    } catch (e) {
      debug.dbErrors.push(String(e).slice(0, 200));
    }
  }
  return null;
}

async function loadSavedForRequest(request, debug) {
  const cookie = request.headers.get("cookie") || "";
  const url = new URL(request.url);
  const origin = url.origin;

  // 1) App’s own API (preferred)
  const dataJson = await fetchJsonOrNull(`${origin}/api/i129f/data`, cookie);
  debug.tried = { data: Boolean(dataJson) };
  const fromData = extractSaved(dataJson);
  if (fromData) {
    debug.source = "api/i129f/data";
    debug.keys = Object.keys(fromData);
    return fromData;
  }

  // 2) DB: newest row from known tables (no userId required)
  const fromDb = await fetchLatestRowFromAnyTableTagged(debug);
  if (fromDb) {
    debug.source = "db:any-latest";
    debug.keys = Object.keys(fromDb);
    return fromDb;
  }

  return null;
}

export async function GET(request) {
  const debug = { tried: { data: false }, dbErrors: [], source: null, keys: [], dbQuery: null };

  try {
    const url = new URL(request.url);
    const flatten = url.searchParams.get("flatten") === "1";
    const wantDebug = url.searchParams.get("debug") === "1";

    // 1) Load saved JSON (API first, then DB latest)
    const saved = await loadSavedForRequest(request, debug);
    if (wantDebug) {
      return NextResponse.json(
        { ok: Boolean(saved), debug, sample: saved ? Object.keys(saved) : null },
        { status: saved ? 200 : 404 }
      );
    }
    if (!saved) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No saved I-129F data found for this environment/session.",
          hint:
            "Open /api/i129f/data in the SAME browser session where you saved, or call /api/i129f/pdf?debug=1 to see what the server can access.",
          debug,
        },
        { status: 404 }
      );
    }

    // 2) Load template
    const pdfBytes = await loadTemplate();

    // 3) Open, embed Helvetica, generate appearances
    const pdfDoc = await PDFDocument.load(pdfBytes, {
      updateMetadata: true,
      ignoreEncryption: true,
    });
    const form = pdfDoc.getForm();
    const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
    try { form.updateFieldAppearances(helv); } catch {}

    // 4) Fill fields from your mapper
    applyI129fMapping(saved, form);

    // 5) Recompute appearances; keep AcroForm unless explicitly flattened
    try { form.updateFieldAppearances(helv); } catch {}
    if (flatten) form.flatten();

    // 6) Save + return
    const out = await pdfDoc.save();
    return new NextResponse(out, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="i-129f.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err && err.stack ? err.stack : err), debug },
      { status: 500 }
    );
  }
}
