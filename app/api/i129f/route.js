// app/api/i129f/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';

// This route is kept for backward-compatibility.
// It fetches the user's saved draft from /api/i129f/load
// then POSTs it to /api/i129f/pdf to generate the filled PDF.

export async function GET(req) {
  try {
    const origin = new URL(req.url).origin;
    const cookie = req.headers.get('cookie') || '';

    const loadRes = await fetch(`${origin}/api/i129f/load`, {
      method: 'GET',
      headers: { cookie },
      cache: 'no-store',
    });

    const loadJson = await loadRes.json().catch(() => ({}));
    const data = loadJson?.data ?? loadJson?.form?.data ?? loadJson ?? {};

    const pdfRes = await fetch(`${origin}/api/i129f/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie },
      body: JSON.stringify({ data }),
      cache: 'no-store',
    });

    const buf = await pdfRes.arrayBuffer();
    const headers = new Headers(pdfRes.headers);

    // Ensure download filename if upstream didn't set it
    if (!headers.get('content-disposition')) {
      headers.set('Content-Disposition', 'attachment; filename="i-129f-filled.pdf"');
    }

    return new NextResponse(buf, { status: pdfRes.status, headers });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'Failed generating PDF' },
      { status: 500 }
    );
  }
}

// Optional: POST /api/i129f also forwards to /api/i129f/pdf
export async function POST(req) {
  try {
    const origin = new URL(req.url).origin;
    const cookie = req.headers.get('cookie') || '';
    const body = await req.text();

    const pdfRes = await fetch(`${origin}/api/i129f/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': req.headers.get('content-type') || 'application/json', cookie },
      body,
      cache: 'no-store',
    });

    const buf = await pdfRes.arrayBuffer();
    const headers = new Headers(pdfRes.headers);

    if (!headers.get('content-disposition')) {
      headers.set('Content-Disposition', 'attachment; filename="i-129f-filled.pdf"');
    }

    return new NextResponse(buf, { status: pdfRes.status, headers });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'Failed generating PDF' },
      { status: 500 }
    );
  }
}
