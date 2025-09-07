import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';

export const runtime = 'edge';

export async function GET(req) {
  try {
    const user = await verifyJWT(req);
    return NextResponse.json({ ok: true, user });
  } catch {
    return NextResponse.json({ ok: false, error: 'no-auth' }, { status: 401 });
  }
}
