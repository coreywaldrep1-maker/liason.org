// app/api/i129f/pdf/route.js
export const runtime = 'nodejs';

import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

import { requireAuth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { applyI129fMapping } from '@/lib/i129f-mapping';

// Reads /public/i-129f.pdf from the deployed filesystem
async function loadTemplate() {
  const filePath = path.join(process.cwd(), 'public', 'i-129f.pdf');
  return await readFile(filePath);
}

export async function GET(req) {
  try {
    // 1) Auth (throws if no cookie / bad token)
    const user = await requireAuth(req); // returns { id, email }

    // 2) Load saved wizard data (fallback to {})
    // NOTE: user.id is an integer in your current DB. If you change it to UUID,
    //       update both the table and the auth payload consistently.
    const rows = await sql`
      SELECT data
      FROM i129f_entries
      WHERE user_id = ${user.id}
      LIMIT 1
    `;
    const saved = rows?.[0]?.data || {};

    // 3) Load template PDF
    const tplBytes = await loadTemplate();

    // 4) Fill with mapping
    const pdfDoc = await PDFDocument.load(tplBytes);
    const form = pdfDoc.getForm();

    // Safe: skips any fields that are missing or non-text
    applyI129fMapping(saved, form);

    // 5) Return the filled PDF
    const out = await pdfDoc.save();
    return new NextResponse(out, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="I-129F-filled.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    // Bubble up the actual error so you can see what's wrong
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
