// app/api/i129f/pdf/route.js
// Runtime: Node (needed for pdf-lib + crypto)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { PDFDocument, StandardFonts } from "pdf-lib";

import { sql } from "@/lib/db";
import { applyI129fMapping } from "@/lib/i129f-mapping";

/**
 * Adjust this if your form lives elsewhere.
 * Common locations:
 *   /public/forms/i-129f.pdf
 *   /public/i-129f.pdf
 */
const TEMPLATE_RELATIVE = "public/i-129f.pdf";

async function loadTemplate() {
  const filePath = path.join(process.cwd(), TEMPLATE_RELATIVE);
  return readFile(filePath);
}

/**
 * Replace this with your real “load saved data” query if needed.
 * This version just tries to load the latest saved row for the current user id (from cookie).
 * If you already have logic for this, keep yours and only copy the PDF handling below.
 */
async function loadSavedJsonOrEmpty(userId) {
  try {
    if (!userId) return {};
    // Adjust table/column names to match your schema:
    // Example schema: i129f(user_id int, data jsonb, updated_at timestamptz)
    const rows =
      await sql`select data from i129f where user_id=${userId} order by updated_at desc limit 1`;
    return rows?.[0]?.data || {};
  } catch {
    return {};
  }
}

export async function GET(request) {
  try {
    // ---- identify user (reuse your auth if you have it) ----
    // If your auth stores "uid" in a cookie/JWT, extract it here.
    // For now we’re permissive: userId may be null, and we’ll just generate a blank form.
    let userId = null;
    try {
      const cookie = request.headers.get("cookie") || "";
      // If you already have /api/auth/me working, consider calling that logic directly instead.
      // Here we do nothing fancy; leave userId as null unless you wire it.
      void cookie;
    } catch {}

    // ---- load data + pdf template ----
    const saved = await loadSavedJsonOrEmpty(userId);
    const pdfBytes = await loadTemplate();

    // ---- open PDF + embed font + build field appearances ----
    const pdfDoc = await PDFDocument.load(pdfBytes, {
      updateMetadata: true,
      ignoreEncryption: true,
    });

    const form = pdfDoc.getForm();
    const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Build appearances before we start writing — avoids “Failed to extract appearance ref”
    try {
      form.updateFieldAppearances(helv);
    } catch {
      /* ignore */
    }

    // ---- apply your mapping (writes text into fields) ----
    applyI129fMapping(saved, form);

    // Optional: if you toggle any checkboxes/radios in your mapping,
    // wrap them in a safe helper like this (copy into your mapping if needed):
    // function safeCheck(form, name, on = true) {
    //   try { const cb = form.getCheckBox(name); on ? cb.check() : cb.uncheck(); return true; }
    //   catch { return false; }
    // }

    // Rebuild appearances again right before saving (some PDFs need this twice)
    try {
      form.updateFieldAppearances(helv);
    } catch {
      /* ignore */
    }

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
    // Always return JSON on error so you can see exactly what failed
    return NextResponse.json(
      { ok: false, error: String(err && err.stack ? err.stack : err) },
      { status: 500 }
    );
  }
}
