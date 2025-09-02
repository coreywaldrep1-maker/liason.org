// app/api/payments/status/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const c = cookies();
  const paid = c.get('i129f_paid')?.value === '1';
  return NextResponse.json({ paid });
}
