import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  // delete the auth cookie
  res.headers.set(
    'Set-Cookie',
    'liason_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure'
  );
  return res;
}
