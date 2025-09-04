export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { verifyJWT } from '@/lib/auth';
import { PDFDocument } from 'pdf-lib';
import fs from 'node:fs/promises';
import path from 'node:path';

const sql = neon(process.env.DATABASE_URL);

export async function GET(req) {
  try {
    const user = await verifyJWT(req);

    // Load saved data
    const rows = await sql`SELECT data FROM i129f_entries WHERE user_id = ${user.id} LIMIT 1`;
    const data = rows[0]?.data || {};

    // Load your AcroForm PDF file from /public (e.g., /public/i-129f.pdf)
    const filePath = path.join(process.cwd(), 'public', 'i-129f.pdf');
    const fileBytes = await fs.readFile(filePath);
    const pdf = await PDFDocument.load(fileBytes);

    // (Optional) fill fields by name here using pdf-lib if needed…
    // For now we just return the original AcroForm so users can edit it after download.

    const out = await pdf.save();
    return new NextResponse(out, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="i-129f.pdf"',
      },
    });
  } catch (e) {
    return NextResponse.json({ ok:false, error:String(e) }, { status:401 });
  }
}
