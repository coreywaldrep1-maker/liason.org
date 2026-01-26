// app/api/i129f/pdf/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { fillI129F } from '@/lib/pdf/fillI129F';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const saved = body?.saved ?? body?.form ?? body?.data ?? body ?? {};

    const pdfBytes = await fillI129F(saved);

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="i-129f-filled.pdf"',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'PDF generation failed' },
      { status: 500 }
    );
  }
}
