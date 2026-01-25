export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import path from 'node:path';
import { readFile, access } from 'node:fs/promises';
import { constants as FS } from 'node:fs';

import sql from '@/lib/db';
import { getUserFromCookie, requireAuth } from '@/lib/auth';
import { fillI129FPdf } from '@/lib/pdf/fillI129F';

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

async function loadTemplateBytes() {
  const templatePath = await resolveTemplatePath();
  const bytes = await readFile(templatePath);
  return { templatePath, bytes };
}

function wantsDownload(searchParams) {
  const raw = (searchParams.get('download') || '').toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes';
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

// GET /api/i129f
// - Default: returns JSON of the saved draft for the logged-in user.
// - If ?download=1: returns a filled PDF (or blank template as fallback).
export async function GET(req) {
  const url = new URL(req.url);
  const download = wantsDownload(url.searchParams);

  if (download) {
    // This endpoint exists for backward compatibility (old links used /api/i129f?download=1)
    const { templatePath, bytes } = await loadTemplateBytes();

    // Try to fill from saved DB data if available
    try {
      const user = await getUserFromCookie(req);
      if (user?.id) {
        const rows = await sql`
          SELECT data
          FROM i129f_entries
          WHERE user_id = ${user.id}
          LIMIT 1
        `;
        const data = rows[0]?.data ?? null;
        if (data && typeof data === 'object' && Object.keys(data).length) {
          try {
            const filled = await fillI129FPdf(data, { templatePath });
            return pdfResponse(filled, 'i-129f-filled.pdf');
          } catch (e) {
            console.error('[i129f GET download] fill failed; returning blank template:', e);
          }
        }
      }
    } catch (e) {
      // ignore and fall through to blank
    }

    return pdfResponse(bytes, 'i-129f.pdf');
  }

  // JSON mode: require login
  try {
    const user = await requireAuth(req);
    const rows = await sql`
      SELECT data, updated_at
      FROM i129f_entries
      WHERE user_id = ${user.id}
      LIMIT 1
    `;

    return NextResponse.json({
      ok: true,
      data: rows[0]?.data ?? {},
      updated_at: rows[0]?.updated_at ?? null,
    });
  } catch (err) {
    const msg = String(err?.message || err);
    const status = msg.includes('no-jwt') || msg.includes('no-user') ? 401 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
