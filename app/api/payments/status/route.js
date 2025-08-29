import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getPool } from '@/lib/db';

const enc = new TextEncoder();

async function getUserFromCookie() {
  const token = cookies().get('token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, enc.encode(process.env.JWT_SECRET));
    return payload; // { sub, email, ... }
  } catch {
    return null;
  }
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const product = url.searchParams.get('product') || 'i129f';

    const user = await getUserFromCookie();
    if (!user) return NextResponse.json({ ok: false, error: 'not_signed_in' }, { status: 401 });

    const pool = getPool();
    const { rows } = await pool.query(
      'SELECT paid FROM user_payments WHERE user_id=$1 AND product=$2 LIMIT 1',
      [user.sub, product]
    );
    const paid = rows?.[0]?.paid ?? false;

    return NextResponse.json({ ok: true, paid });
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
