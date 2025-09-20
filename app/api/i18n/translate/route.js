// app/api/i18n/translate/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { deeplTranslateOne } from '@/lib/i18n-deepl';

export async function POST(req) {
  try {
    const { q, target } = await req.json();
    const text = await deeplTranslateOne(String(q ?? ''), String(target || 'en'));
    return NextResponse.json({ ok: true, text });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
