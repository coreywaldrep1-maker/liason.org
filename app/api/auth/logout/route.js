import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  // expire the cookie
  res.headers.set('Set-Cookie', `liason_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  return res;
}
