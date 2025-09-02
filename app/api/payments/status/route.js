// app/api/payments/status/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const paid = cookies().get('i129f_paid')?.value === '1';
  return NextResponse.json({ ok: true, paid });
}
