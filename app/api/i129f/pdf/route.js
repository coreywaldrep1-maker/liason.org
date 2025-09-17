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
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "===".slice((payload.length + 3) % 4);
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json);
  } catch { return null; }
}

function getUserIdFromCookie(cookieStr) {
  try {
    if (!cookieStr) return null;
    // common cookie names; tweak if yours is different
    const m =
      cookieStr.match(/(?:^|;\s*)(?:token|jwt|auth|session)=([^;]+)/i) ||
      cookieStr.match(/(?:^|;\s*)Authorization=Bearer\s+([^;]+)/i);
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

async function fetchJsonOrNull(url, cookie) {
  try {
    const res = await fetch(url, { headers: { cookie }, cache: "no-store" });
    if (!res.ok) return null;
    return await res.json().catch(() => null);
  } catch {
    return null;
  }
}

/**
 * Try in order:
 *   1) GET /api/i129f/data (uses your existing session/auth logic)
 *   2) GET /api/auth/me → DB lookup by user.id
 *   3) ?userId=123 override (DB)
 */
async function loadSavedForRequest(request) {
  const cookie = request.headers.get("cookie") || "";
  const url = new URL(request.url);
  const origin = url.origin;

  // 0) explicit override for testing
  const qUserId = url.searchParams.get("userId");
  const testUserId = qUserId && /^\d+$/.test(qUserId) ? Number(qUserId) : null;

  // 1) App’s own API (preferred)
  const dataJson = await fetchJsonOrNull(`${origin}/api/i129f/data`, cookie);
  if (dataJson) {
    // try common shapes
    const candidate = dataJson.data ?? dataJson.saved ?? dataJson.i129f ?? dataJson;
    if (candidate && typeof candidate === "object") return candidate;
  }

  // 2) /api/auth/me to get user.id from the session
  let userId = testUserId;
  if (!userId) {
    const me = await fetchJsonOrNull(`${origin}/api/auth/me`, cookie);
    const idFromMe =
      me?.user?.id ?? me?.id ?? (typeof me?.userId === "number" ? me.userId : null);
    if (typeof idFromMe === "number") userId = idFromMe;
  }
  if (!userId) {
    // 3) last resort: decode JWT cookie for id
    const idFromCookie = getUserIdFromCookie(cookie);
    if (typeof idFromCookie === "number") userId = idFromCookie;
  }

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
      // ignore and fall through
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

    // 1) Load saved JSON (via /api/i129f/data, or /api/auth/me + DB, or ?userId)
    const saved = await loadSavedForRequest(request);
    if (!saved) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No saved I-129F data found for the current session. Make sure you're logged in and have saved progress.",
          hint:
            "Open /api/i129f/data in the same session to confirm JSON; or pass ?userId=YOUR_ID for testing.",
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
