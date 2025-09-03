export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import { PDFDocument } from 'pdf-lib';
import fs from 'node:fs/promises';
import path from 'node:path';

const sql = neon(process.env.DATABASE_URL);
const COOKIE = 'liason_token';

function requireUser(req) {
  const cookie = req.headers.get('cookie') || '';
  const m = cookie.match(new RegExp(`${COOKIE}=([^;]+)`));
  if (!m) throw new Error('Not authenticated');
  const token = decodeURIComponent(m[1]);
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  return { id: payload.sub || payload.id };
}

export async function GET(request) {
  try {
    const { id } = requireUser(request);
    const rows = await sql`SELECT data FROM i129f_drafts WHERE user_id = ${id}`;
    const formData = rows[0]?.data || {};

    const filePath = path.join(process.cwd(), 'public', 'forms', 'i-129f.pdf');
    const bytes = await fs.readFile(filePath);
    const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    pdfDoc.catalog.set(PDFDocument.PDFName.of('NeedAppearances'), pdfDoc.context.obj(true)); // helps appearances

    const form = pdfDoc.getForm();
    const mapping = toPdfFields(formData);

    Object.entries(mapping).forEach(([name, val]) => {
      try {
        const f = form.getFieldMaybe(name);
        if (!f) return;
        // checkbox/radio vs text heuristic
        if (typeof f.setChecked === 'function') {
          f.setChecked(val === 'Yes' || val === true);
        } else if (typeof f.select === 'function') {
          f.select(String(val ?? ''));
        } else if (typeof f.setText === 'function') {
          f.setText(String(val ?? ''));
        }
        // keep editable (do not flatten)
      } catch {}
    });

    const out = await pdfDoc.save();
    return new NextResponse(out, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="i-129f.pdf"',
      }
    });
  } catch (e) {
    return NextResponse.json({ ok:false, error:String(e) }, { status: e.message.includes('Not authenticated') ? 401 : 500 });
  }
}

// tiny helper: pdf-lib v2.0 doesn't expose getFieldMaybe; shim it
PDFDocument.prototype.getForm = function() {
  return this.form || (this.form = this.context.lookup(this.catalog.get(PDFDocument.PDFName.of('AcroForm'))));
};
