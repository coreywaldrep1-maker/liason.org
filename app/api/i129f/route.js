// app/api/i129f/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import path from 'node:path';
import { readFile, access } from 'node:fs/promises';
import { constants as FS } from 'node:fs';
import { PDFDocument, StandardFonts } from 'pdf-lib';

import sql from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { applyI129fMapping } from '@/lib/i129f-mapping';

const CANDIDATE_PDFS = [
  'public/i-129f.pdf',
  'public/forms/i-129f.pdf',
  'public/us/i-129f.pdf',
  'public/forms/i-129f (81).pdf',
];

async function resolveTemplatePath() {
  for (const rel of CANDIDATE_PDFS) {
    const p = path.join(process.cwd(), rel);
    try {
      await access(p, FS.R_OK);
      return p;
    } catch {}
  }
  // last resort: first path
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

  // Checkboxes
  if (typeof field.check === 'function' && typeof field.uncheck === 'function') {
    if (isTruthy(val)) field.check();
    else field.uncheck();
    return;
  }

  // Radio / dropdown
  if (typeof field.select === 'function') {
    const s = String(val ?? '').trim();
    if (!s) return;
    try { field.select(s); } catch {}
    return;
  }

  // Text
  if (typeof field.setText === 'function') {
    const s = String(val ?? '').trim();
    if (!s) return;
    field.setText(s);
  }
}

export async function GET(req) {
  try {
    const user = await requireAuth(req);

    // load saved wizard data
    const rows = await sql`
      SELECT data
      FROM i129f_entries
      WHERE user_id = ${user.id}
      LIMIT 1
    `;
    const saved = rows?.[0]?.data || {};

    const pdfPath = await resolveTemplatePath();
    const bytes = await readFile(pdfPath);

    const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: true });
    const form = pdfDoc.getForm();

    // ✅ critical: write mapped values INTO the pdf-lib form
    applyI129fMapping(saved, form);

    // Optional: if you ever store direct PDF field name/value pairs at saved.pdf, apply them too
    const direct =
      saved && typeof saved === 'object' && saved.pdf && typeof saved.pdf === 'object' ? saved.pdf : null;

    if (direct) {
      for (const field of form.getFields()) {
        const name = field.getName();
        if (direct[name] === undefined || direct[name] === null || direct[name] === '') continue;
        fillAnyField(field, direct[name]);
      }
    }

    // Make filled values visible in most viewers
    try {
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      form.updateFieldAppearances(font);
    } catch {}

    // Optional flatten
    const flatten = new URL(req.url).searchParams.get('flatten') === '1';
    if (flatten) {
      try { form.flatten(); } catch {}
    }

    const out = await pdfDoc.save();

    return new NextResponse(out, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="i-129f-filled.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
