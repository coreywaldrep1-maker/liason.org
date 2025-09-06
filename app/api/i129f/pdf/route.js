// app/api/i129f/pdf/route.js
import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth'; // <-- make sure it's a named import
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs'; // we need Node APIs for fs/pdf work

export async function GET(req) {
  try {
    // require logged-in user
    await verifyJWT(req);

    // serve the base PDF for now (mapping can be added after save works)
    const filePath = path.join(process.cwd(), 'public', 'i-129f.pdf');
    const data = await fs.readFile(filePath);

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="i-129f.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 401 });
  }
}
