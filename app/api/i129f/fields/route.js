// app/api/i129f/fields/route.js
// Returns AcroForm field metadata from the I-129F template PDF.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import path from 'node:path';
import { readFile, access } from 'node:fs/promises';
import { constants as FS } from 'node:fs';
import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

const CANDIDATE_PDFS = [
  'public/i-129f.pdf',
  'public/forms/i-129f.pdf',
  'public/us/i-129f.pdf',
  'public/forms/i-129f (81).pdf',
];

async function resolveTemplatePath() {
  for (const rel of CANDIDATE_PDFS) {
    const p = path.join(process.cwd(), rel);
    try {
      await access(p, FS.R_OK);
      return p;
    } catch {}
  }
  return path.join(process.cwd(), CANDIDATE_PDFS[0]);
}

function parsePageNumber(name) {
  const s = String(name || '');
  let m = s.match(/(?:_page|Page)(?:_)?(\d{1,2})/);
  if (!m) m = s.match(/_p(\d{1,2})_/i);

  // one known field has no page marker; it belongs on page 1
  if (!m && s === 'Petitioner_Select_One_box_Classification_of_Beneficiary') return 1;

  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function getFieldType(field) {
  const ctor = field?.constructor?.name || 'Unknown';
  if (ctor === 'PDFTextField') return 'text';
  if (ctor === 'PDFCheckBox') return 'checkbox';
  if (ctor === 'PDFRadioGroup') return 'radio';
  if (ctor === 'PDFDropdown' || ctor === 'PDFOptionList') return 'dropdown';
  return 'unknown';
}

export async function GET() {
  try {
    const pdfPath = await resolveTemplatePath();
    const bytes = await readFile(pdfPath);

    const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const form = pdfDoc.getForm();

    const fields = form.getFields();
    const out = fields
      .map((f, index) => {
        const name = f.getName();
        const type = getFieldType(f);
        let options = null;

        if (type === 'radio' || type === 'dropdown') {
          try {
            options = typeof f.getOptions === 'function' ? f.getOptions() : null;
          } catch {
            options = null;
          }
        }

        return {
          index,
          name,
          type,
          page: parsePageNumber(name),
          options,
          ctor: f?.constructor?.name || 'Unknown',
        };
      })
      .filter((f) => f.type !== 'unknown');

    return NextResponse.json(
      { ok: true, template: path.relative(process.cwd(), pdfPath), count: out.length, fields: out },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
