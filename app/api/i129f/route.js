// app/api/i129f/route.js
import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { neon } from '@neondatabase/serverless';
import * as jose from 'jose';

const sql = neon(process.env.DATABASE_URL);

// Your PDF template name
const TEMPLATE_FILE = 'i-129f.pdf';
const TEMPLATE_PATH = path.join(process.cwd(), 'public', 'forms', TEMPLATE_FILE);

function getCookie(req, name) {
  const raw = req.headers.get('cookie') || '';
  const found = raw.split(';').map(v => v.trim()).find(v => v.startsWith(name + '='));
  return found ? decodeURIComponent(found.split('=')[1]) : null;
}

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

export async function GET(request) {
  try {
    const templateBytes = await readFile(TEMPLATE_PATH);
    const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });

    const form = pdfDoc.getForm();
    const data = (await getLatestFormData(request)) || {};

    // Fill form fields from saved data
    for (const f of form.getFields()) {
      const name = f.getName();
      let val = getByPath(data, name);
      if (val !== undefined) fillField(f, val);
    }

    // Flatten form
    form.flatten();
    
    // Generate PDF
    const out = await pdfDoc.save();
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
