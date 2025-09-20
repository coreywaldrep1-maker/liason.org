// app/api/i18n/translate/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { translateText } from '@/lib/i18n-deepl';

export async function POST(req) {
  try {
    const { text = '', lang = 'en', formality } = await req.json();
    const t = await translateText({ text, lang, formality });
    return NextResponse.json({ ok: true, lang, text: t });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const text = url.searchParams.get('text') || '';
    const lang = url.searchParams.get('lang') || 'en';
    const formality = url.searchParams.get('formality') || undefined;
    const t = await translateText({ text, lang, formality });
    return NextResponse.json({ ok: true, lang, text: t });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }
}
