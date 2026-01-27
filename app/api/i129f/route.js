// app/api/i129f/route.js
import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import fs from 'node:fs';
import path from 'node:path';

import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth/requireAuth';
import { applyI129fMapping } from '@/lib/i129f-mapping';

const CANDIDATE_PDFS = [
  path.join(process.cwd(), 'public', 'i-129f.pdf'),
  path.join(process.cwd(), 'public', 'forms', 'i-129f.pdf'),
];

function resolveTemplateBytes() {
  for (const p of CANDIDATE_PDFS) {
    if (fs.existsSync(p)) return fs.readFileSync(p);
  }
  throw new Error(`No I-129F template PDF found. Tried: ${CANDIDATE_PDFS.join(', ')}`);
}

export async function GET() {
  try {
    const user = await requireAuth();

    const rows = await sql`
      SELECT data
      FROM i129f_entries
      WHERE user_id = ${user.id}
      LIMIT 1
    `;

    const saved = rows?.[0]?.data ?? {};

    const templateBytes = resolveTemplateBytes();
    const pdfDoc = await PDFDocument.load(templateBytes);

    const form = pdfDoc.getForm();

    // Apply mapping
    applyI129fMapping(saved, form);

    // IMPORTANT: make values visible in Chrome/preview by updating appearances
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    form.updateFieldAppearances(font);

    const outBytes = await pdfDoc.save({ updateFieldAppearances: true });

    return new NextResponse(outBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="i-129f-filled.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
