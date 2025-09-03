// app/api/i129f/pdf/route.js
import { NextResponse } from 'next/server';
import { neon, neonConfig } from '@neondatabase/serverless';
import { getUserFromCookie } from '@/lib/auth';
import { PDFDocument } from 'pdf-lib';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  MAPPING_TEXT,
  MAPPING_CHECK,
  UNIT_TYPE_CHECKS_PETITIONER_MAILING,
  UNIT_TYPE_CHECKS_PETITIONER_PHYSICAL,
  UNIT_TYPE_CHECKS_BENEFICIARY_MAILING,
  UNIT_TYPE_CHECKS_BENEFICIARY_PHYSICAL,
} from '@/lib/i129f-map';

export const runtime = 'nodejs';
neonConfig.fetchConnectionCache = true;
const sql = neon(process.env.DATABASE_URL);

// Helper: read nested path with arrays (e.g., a.b[0].c)
function getByPath(obj, pathStr) {
  if (!obj || !pathStr) return undefined;
  const parts = pathStr
    .replace(/\[(\d+)\]/g, '.$1') // convert [0] to .0
    .split('.')
    .filter(Boolean);
  let cur = obj;
  for (const k of parts) {
    if (cur == null) return undefined;
    cur = cur[k];
  }
  return cur;
}

function truthy(val) {
  return !!(val === true || val === 'true' || val === 1 || val === '1' || (typeof val === 'string' && val.length > 0));
}

export async function GET(request) {
  try {
    const user = await getUserFromCookie(request.headers.get('cookie') || '');
    if (!user?.id) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });

    // 1) Load draft
    const rows = await sql`SELECT data FROM i129f_drafts WHERE user_id = ${user.id} LIMIT 1`;
    const draft = rows[0]?.data || {};

    // 2) Load blank form
    const pdfPath = path.join(process.cwd(), 'public', 'forms', 'i-129f.pdf');
    const bytes = await fs.readFile(pdfPath);
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const form = pdf.getForm();

    // 3) Fill TEXT
    for (const [pdfField, pathStr] of Object.entries(MAPPING_TEXT)) {
      const val = getByPath(draft, pathStr);
      if (val == null || val === '') continue;
      try {
        form.getTextField(pdfField).setText(String(val));
      } catch {
        // If not a text field, ignore
      }
    }

    // 4) Set CHECKBOXES
    for (const rule of MAPPING_CHECK) {
      const { field, path, equals } = rule;
      let val = getByPath(draft, path);
      let shouldCheck = equals !== undefined ? val === equals : truthy(val);
      try {
        const cb = form.getCheckBox(field);
        if (shouldCheck) cb.check(); else cb.uncheck();
      } catch {
        // not a checkbox field; ignore
      }
    }

    // 5) Optional: Unit type (Apt/Ste/Flr) mapping if you confirm which ch# equals which
    function setUnitChecks(map, unitType) {
      if (!unitType || !map) return;
      try {
        const key = (unitType || '').toLowerCase();
        const field = map[key];
        if (!field) return;
        form.getCheckBox(field).check();
      } catch { /* ignore */ }
    }
    // Petitioner mailing unit
    setUnitChecks(UNIT_TYPE_CHECKS_PETITIONER_MAILING, getByPath(draft, 'petitioner.mailing.unitType'));
    // Petitioner physical unit
    setUnitChecks(UNIT_TYPE_CHECKS_PETITIONER_PHYSICAL, getByPath(draft, 'petitioner.physical.unitType'));
    // Beneficiary mailing unit
    setUnitChecks(UNIT_TYPE_CHECKS_BENEFICIARY_MAILING, getByPath(draft, 'beneficiary.mailing.unitType'));
    // Beneficiary physical unit
    setUnitChecks(UNIT_TYPE_CHECKS_BENEFICIARY_PHYSICAL, getByPath(draft, 'beneficiary.physical.unitType'));

    // 6) Flatten so filled text/checkboxes render everywhere
    form.flatten();

    // 7) Send file
    const out = await pdf.save();
    return new NextResponse(out, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="i-129f-filled.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
