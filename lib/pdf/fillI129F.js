// lib/pdf/fillI129F.js
export const runtime = "nodejs";

import path from "node:path";
import { readFile, access } from "node:fs/promises";
import { constants as FS } from "node:fs";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { applyI129fMapping } from "@/lib/i129f-mapping";

// Use the SAME template your inspect route uses.
// IMPORTANT: /public/i-129f.pdf is the renamed-field template that matches lib/i129f-mapping.js.
const CANDIDATE_PDFS = [
  "public/i-129f.pdf",
  "public/forms/i-129f.pdf",
  "public/forms/i-129f (81).pdf",
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
  throw new Error(`I-129F template PDF not found. Looked in: ${CANDIDATE_PDFS.join(", ")}`);
}

export async function fillI129FPdf(saved = {}, { flatten = false } = {}) {
  const templatePath = await resolveTemplatePath();
  const templateBytes = await readFile(templatePath);

  const pdfDoc = await PDFDocument.load(templateBytes, {
    ignoreEncryption: true,
    updateMetadata: true,
  });

  const form = pdfDoc.getForm();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // ✅ THIS is the critical call: we pass the pdf-lib form
  applyI129fMapping(saved, form);

  // Make values visible in Chrome/Preview
  try { form.updateFieldAppearances(font); } catch {}

  if (flatten) {
    try { form.flatten(); } catch {}
  }

  return pdfDoc.save();
}
