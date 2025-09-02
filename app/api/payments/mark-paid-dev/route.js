// app/api/payments/mark-paid-dev/route.js
export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true, note: 'Dev cookie set' });
  // client-readable cookie for gating (30d)
  res.cookies.set('i129f_paid', 'yes', {
    path: '/',
    httpOnly: false,
    sameSite: 'Lax',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
