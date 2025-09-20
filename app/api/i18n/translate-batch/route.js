// app/api/i18n/translate-batch/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { deeplTranslateMany } from '@/lib/i18n-deepl';

export async function POST(req) {
  try {
    const { texts, targetLang } = await req.json();
    const out = await deeplTranslateMany(Array.isArray(texts) ? texts : [], String(targetLang || 'en'));
    return NextResponse.json({ ok: true, translations: out });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
