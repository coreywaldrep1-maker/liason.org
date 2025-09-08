// app/api/i129f/pdf/route.js
export const runtime = 'nodejs';           // <-- Node runtime so we can read from disk
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import path from 'path';
import { readFile } from 'fs/promises';
import { PDFDocument } from 'pdf-lib';
import { neon } from '@neondatabase/serverless';

import { requireAuth } from '@/lib/auth';
import { applyI129fMapping } from '@/lib/i129f-mapping'; // <-- ✅ the missing import

const sql = neon(process.env.DATABASE_URL);

// Read /public/i-129f.pdf from the deployed filesystem
async function loadTemplate() {
  const filePath = path.join(process.cwd(), 'public', 'i-129f.pdf');
  return await readFile(filePath);
}

export async function GET(req) {
  try {
    // 1) Auth
    const user = await requireAuth(req); // throws if no token
    if (!user?.id) throw new Error('no-user');

    // 2) Load saved JSON (works whether user.id is number or string)
    const { id } = user;
    const rows = await sql`
      SELECT data
      FROM i129f_entries
      WHERE user_id = ${id}
      LIMIT 1
    `;
    const savedJsonRaw = rows[0]?.data ?? {};
    const savedJson = typeof savedJsonRaw === 'string'
      ? safeParse(savedJsonRaw, {})
      : (savedJsonRaw || {});

    // 3) Load PDF, fill, (leave unflattened so users can still edit)
    const tpl = await loadTemplate();
    const pdfDoc = await PDFDocument.load(tpl);
    const form = pdfDoc.getForm();

    // <-- ✅ actually apply your mapping
    applyI129fMapping(savedJson, form);

    // If you ever want to make fields uneditable, uncomment:
    // form.flatten();

    const out = await pdfDoc.save();

    const res = new NextResponse(out, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="I-129F-filled.pdf"',
        'Cache-Control': 'no-store',
      },
    });
    return res;
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }
}

function safeParse(s, fallback) {
  try { return JSON.parse(s); } catch { return fallback; }
}
