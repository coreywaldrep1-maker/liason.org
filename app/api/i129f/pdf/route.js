// app/api/i129f/pdf/route.js
export const runtime = 'nodejs';

import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { requireAuth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { applyI129fMapping } from '@/lib/i129f-mapping';

async function loadTemplate() {
  const filePath = path.join(process.cwd(), 'public', 'i-129f.pdf');
  return await readFile(filePath);
}

export async function GET(req) {
  try {
    const user = await requireAuth(req);

    // Load saved JSON
    const { rows } = await sql`
      SELECT data FROM i129f_entries WHERE user_id = ${user.id} LIMIT 1
    `;
    const saved = rows?.[0]?.data || {};

    // Load template & fill
    const bytes = await loadTemplate();
    const pdfDoc = await PDFDocument.load(bytes);
    const form = pdfDoc.getForm();

    applyI129fMapping(saved, form);

    // Keep fields editable (no flatten); update appearances
    const out = await pdfDoc.save({ updateFieldAppearances: true });

    return new NextResponse(out, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="i-129f-filled.pdf"',
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }
}
