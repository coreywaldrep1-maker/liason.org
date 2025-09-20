// app/api/i18n/translate-batch/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { translateBatch } from '@/lib/i18n-deepl';

export async function POST(req) {
  try {
    const { texts = [], lang = 'en', formality } = await req.json();
    const out = await translateBatch({ texts, lang, formality });
    return NextResponse.json({ ok: true, lang, texts: out });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const lang = url.searchParams.get('lang') || 'en';
    const formality = url.searchParams.get('formality') || undefined;
    const texts = url.searchParams.getAll('text');
    const out = await translateBatch({ texts, lang, formality });
    return NextResponse.json({ ok: true, lang, texts: out });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }
}
