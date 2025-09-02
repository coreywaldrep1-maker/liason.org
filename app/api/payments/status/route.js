// app/api/payments/status/route.js
export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function GET(request) {
  const cookie = request.headers.get('cookie') || '';
  const paid = cookie.split(';').map(s => s.trim()).some(s => s.startsWith('liason_paid_i129f=1'));
  return NextResponse.json({ ok: true, paid });
}
