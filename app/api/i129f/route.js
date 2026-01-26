// app/api/i129f/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { readFile, access } from 'node:fs/promises';
import { constants as FS } from 'node:fs';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';

import sql from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { applyI129fMapping } from '@/lib/i129f-mapping';

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
  // pdf-lib field types vary; we use feature detection.
  if (val === undefined || val === null) return;

  // Checkboxes
  if (typeof field.check === 'function' && typeof field.uncheck === 'function') {
    if (isTruthy(val)) field.check();
    else field.uncheck();
    return;
  }

  // Radio groups / dropdowns
  if (typeof field.select === 'function') {
    const s = String(val ?? '').trim();
    if (!s) return;
    try { field.select(s); } catch {}
    return;
  }

  // Text fields
  if (typeof field.setText === 'function') {
    const s = String(val ?? '').trim();
    if (!s) return;
    field.setText(s);
    return;
  }
}

export async function GET(req) {
  try {
    const user = await requireAuth(req);

    // Load latest saved wizard state from the same table used by /api/i129f/save
    const rows = await sql`
      SELECT data
      FROM i129f_entries
      WHERE user_id = ${user.id}
      LIMIT 1
    `;
    const saved = rows?.[0]?.data || {};

    // Prefer exact PDF field values if provided (Wizard stores these at data.pdf[fieldName])
    const direct = (saved && typeof saved === 'object' && saved.pdf && typeof saved.pdf === 'object') ? saved.pdf : null;

    // Otherwise, fall back to mapping (for older structured wizard data)
    const mapped = direct || applyI129fMapping(saved) || {};

    const pdfPath = await resolveTemplatePath();
    const bytes = await readFile(pdfPath);

    const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const form = pdfDoc.getForm();

    for (const field of form.getFields()) {
      const name = field.getName();
      const val = mapped[name];
      if (val === undefined || val === null || val === '') continue;
      fillAnyField(field, val);
    }

    // Flatten if possible (optional)
    try { form.flatten(); } catch {}

    const out = await pdfDoc.save();

    return new NextResponse(out, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="i-129f-filled.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
