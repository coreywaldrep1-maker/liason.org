// app/api/auth/logout/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, clearAuthCookie } from '@/lib/auth';

// Payment cookie(s) used in different parts of the codebase historically
const PAYMENT_COOKIES = ['i129f_paid', 'liason_paid_i129f'];

function appendCookieKill(res, name) {
  res.headers.append(
    'Set-Cookie',
    `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.VERCEL ? '; Secure' : ''}`
  );
}

function clearAll(res) {
  // IMPORTANT: clearAuthCookie uses headers.set('Set-Cookie', ...)
  // so we call it first, then append the others.
  clearAuthCookie(res);
  for (const c of PAYMENT_COOKIES) appendCookieKill(res, c);

  // Also clear any legacy cookie name someone might have used.
  appendCookieKill(res, 'liason_jwt');

  return res;
}

export async function POST() {
  const res = NextResponse.json({ ok: true });
  return clearAll(res);
}

export async function GET(req) {
  const url = new URL(req.url);
  const res = NextResponse.redirect(new URL('/login', url.origin), { status: 302 });
  return clearAll(res);
}
