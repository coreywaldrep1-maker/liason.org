import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  // Clear the auth token (name used by your login route)
  res.cookies.set('liason_token', '', { httpOnly: true, path: '/', maxAge: 0 });
  // Also clear paid cookie so UI reflects locked state next visit
  res.cookies.set('i129f_paid', '', { path: '/', maxAge: 0 });
  return res;
}
