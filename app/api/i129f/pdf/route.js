import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { neon } from '@neondatabase/serverless';
import { requireAuth } from '@/lib/auth';
import { applyI129fMapping } from '@/lib/i129f-mapping';

export const runtime = 'nodejs';

const sql = neon(process.env.DATABASE_URL);

async function loadTemplate() {
  const p = path.join(process.cwd(), 'public', 'i-129f.pdf');
  return await readFile(p);
}

export async function GET(req) {
  try {
    const user = await requireAuth(req); // { id, email }

    // pull saved JSON for this user
    const rows = await sql`SELECT data FROM i129f_entries WHERE user_id = ${user.id} LIMIT 1`;
    const saved = rows[0]?.data || {};

    // load + fill
    const bytes = await loadTemplate();
    const pdf = await PDFDocument.load(bytes);
    const form = pdf.getForm();

    // <-- fill fields from your saved JSON
    applyI129fMapping(saved, form);

    form.flatten(); // keep editable? comment this out to keep as AcroForm
    const out = await pdf.save();

    return new NextResponse(out, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="I-129F.pdf"',
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
