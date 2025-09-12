// app/api/i129f/pdf/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { neon } from '@neondatabase/serverless';
import { PDFDocument } from 'pdf-lib';
import { readFile } from 'fs/promises';
import path from 'path';
import { applyI129fMapping } from '@/lib/i129f-mapping';

const sql = neon(process.env.DATABASE_URL);

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

    // Apply our mapping
    const { missing } = applyI129fMapping(saved, form);

    // (optional) log missing fields server-side
    if (missing.length) {
      console.warn('[i129f] Missing PDF fields:', missing.slice(0, 5), `(+${Math.max(missing.length-5,0)} more)`);
    }

    const out = await pdf.save();
    return new NextResponse(out, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="i-129f-filled.pdf"',
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }
}
