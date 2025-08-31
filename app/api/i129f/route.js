// app/api/i129f/route.js
import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { I129F_FIELD_MAP as MAP } from '@/lib/i129fFieldMap';

// Location of your finalized AcroForm:
// Put your finished PDF at public/forms/i-129f.pdf
const PDF_PATH = `${process.cwd()}/public/forms/i-129f.pdf`;

// --- Helpers ---------------------------------------------------------------

async function loadPdf() {
  const fs = await import('fs/promises');
  const bytes = await fs.readFile(PDF_PATH);
  // ignoreEncryption true: safe if the file has an “encryption flag” but no password
  return PDFDocument.load(bytes, { ignoreEncryption: true });
}

function setTextSafe(form, fieldName, value) {
  if (!value && value !== 0) return;
  try {
    const f = form.getTextField(fieldName);
    f.setText(String(value));
  } catch {
    // ignore missing field
  }
}

function setCheckSafe(form, fieldName, checked) {
  try {
    const f = form.getCheckBox(fieldName);
    if (checked) f.check();
    else f.uncheck();
  } catch {
    // if it’s actually a radio group, try selecting when true
    if (checked) {
      try {
        const r = form.getRadioGroup(fieldName);
        // If your radio has multiple options, you can set a specific one later.
        // Here, we just “select the group” by picking the first option name.
        const opts = r.getOptions();
        if (opts && opts.length) r.select(opts[0]);
      } catch {
        // ignore
      }
    }
  }
}

function applyData(form, data) {
  // Text fields
  for (const [key, pdfName] of Object.entries(MAP.text)) {
    setTextSafe(form, pdfName, data[key]);
  }
  // Checkboxes/radios
  for (const [key, pdfName] of Object.entries(MAP.checks)) {
    const val = data[key];
    if (typeof val === 'boolean') setCheckSafe(form, pdfName, val);
    else if (val === 'yes' || val === 'on' || val === 'true' || val === '1') setCheckSafe(form, pdfName, true);
    else setCheckSafe(form, pdfName, false);
  }
}

// --- Routes ----------------------------------------------------------------

// GET  /api/i129f?fields=1   -> quick dump of field names
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const wantFields = searchParams.get('fields');

  try {
    const pdfDoc = await loadPdf();
    const form = pdfDoc.getForm();

    if (wantFields) {
      const names = form.getFields().map(f => f.getName());
      return NextResponse.json({ ok: true, count: names.length, fields: names });
    }

    return NextResponse.json({ ok: true, message: 'I-129F PDF endpoint' });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

// POST /api/i129f  with JSON: { data: {...} } -> returns filled PDF
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const data = body?.data || {};

    const pdfDoc = await loadPdf();
    const form = pdfDoc.getForm();

    applyData(form, data);

    // (Optional) flatten so text is embedded and fields aren’t editable:
    // form.flatten();

    const bytes = await pdfDoc.save();
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="i-129f-filled.pdf"',
      },
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
