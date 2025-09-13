// app/api/i129f/pdf/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';
import { neon } from '@neondatabase/serverless';
import { requireAuth } from '@/lib/auth';
import { applyI129fMapping } from '@/lib/i129f-mapping'; // make sure this exists/exports

const sql = neon(process.env.DATABASE_URL);

async function loadTemplate() {
  const filePath = path.join(process.cwd(), 'public', 'i-129f.pdf');
  return await readFile(filePath);
}

async function loadSavedJSON(userId) {
  // NOTE: user_id column must match your auth type (integer vs UUID)
  // Your latest me() output shows integer IDs, so we query as integer:
  const rows = await sql`SELECT data FROM i129f_entries WHERE user_id = ${userId} LIMIT 1`;
  if (!rows?.length) return null;
  return rows[0].data || null;
}

async function makePdfForUser(user) {
  const savedJson = await loadSavedJSON(user.id);
  if (!savedJson) {
    return NextResponse.json({ ok: false, error: 'No saved data' }, { status: 400 });
  }

  const tplBytes = await loadTemplate();
  const pdfDoc = await PDFDocument.load(tplBytes);
  const form = pdfDoc.getForm();

  // Important: keep the form editable so users can tweak in Acrobat
  form.updateFieldAppearances(pdfDoc); // do NOT call form.flatten()

  // Fill using your centralized mapping helper
  const { filled, missing, errors } = applyI129fMapping(savedJson, form);

  // Optional debug – attach a comment to the PDF with missing fields (not required)
  if (missing?.length) {
    // no-op; you can log if you want:
    // console.warn('[pdf] missing fields:', missing);
  }
  if (errors?.length) {
    // console.warn('[pdf] fill errors:', errors);
  }

  const outBytes = await pdfDoc.save();
  return new NextResponse(outBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="i-129f-draft.pdf"',
      'Cache-Control': 'no-store',
    },
  });
}

export async function GET(req) {
  try {
    const user = await requireAuth(req); // throws if not logged in
    return await makePdfForUser(user);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }
}

export async function POST(req) {
  try {
    const user = await requireAuth(req); // throws if not logged in
    return await makePdfForUser(user);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }
}
