import { NextResponse } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';

export async function GET(request) {
  const user = await getUserFromCookie(request.headers.get('cookie') || '');
  if (!user?.id) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, user });
}
