// app/api/i129f/pdf/route.js
// Keep AcroForm fields (no flatten) by default; fill from saved DB data only.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { PDFDocument, StandardFonts } from "pdf-lib";

import { sql } from "@/lib/db";
import { applyI129fMapping } from "@/lib/i129f-mapping";

// Adjust if your PDF lives elsewhere (e.g., "public/forms/i-129f.pdf")
const TEMPLATE_RELATIVE = "public/i-129f.pdf";

// --- helpers ---
async function loadTemplate() {
  const filePath = path.join(process.cwd(), TEMPLATE_RELATIVE);
  return readFile(filePath);
}

// base64url decode (no signature verification; just to read payload id)
function decodeJwtNoVerify(token) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "===".slice((payload.length + 3) % 4);
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getUserIdFromRequest(req) {
  // 1) allow override via query (?userId=123)
  try {
    const url = new URL(req.url);
    const qid = url.searchParams.get("userId");
    if (qid && /^\d+$/.test(qid)) return Number(qid);
  } catch {}

  // 2) look for a JWT in cookies (common cookie names)
  try {
    const cookie = req.headers.get("cookie") || "";
    const match =
      cookie.match(/(?:^|;\s*)(?:token|jwt|auth|session)=([^;]+)/i) ||
      cookie.match(/(?:^|;\s*)(?:Authorization)=Bearer\s+([^;]+)/i);
    if (!match) return null;
    const payload = decodeJwtNoVerify(decodeURIComponent(match[1]));
    if (!payload) return null;
    // Try typical shapes: { id }, { userId }, { user: { id } }
    return (
      (typeof payload.id === "number" && payload.id) ||
      (typeof payload.userId === "number" && payload.userId) ||
      (payload.user && typeof payload.user.id === "number" && payload.user.id) ||
      null
    );
  } catch {
    return null;
  }
}

async function loadSavedForUser(userId) {
  if (!userId) return null;
  // Adjust table/columns if your schema differs
  const rows = await sql`
    select data
    from i129f
    where user_id = ${userId}
    order by updated_at desc
    limit 1
  `;
  return rows?.[0]?.data ?? null;
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const flatten = url.searchParams.get("flatten") === "1"; // default: NOT flattened

    // identify the user (query param beats cookie)
    const userId = getUserIdFromRequest(request);

    // fetch saved JSON; no sample fallback anymore
    const saved = await loadSavedForUser(userId);
    if (!saved) {
      return NextResponse.json(
        {
          ok: false,
          error: "No saved I-129F data for this user. Log in and save progress first (or pass ?userId=123 to test).",
        },
        { status: 404 }
      );
    }

    const pdfBytes = await loadTemplate();

    // open pdf, prep appearances, write fields, keep acroform
    const pdfDoc = await PDFDocument.load(pdfBytes, {
      updateMetadata: true,
      ignoreEncryption: true,
    });
    const form = pdfDoc.getForm();
    const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
    try { form.updateFieldAppearances(helv); } catch {}

    applyI129fMapping(saved, form);

    try { form.updateFieldAppearances(helv); } catch {}
    if (flatten) form.flatten(); // only if explicitly requested

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
      { ok: false, error: String(err && err.stack ? err.stack : err) },
      { status: 500 }
    );
  }
}
