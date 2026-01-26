// app/api/i129f/pdf/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
  return path.join(process.cwd(), CANDIDATE_PDFS[0]);
}

function isTruthy(v) {
  if (v === true) return true;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return s && s !== 'off' && s !== 'false' && s !== '0' && s !== 'no';
  }
  return false;
}

function fillAnyField(field, val) {
  if (val === undefined || val === null) return;

  if (typeof field.check === 'function' && typeof field.uncheck === 'function') {
    if (isTruthy(val)) field.check();
    else field.uncheck();
    return;
  }

  if (typeof field.select === 'function') {
    const s = String(val ?? '').trim();
    if (!s) return;
    try { field.select(s); } catch {}
    return;
  }

  if (typeof field.setText === 'function') {
    const s = String(val ?? '').trim();
    if (!s) return;
    field.setText(s);
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const data = body?.data;

    // Accept either:
    // 1) { data: { pdf: { [fieldName]: value } } }
    // 2) { data: { [fieldName]: value } }   (direct map)
    const direct =
      (data && typeof data === 'object' && data.pdf && typeof data.pdf === 'object')
        ? data.pdf
        : (data && typeof data === 'object' ? data : {});

    const pdfPath = await resolveTemplatePath();
    const bytes = await readFile(pdfPath);

    const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const form = pdfDoc.getForm();

    // Fill only what we were given (fast), ignoring missing names
    for (const [name, val] of Object.entries(direct)) {
      if (val === undefined || val === null || val === '') continue;
      let field;
      try { field = form.getField(name); } catch { field = null; }
      if (!field) continue;
      fillAnyField(field, val);
    }

    try { form.flatten(); } catch {}
    const out = await pdfDoc.save();

    return new NextResponse(out, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="i-129f-draft.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
