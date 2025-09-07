import { NextResponse } from 'next/server';
import { removeAuthCookie } from '@/lib/auth';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  removeAuthCookie(res);
  return res;
}
