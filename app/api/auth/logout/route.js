// app/api/auth/logout/route.js
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  // expire the cookie immediately
  res.headers.set(
    'Set-Cookie',
    [
      'liason_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
      // if you also set a non-HttpOnly mirror cookie for UI, expire it too:
      'liason_token_client=; Path=/; Secure; SameSite=Lax; Max-Age=0'
    ].join(', ')
  );
  return res;
}
