// app/api/i129f/fields/route.js
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { readFile, access } from 'node:fs/promises';
import { constants as FS } from 'node:fs';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';

const CANDIDATE_PDFS = [
  'public/i-129f.pdf',
  'public/forms/i-129f.pdf',
  'public/us/i-129f.pdf',
];

async function resolveTemplatePath() {
  for (const rel of CANDIDATE_PDFS) {
    const p = path.join(process.cwd(), rel);
    try {
      await access(p, FS.R_OK);
      return p;
    } catch {}
  }
  // fall back to first
  return path.join(process.cwd(), CANDIDATE_PDFS[0]);
}

function inferPageFromName(name) {
  const s = String(name || '');
  const m = s.match(/(?:_page|Page)(\d{1,2})/);
  if (m) return Number(m[1]);
  return 0;
}

export async function GET() {
  try {
    const pdfPath = await resolveTemplatePath();
    const bytes = await readFile(pdfPath);
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const form = pdf.getForm();

    const all = form.getFields().map((f, i) => {
      const type = f.constructor?.name || 'Unknown';
      const name = f.getName?.() || `Unknown_${i + 1}`;
      let kind = 'unknown';
      let options = [];

      // Rely on constructor names so this works even if pdf-lib classes are bundled differently.
      if (type === 'PDFTextField') kind = 'text';
      else if (type === 'PDFCheckBox') kind = 'checkbox';
      else if (type === 'PDFRadioGroup') {
        kind = 'radio';
        try { options = f.getOptions?.() || []; } catch {}
      } else if (type === 'PDFDropdown') {
        kind = 'dropdown';
        try { options = f.getOptions?.() || []; } catch {}
      }

      return {
        index: i + 1,
        name,
        type,
        kind,
        options,
        page: inferPageFromName(name),
      };
    });

    // Filter out non-leaf "parent" fields.
    // If a field "X" exists and any other field starts with "X.", treat X as a parent container.
    const nameSet = new Set(all.map((x) => x.name));
    const isParent = (n) => {
      for (const other of nameSet) {
        if (other.startsWith(n + '.')) return true;
      }
      return false;
    };

    const fields = all.filter((x) => !isParent(x.name));

    return NextResponse.json({
      ok: true,
      template: path.relative(process.cwd(), pdfPath),
      count: fields.length,
      fields,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
// app/api/i129f/fields/route.js
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { readFile, access } from 'node:fs/promises';
import { constants as FS } from 'node:fs';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';

const CANDIDATE_PDFS = [
  'public/i-129f.pdf',
  'public/forms/i-129f.pdf',
  'public/us/i-129f.pdf',
];

async function resolveTemplatePath() {
  for (const rel of CANDIDATE_PDFS) {
    const p = path.join(process.cwd(), rel);
    try {
      await access(p, FS.R_OK);
      return p;
    } catch {}
  }
  // fall back to first
  return path.join(process.cwd(), CANDIDATE_PDFS[0]);
}

function inferPageFromName(name) {
  const s = String(name || '');
  const m = s.match(/(?:_page|Page)(\d{1,2})/);
  if (m) return Number(m[1]);
  return 0;
}

export async function GET() {
  try {
    const pdfPath = await resolveTemplatePath();
    const bytes = await readFile(pdfPath);
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const form = pdf.getForm();

    const all = form.getFields().map((f, i) => {
      const type = f.constructor?.name || 'Unknown';
      const name = f.getName?.() || `Unknown_${i + 1}`;
      let kind = 'unknown';
      let options = [];

      // Rely on constructor names so this works even if pdf-lib classes are bundled differently.
      if (type === 'PDFTextField') kind = 'text';
      else if (type === 'PDFCheckBox') kind = 'checkbox';
      else if (type === 'PDFRadioGroup') {
        kind = 'radio';
        try { options = f.getOptions?.() || []; } catch {}
      } else if (type === 'PDFDropdown') {
        kind = 'dropdown';
        try { options = f.getOptions?.() || []; } catch {}
      }

      return {
        index: i + 1,
        name,
        type,
        kind,
        options,
        page: inferPageFromName(name),
      };
    });

    // Filter out non-leaf "parent" fields.
    // If a field "X" exists and any other field starts with "X.", treat X as a parent container.
    const nameSet = new Set(all.map((x) => x.name));
    const isParent = (n) => {
      for (const other of nameSet) {
        if (other.startsWith(n + '.')) return true;
      }
      return false;
    };

    const fields = all.filter((x) => !isParent(x.name));

    return NextResponse.json({
      ok: true,
      template: path.relative(process.cwd(), pdfPath),
      count: fields.length,
      fields,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
