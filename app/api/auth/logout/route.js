import { NextResponse } from 'next/server';
const COOKIE = 'liason_token';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, '', { path: '/', maxAge: 0, httpOnly: true, sameSite: 'lax', secure: true });
  return res;
}
