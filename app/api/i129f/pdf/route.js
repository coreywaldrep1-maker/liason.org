export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { fillI129FPdf } from '@/lib/pdf/fillI129F';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const data = body?.data ?? body;

    const pdfBuffer = await fillI129FPdf(data, { flatten: true });

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="i-129f-filled.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'PDF generation failed' },
      { status: 500 }
    );
  }
}
