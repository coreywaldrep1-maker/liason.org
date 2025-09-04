// app/api/i129f/pdf/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { verifyJWT } from '@/lib/auth';
import { PDFDocument } from 'pdf-lib';

const sql = neon(process.env.DATABASE_URL);

export async function GET(req) {
  try {
    // must be logged in
    const user = await verifyJWT(req);

    // load saved data (we'll wire mapping next)
    const rows = await sql`SELECT data FROM i129f_entries WHERE user_id = ${user.id} LIMIT 1`;
    const data = rows[0]?.data || {};

    // Fetch the AcroForm PDF from /public (must exist in your repo at /public/i-129f.pdf)
    const pdfUrl = new URL('/i-129f.pdf', req.nextUrl.origin);
    const res = await fetch(pdfUrl);
    if (!res.ok) throw new Error('Missing /public/i-129f.pdf (GET ' + pdfUrl + ' returned ' + res.status + ')');
    const bytes = await res.arrayBuffer();

    // Keep it as editable AcroForm for now (users can tweak after download)
    const pdf = await PDFDocument.load(bytes);

    // (placeholder: this is where we’ll fill fields later using pdf.getForm())

    const out = await pdf.save();
    return new NextResponse(out, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="i-129f.pdf"',
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 401 });
  }
}
