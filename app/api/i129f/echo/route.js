import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const FORM_PATH = path.join(process.cwd(), 'public', 'forms', 'i-129f.pdf');

export async function GET() {
  try {
    const bytes = await fs.readFile(FORM_PATH);
    return new NextResponse(bytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="i-129f.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
