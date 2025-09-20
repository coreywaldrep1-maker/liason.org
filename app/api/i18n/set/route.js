// app/api/i18n/set/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { LANG_COOKIE } from '@/lib/i18n-common';

export async function POST(req) {
  const { lang } = await req.json().catch(() => ({}));
  const res = NextResponse.json({ ok: true, lang: String(lang || 'en') });
  res.cookies.set(LANG_COOKIE, String(lang || 'en'), {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    secure: true,
  });
  return res;
}
