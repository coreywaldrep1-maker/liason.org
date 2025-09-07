import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await verifyJWT(request);
    if (!user) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    return NextResponse.json({ ok: true, user });
  } catch (error) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
}
