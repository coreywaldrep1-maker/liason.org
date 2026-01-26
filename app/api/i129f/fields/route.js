// app/api/i129f/fields/route.js
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { readFile, access } from 'node:fs/promises';
import { constants as FS } from 'node:fs';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';

const CANDIDATE_PDFS = [
  'public/i-129f.pdf',
  'public/forms/i-129f.pdf',
  'public/us/i-129f.pdf',
];

async function resolveTemplatePath() {
  for (const rel of CANDIDATE_PDFS) {
    const p = path.join(process.cwd(), rel);
    try { await access(p, FS.R_OK); return p; } catch {}
  }
  // fall back to first
  return path.join(process.cwd(), CANDIDATE_PDFS[0]);
}

export async function GET() {
  try {
    const pdfPath = await resolveTemplatePath();
    const bytes = await readFile(pdfPath);
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const form = pdf.getForm();

    const fields = form.getFields().map((f, i) => {
      const type = f.constructor?.name || 'Unknown';
      const name = f.getName?.() || `Unknown_${i + 1}`;
      return { index: i + 1, name, type };
    });

    return NextResponse.json({ ok: true, template: path.relative(process.cwd(), pdfPath), count: fields.length, fields });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
