// app/api/auth/logout/route.js
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST(req) {
  const res = NextResponse.json({ ok: true });
  clearAuthCookie(res, req); // <-- pass req so Domain=.liason.org is used
  return res;
}
