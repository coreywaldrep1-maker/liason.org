export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { fillI129FPdf } from '@/lib/pdf/fillI129F'; // create this file below

// POST /api/i129f/pdf
// Body: { data: { /* your collected field values */ } }
export async function POST(req) {
  try {
    const { data } = await req.json();
    if (!data) {
      return NextResponse.json({ ok: false, error: 'Missing data' }, { status: 400 });
    }

    const pdfBuffer = await fillI129FPdf(data); // returns a Uint8Array or Buffer
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="i-129f.pdf"'
      }
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'PDF generation failed' },
      { status: 500 }
    );
  }
}
