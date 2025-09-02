// app/api/i129f/route.js
// Streams a filled I-129F PDF using your AcroForm template + latest saved data.

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { neon } from '@neondatabase/serverless';
import * as jose from 'jose';

const sql = neon(process.env.DATABASE_URL);

// CHANGE THIS to match the actual filename you put under /public/forms
// e.g. 'USCIS I-129F 2025.pdf'  or  'i-129f.pdf'
const TEMPLATE_FILE = 'USCIS I-129F 2025.pdf';
const TEMPLATE_PATH = path.join(process.cwd(), 'public', 'forms', TEMPLATE_FILE);

// tiny cookie getter (works in Node runtime)
function getCookie(req, name) {
  const raw = req.headers.get('cookie') || '';
  const found = raw.split(';').map(v => v.trim()).find(v => v.startsWith(name + '='));
  return found ? decodeURIComponent(found.split('=')[1]) : null;
}

// read latest saved JSON for this user (if any)
async function getLatestFormData(request) {
  try {
    const token = getCookie(request, 'liason_token');
    if (!token || !process.env.JWT_SECRET) return null;

    const { payload } = await jose.jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );
    const userId = payload?.sub;
    if (!userId) return null;

    // Adjust table/column names if yours differ
    // Expecting a table like: i129f_forms(user_id UUID, data JSONB, updated_at TIMESTAMPTZ default now())
    const rows = await sql`
      SELECT data
      FROM i129f_forms
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC NULLS LAST
      LIMIT 1
    `;
    return rows[0]?.data ?? null;
  } catch {
    return null;
  }
}

// Safe, duck-typed field filler for pdf-lib fields
function fillField(field, value) {
  if (value === undefined || value === null) return;

  // normalize booleans for checkboxes / radios
  const yesish = v => (
    v === true || v === 'true' || v === 1 || v === '1' ||
    v === 'Y' || v === 'y' || v === 'Yes' || v === 'yes' || v === 'on'
  );

  try {
    // Text field?
    if (typeof field.setText === 'function') {
      field.setText(String(value));
      return;
    }
    // Dropdown / option list?
    if (typeof field.select === 'function') {
      if (Array.isArray(value)) {
        // OptionList may accept multiple; select first fallback
        field.select(...value.map(String));
      } else {
        field.select(String(value));
      }
      return;
    }
    // Checkbox?
    if (typeof field.mark === 'function' && typeof field.unmark === 'function') {
      if (yesish(value)) field.mark(); else field.unmark();
      return;
    }
    // Radio group? (pdf-lib exposes select for radios too)
    if (typeof field.select === 'function') {
      field.select(String(value));
      return;
    }
  } catch {
    // ignore single field errors so others still fill
  }
}

// Optional explicit mapping for aliases (only needed if your PDF field names
// don’t exactly match your JSON keys). You can add rows like:
// 'Petitioner_LastName': 'petitioner.lastName',
const MAPPING = {
  // 'PDF field name' : 'json.path.like.this',
};

// resolve dot paths from JSON (e.g. "petitioner.address.city")
function getByPath(obj, dotPath) {
  if (!dotPath) return undefined;
  const parts = dotPath.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) cur = cur[p];
    else return undefined;
  }
  return cur;
}

export async function GET(request) {
  try {
    // 1) Load the template (AcroForm) from /public/forms
    const templateBytes = await readFile(TEMPLATE_PATH);
    const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });

    const form = pdfDoc.getForm();

    // 2) Pull the latest saved JSON for the signed-in user (if available)
    const data = (await getLatestFormData(request)) || {};

    // 3) Fill by name match, with optional alias mapping fallback
    const fields = form.getFields();
    for (const f of fields) {
      const name = f.getName();

      // Try exact key match first
      let val = getByPath(data, name);

      // If no direct match, try alias mapping to a dot-path
      if (val === undefined && MAPPING[name]) {
        val = getByPath(data, MAPPING[name]);
      }

      // Fill if we found a value
      if (val !== undefined) {
        fillField(f, val);
      }
    }

    // 4) Flatten so it looks final when downloaded
    form.flatten();

    const out = await pdfDoc.save();
    return new NextResponse(out, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="i-129f-filled.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    // Helpful error for debugging if anything goes wrong
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
