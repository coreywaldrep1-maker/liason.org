// app/api/i129f/pdf/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import path from 'node:path';
import { readFile, access } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { PDFDocument, StandardFonts } from 'pdf-lib';

import sql from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { applyI129fMapping } from '@/lib/i129f-mapping';

const CANDIDATE_PDFS = [
  path.join(process.cwd(), 'public', 'i-129f.pdf'),
  path.join(process.cwd(), 'public', 'forms', 'i-129f.pdf'),
  path.join(process.cwd(), 'public', 'forms', 'i-129f (81).pdf'),
];

async function readFirstExisting(paths) {
  for (const p of paths) {
    try {
      await access(p, fsConstants.F_OK);
      return readFile(p);
    } catch {
      // keep trying
    }
  }
  throw new Error(`I-129F template PDF not found. Looked in: ${paths.join(', ')}`);
}

async function loadSavedFromDb(req) {
  const user = await requireAuth(req);
  const rows = await sql`SELECT data FROM i129f_entries WHERE user_id = ${user.id} LIMIT 1`;
  return rows?.[0]?.data ?? {};
}

async function buildFilledPdfBytes(saved, { flatten = false } = {}) {
  const pdfBytes = await readFirstExisting(CANDIDATE_PDFS);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);

  applyI129fMapping(saved, form);

  // Force appearances so Chrome/Preview show the values
  form.updateFieldAppearances(helv);

  if (flatten) {
    form.flatten();
  }

  return pdfDoc.save();
}

function asAttachment(pdfBytes, filename = 'i-129f-filled.pdf') {
  return new NextResponse(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

// GET is what your wizard link uses: <a href="/api/i129f/pdf">
export async function GET(req) {
  try {
    const saved = await loadSavedFromDb(req);
    const flatten = req.nextUrl.searchParams.get('flatten') === '1' || req.nextUrl.searchParams.get('flatten') === 'true';

    const out = await buildFilledPdfBytes(saved, { flatten });
    return asAttachment(out);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

// POST (optional) if you ever want to generate from provided data
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const saved = body?.data ?? body ?? {};

    const flatten = Boolean(body?.flatten);
    const out = await buildFilledPdfBytes(saved, { flatten });
    return asAttachment(out);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
