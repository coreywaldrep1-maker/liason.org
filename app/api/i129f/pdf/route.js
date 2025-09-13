// app/api/i129f/pdf/route.js
import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { requireAuth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { applyI129fMapping } from '@/lib/i129f-mapping';

export const runtime = 'nodejs';

async function loadTemplate() {
  const p = path.join(process.cwd(), 'public', 'i-129f.pdf');
  return readFile(p);
}

function truthy(v) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return ['y','yes','true','1','checked','on'].includes(v.trim().toLowerCase());
  return false;
}

/** Try text, then checkbox, then radio */
function fillAnyField(pdfForm, name, value) {
  try { pdfForm.getTextField(name).setText(value == null ? '' : String(value)); return true; } catch {}
  try { const cb = pdfForm.getCheckBox(name); truthy(value) ? cb.check() : cb.uncheck(); return true; } catch {}
  try { pdfForm.getRadioGroup(name).select(String(value)); return true; } catch {}
  return false;
}

async function renderPdfFromData(formJson) {
  const mapped = applyI129fMapping(formJson);
  const bytes = await loadTemplate();
  const pdf = await PDFDocument.load(bytes);
  const form = pdf.getForm();

  for (const [name, val] of Object.entries(mapped)) {
    fillAnyField(form, name, val);
  }
  form.updateFieldAppearances();
  return pdf.save(); // keep fields editable
}

// GET -> from DB
export async function GET(req) {
  try {
    const user = await requireAuth(req);

    const { rows } = await sql`
      SELECT data FROM i129f_entries
      WHERE user_id = ${user.id}
      LIMIT 1
    `;
    if (!rows?.length) {
      return NextResponse.json({ ok: false, error: 'No saved data' }, { status: 400 });
    }
    const formJson = rows[0].data || {};
    const out = await renderPdfFromData(formJson);

    return new NextResponse(out, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="i-129f-filled.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

// POST -> from current client JSON (no DB needed)
export async function POST(req) {
  try {
    // still require auth so PDFs aren’t public
    await requireAuth(req);

    const body = await req.json().catch(() => ({}));
    const formJson = body?.data || {};
    const out = await renderPdfFromData(formJson);

    return new NextResponse(out, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="i-129f-filled.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
