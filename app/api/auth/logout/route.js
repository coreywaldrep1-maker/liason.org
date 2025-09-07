// app/api/auth/logout/route.js
import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export const runtime = 'edge';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearAuthCookie(res); // sets liason_token=; Path=/; HttpOnly; Max-Age=0
  return res;
}
