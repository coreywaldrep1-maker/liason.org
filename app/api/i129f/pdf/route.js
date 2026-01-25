export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import path from 'node:path';
import { readFile, access } from 'node:fs/promises';
import { constants as FS } from 'node:fs';

import sql from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';
import { fillI129FPdf } from '@/lib/pdf/fillI129F';

// Keep in sync with other PDF utilities/routes.
const CANDIDATE_PDFS = [
  'public/i-129f.pdf',
  'public/forms/i-129f.pdf',
  'public/us/i-129f.pdf',
  // legacy names
  'public/forms/i129f-template.pdf',
  'public/i129f-template.pdf',
];

async function resolveTemplatePath() {
  for (const rel of CANDIDATE_PDFS) {
    const p = path.join(process.cwd(), rel);
    try {
      await access(p, FS.R_OK);
      return p;
    } catch {
      // try next
    }
  }
  return path.join(process.cwd(), CANDIDATE_PDFS[0]);
}

async function loadTemplateBytes() {
  const templatePath = await resolveTemplatePath();
  const bytes = await readFile(templatePath);
  return { templatePath, bytes };
}

async function loadSavedForSession(req) {
  try {
    const user = await getUserFromCookie(req);
    if (!user?.id) return null;

    const rows = await sql`
      SELECT data, updated_at
      FROM i129f_entries
      WHERE user_id = ${user.id}
      LIMIT 1
    `;

    return rows[0]?.data ?? null;
  } catch {
    return null;
  }
}

function pdfResponse(buffer, filename) {
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

// GET /api/i129f/pdf
// - If logged in and you have a saved draft in DB, attempts to return a filled PDF.
// - Otherwise returns the blank template.
export async function GET(req) {
  const { templatePath, bytes } = await loadTemplateBytes();

  const saved = await loadSavedForSession(req);
  if (saved && typeof saved === 'object' && Object.keys(saved).length) {
    try {
      const filled = await fillI129FPdf(saved, { templatePath });
      return pdfResponse(filled, 'i-129f-filled.pdf');
    } catch (err) {
      // If filling fails (e.g., XFA template), fall back to blank template.
      console.error('[i129f/pdf GET] fill failed; returning blank template:', err);
    }
  }

  return pdfResponse(bytes, 'i-129f.pdf');
}

// POST /api/i129f/pdf
// Body: { data: { ...wizardData } }
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const data = body?.data ?? body ?? null;

    if (!data || typeof data !== 'object') {
      return NextResponse.json({ ok: false, error: 'Missing data' }, { status: 400 });
    }

    const { templatePath } = await loadTemplateBytes();
    const filled = await fillI129FPdf(data, { templatePath });
    return pdfResponse(filled, 'i-129f-filled.pdf');
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'PDF generation failed' },
      { status: 500 }
    );
  }
}
