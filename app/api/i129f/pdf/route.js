// app/api/i129f/pdf/route.js
// Keep AcroForm fields (no flatten) by default; fill from the user's saved data.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { PDFDocument, StandardFonts } from "pdf-lib";

import { sql } from "@/lib/db";
import { applyI129fMapping } from "@/lib/i129f-mapping";

const TEMPLATE_RELATIVE = "public/i-129f.pdf";

// ---------- helpers ----------
async function loadTemplate() {
  const filePath = path.join(process.cwd(), TEMPLATE_RELATIVE);
  return readFile(filePath);
}

// best-effort JWT payload read (no verify) for user id if we need it
function decodeJwtNoVerify(token) {
  try {
    const [_, payload] = token.split(".");
    if (!payload) return null;
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "===".slice((b64.length + 3) % 4);
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch { return null; }
}
function getUserIdFromCookie(cookieStr) {
  try {
    if (!cookieStr) return null;
    const m = cookieStr.match(/(?:^|;\s*)(?:token|jwt|auth|session)=([^;]+)/i);
    if (!m) return null;
    const payload = decodeJwtNoVerify(decodeURIComponent(m[1]));
    if (!payload) return null;
    return (
      (typeof payload.id === "number" && payload.id) ||
      (typeof payload.userId === "number" && payload.userId) ||
      (payload.user && typeof payload.user.id === "number" && payload.user.id) ||
      null
    );
  } catch { return null; }
}

/**
 * 1) Try to fetch your own saved JSON via /api/i129f/data (preferred).
 *    This uses the same auth/session logic your app already uses.
 * 2) If that fails, try the database directly by user id (latest row).
 */
async function loadSavedForRequest(request) {
  const cookie = request.headers.get("cookie") || "";
  const url = new URL(request.url);

  // allow manual override: ?userId=123 for testing
  const qUserId = url.searchParams.get("userId");
  const userIdFromQuery = qUserId && /^\d+$/.test(qUserId) ? Number(qUserId) : null;

  // FIRST: internal fetch to the app's own source of truth
  try {
    const origin = url.origin; // works locally and on Vercel
    const res = await fetch(`${origin}/api/i129f/data`, {
      headers: { cookie },
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json().catch(() => ({}));
      // try a few common shapes
      const candidate = json?.data ?? json?.saved ?? json?.i129f ?? json;
      if (candidate && typeof candidate === "object") return candidate;
    }
  } catch {
    // ignore and fall through to DB path
  }

  // SECOND: database (latest row for this user)
  const userId = userIdFromQuery ?? getUserIdFromCookie(cookie);
  if (userId) {
    try {
      const rows = await sql`
        select data
        from i129f
        where user_id = ${userId}
        order by updated_at desc
        limit 1
      `;
      const data = rows?.[0]?.data;
      if (data && typeof data === "object") return data;
    } catch {
      // ignore and return null below
    }
  }

  return null;
}

// ---------- route ----------
export async function GET(request) {
  try {
    const url = new URL(request.url);
    // Default: DO NOT FLATTEN (keep interactive AcroForm). Use ?flatten=1 to flatten explicitly.
    const flatten = url.searchParams.get("flatten") === "1";

    // 1) Load saved JSON (via internal API or DB) — no debug/sample fallback
    const saved = await loadSavedForRequest(request);
    if (!saved) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No saved I-129F data found for the current session. Make sure you're logged in and have saved progress.",
          hint:
            "If testing, pass ?userId=YOUR_ID or open /api/i129f/data to confirm the saved JSON is returned.",
        },
        { status: 404 }
      );
    }

    // 2) Load template
    const pdfBytes = await loadTemplate();

    // 3) Open, embed Helvetica, generate appearances (so fields are visible without flattening)
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
      { ok: false, error: String(err && err.stack ? err.stack : err) },
      { status: 500 }
    );
  }
}
