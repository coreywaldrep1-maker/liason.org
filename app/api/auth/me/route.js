// app/api/auth/me/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';

export async function GET(req) {
  try {
    const user = await verifyJWT(req);
    return NextResponse.json({ ok: true, user });
  } catch {
    return NextResponse.json({ ok: false, user: null }, { status: 200 });
  }
}
