import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// Where your blank I-129F lives:
const FORM_PATH = path.join(process.cwd(), 'public', 'forms', 'i-129f.pdf');

// Helper: safely read nested values like "petitioner.fullName"
function get(obj, dotted, fallback = '') {
  return dotted.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : undefined), obj) ?? fallback;
}

// 🔴 SAMPLE mapping — update/add more fields over time
// page: 0-based, coords in PDF points; tweak x/y after you test the draft
const MAPPING = [
  { field: 'petitioner.fullName', page: 0, x: 90,  y: 700, size: 10 },
  { field: 'petitioner.dob',      page: 0, x: 90,  y: 682, size: 10 },
  { field: 'petitioner.ssn',      page: 0, x: 420, y: 700, size: 10 },
  { field: 'beneficiary.fullName',page: 0, x: 90,  y: 645, size: 10 }
];

async function buildPdf(answers) {
  const src = await fs.readFile(FORM_PATH);
  const pdf = await PDFDocument.load(src, { ignoreEncryption: true }); // works with encrypted view-only PDFs
  const helv = await pdf.embedStandardFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();

  for (const m of MAPPING) {
    const val = String(get(answers, m.field, '')).trim();
    if (!val) continue;

    const page = pages[m.page] || pages[0];
    page.drawText(val, {
      x: m.x,
      y: m.y,
      size: m.size || 10,
      font: helv,
      color: rgb(0, 0, 0),
    });
  }

  return await pdf.save();
}

export async function GET() {
  try {
    const bytes = await buildPdf(SAMPLE_ANSWERS);
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="i-129f-draft.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const answers = body?.answers || body || {};
    const bytes = await buildPdf(answers);

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="i-129f-draft.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
