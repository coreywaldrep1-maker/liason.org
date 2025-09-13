// app/api/i129f/pdf/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { neon } from '@neondatabase/serverless';
import { requireAuth } from '@/lib/auth';
import { applyI129fMapping } from '@/lib/i129f-mapping';

const sql = neon(process.env.DATABASE_URL);

async function loadTemplate() {
  const filePath = path.join(process.cwd(), 'public', 'i-129f.pdf');
  return await readFile(filePath);
}

async function loadSavedJSON(userId) {
  // Your /api/auth/me shows integer ids, so we select as integer:
  const rows = await sql`SELECT data FROM i129f_entries WHERE user_id = ${userId} LIMIT 1`;
  if (!rows?.length) return null;
  return rows[0].data || null;
}

async function makePdfForUser(user) {
  const savedJson = await loadSavedJSON(user.id);
  if (!savedJson) {
    return NextResponse.json({ ok: false, error: 'No saved data' }, { status: 400 });
  }

  // 1) Load template
  const tplBytes = await loadTemplate();
  const pdfDoc = await PDFDocument.load(tplBytes);

  // 2) Get the AcroForm and embed a real font
  const form = pdfDoc.getForm();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // 3) IMPORTANT: tell pdf-lib to use that font for field appearances
  //    (Do NOT pass pdfDoc here; pass the PDFFont we embedded)
  form.updateFieldAppearances(helvetica);

  // 4) Fill fields via your mapping helper
  //    Make sure applyI129fMapping ONLY calls .setText/.check/.select on fields,
  //    and DOES NOT call form.updateFieldAppearances() with bad args.
  const { filled, missing, errors } = applyI129fMapping(savedJson, form) || {};

  // (optional) You can log to inspect missing/errors during development
  // console.log('[pdf] filled:', filled?.length, 'missing:', missing?.length, 'errors:', errors?.length);

  // 5) Return an editable AcroForm PDF (do NOT flatten here)
  const out = await pdfDoc.save();
  return new NextResponse(out, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="i-129f-draft.pdf"',
      'Cache-Control': 'no-store',
    },
  });
}

export async function GET(req) {
  try {
    const user = await requireAuth(req);
    return await makePdfForUser(user);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }
}

export async function POST(req) {
  try {
    const user = await requireAuth(req);
    return await makePdfForUser(user);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }
}
