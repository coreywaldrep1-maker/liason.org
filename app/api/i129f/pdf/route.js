// app/api/i129f/pdf/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { applyI129fMapping } from '@/lib/i129f-mapping';

async function loadTemplate() {
  const filePath = path.join(process.cwd(), 'public', 'i-129f.pdf');
  return await readFile(filePath);
}

export async function GET(req) {
  try {
    const user = await requireAuth(req);
    if (!user?.id) throw new Error('no-user');

    // load saved JSON
    const rows = await sql`
      SELECT data
      FROM i129f_entries
      WHERE user_id = ${user.id}
      LIMIT 1
    `;
    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: 'No saved data' }, { status: 400 });
    }
    const saved = rows[0].data || {};

    // load template & fill
    const pdfBytes = await loadTemplate();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    // 🔑 apply all mappings here
    applyI129fMapping(saved, form);

    // keep fields editable by the user in Acrobat
    form.flatten({ updateFieldAppearances: false });

    const out = await pdfDoc.save();
    return new NextResponse(out, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="i-129f.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
