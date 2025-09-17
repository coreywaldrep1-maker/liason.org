// app/api/i129f/pdf/route.js
// Keep AcroForm fields (no flatten) by default.
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

async function loadTemplate() {
  const filePath = path.join(process.cwd(), TEMPLATE_RELATIVE);
  return readFile(filePath);
}

/**
 * Load some saved data even if not logged in:
 * 1) latest row from i129f.data
 * 2) fallback to a tiny sample so you can see fields populate
 * Adjust table/columns to match your schema if needed.
 */
async function loadAnySavedOrSample() {
  try {
    const rows = await sql/*sql*/`
      select data
      from i129f
      order by updated_at desc
      limit 1
    `;
    if (rows?.[0]?.data) return rows[0].data;
  } catch {
    // ignore DB errors and fall through to sample
  }
  return {
    petitioner: { firstName: "DEBUG_GIVEN", lastName: "DEBUG_FAMILY", middleName: "" },
    mailing: { street: "123 Main St", city: "Austin", state: "TX", zip: "73301", country: "USA" },
    physicalAddresses: [
      { street: "123 Main St", city: "Austin", state: "TX", zip: "73301", country: "USA", from: "2020-01-01", to: "2023-12-31" }
    ],
    employment: [
      { employer: "Example Co", street: "1 Work Rd", city: "Austin", state: "TX", zip: "73301", occupation: "Engineer", from: "2021-01-01", to: "2024-01-01" }
    ],
    beneficiary: {
      firstName: "BEN_GIVEN",
      lastName: "BEN_FAMILY",
      dob: "1990-05-15",
      mailing: { street: "456 Oak Ave", city: "Dallas", state: "TX", zip: "75001", country: "USA" },
      physical: [{ street: "456 Oak Ave", city: "Dallas", state: "TX", zip: "75001", country: "USA", from: "2022-01-01", to: "2024-01-01" }],
      employment: [{ employer: "Widgets LLC", street: "2 Job Ln", city: "Dallas", state: "TX", zip: "75001", occupation: "Analyst", from: "2022-06-01", to: "2024-01-01" }]
    }
  };
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    // Default: DO NOT FLATTEN (keep interactive AcroForm fields)
    const flatten = url.searchParams.get("flatten") === "1";

    const saved = await loadAnySavedOrSample();
    const pdfBytes = await loadTemplate();

    // Open the PDF, embed a font, and build appearances (so entries are visible without flattening)
    const pdfDoc = await PDFDocument.load(pdfBytes, {
      updateMetadata: true,
      ignoreEncryption: true,
    });
    const form = pdfDoc.getForm();
    const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Build appearances before writing to avoid “appearance ref” errors
    try { form.updateFieldAppearances(helv); } catch {}

    // Write values
    applyI129fMapping(saved, form);

    // Rebuild appearances after writing, still keeping AcroForm intact
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
