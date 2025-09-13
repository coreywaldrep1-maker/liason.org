// app/api/i129f/pdf/route.js
export const runtime = 'nodejs';

import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts } from 'pdf-lib';

import { requireAuth } from '@/lib/auth';
import { sql } from '@/lib/db'; // <-- must be a named export { sql }
import { applyI129fMapping } from '@/lib/i129f-mapping';

async function loadTemplate() {
  // Reads /public/i-129f.pdf from the deployed filesystem
  const filePath = path.join(process.cwd(), 'public', 'i-129f.pdf');
  return await readFile(filePath);
}

export async function GET(req) {
  try {
    // 1) Require auth (reads cookie, verifies JWT)
    const user = await requireAuth(req); // throws if missing/invalid
    if (!user?.id) {
      return NextResponse.json({ ok: false, error: 'No user id' }, { status: 401 });
    }

    // 2) Load saved JSON for this user
    //    Your table: i129f_entries(user_id INT PRIMARY KEY, data JSONB, updated_at TIMESTAMPTZ)
    const rows = await sql`
      SELECT data
      FROM i129f_entries
      WHERE user_id = ${user.id}
      LIMIT 1
    `;
    const saved = rows?.[0]?.data || null;

    if (!saved) {
      // No saved data: still return a blank PDF so user can type
      // (or change to return 404 JSON if you prefer)
      const blankBytes = await loadTemplate();
      return new NextResponse(blankBytes, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline; filename="i-129f-blank.pdf"',
          'Cache-Control': 'no-store'
        }
      });
    }

    // 3) Load the template & fill
    const templateBytes = await loadTemplate();
    const pdfDoc = await PDFDocument.load(templateBytes);

    const form = pdfDoc.getForm();

    // 4) Apply your JSON -> PDF mapping
    applyI129fMapping(saved, form);

    // 5) Make values visible (update field appearances with a standard font)
    const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
    form.updateFieldAppearances(helv);

    // (Optional) Keep the form editable (do NOT flatten)
    // form.flatten(); // <= DO NOT call if you want users to edit later

    // 6) Output bytes
    const out = await pdfDoc.save({ useObjectStreams: false }); // safer for some viewers

    return new NextResponse(out, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="i-129f-filled.pdf"',
        'Cache-Control': 'no-store'
      }
    });
  } catch (err) {
    console.error('[i129f/pdf] error:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
