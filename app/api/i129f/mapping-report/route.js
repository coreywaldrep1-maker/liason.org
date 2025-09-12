// app/api/i129f/mapping-report/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { neon } from '@neondatabase/serverless';
import { PDFDocument } from 'pdf-lib';
import { readFile } from 'fs/promises';
import path from 'path';
import { applyI129fMapping } from '@/lib/i129f-mapping';

const sql = neon(process.env.DATABASE_URL);

function get(obj, path) {
  if (!obj) return undefined;
  const parts = String(path).replaceAll('[', '.').replaceAll(']', '').split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

async function loadTemplate() {
  const p = path.join(process.cwd(), 'public', 'i-129f.pdf');
  return await readFile(p);
}

export async function GET(req) {
  try {
    const user = await requireAuth(req);

    const rows = await sql`
      SELECT data FROM i129f_entries WHERE user_id = ${user.id} LIMIT 1
    `;
    const saved = rows.length ? rows[0].data : {};

    const bytes = await loadTemplate();
    const pdf = await PDFDocument.load(bytes);
    const form = pdf.getForm();

    const pdfNames = form.getFields().map(f => f.getName());

    // collect missing during apply
    const missing = [];
    applyI129fMapping(saved, form, {
      onMissingPdfField: (m) => missing.push(m),
    });

    // quick preview values by peeking into lib/i129f-mapping map again
    // (we can’t import the raw map, so re-run applyI129fMapping for side list only)
    return NextResponse.json({
      ok: true,
      pdfFieldCount: pdfNames.length,
      first20PdfFields: pdfNames.slice(0, 20),
      missingTargets: missing, // [{jsonPath, pdfName}]
      // tiny snapshot of your data to confirm paths exist:
      sampleValues: {
        'petitioner.lastName': get(saved, 'petitioner.lastName') ?? null,
        'mailing.street': get(saved, 'mailing.street') ?? null,
        'employment[0].employer': get(saved, 'employment[0].employer') ?? null,
        'beneficiary.lastName': get(saved, 'beneficiary.lastName') ?? null,
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }
}
