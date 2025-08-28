// app/api/payments/mark-paid/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';
import { jwtVerify } from 'jose';

async function getUserIdFromCookie() {
  const token = cookies().get('token')?.value;
  if (!token) return null;
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is missing');
  const key = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify(token, key);
  return payload?.uid || null;
}

export async function POST(req) {
  try {
    const uid = await getUserIdFromCookie();
    if (!uid) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });

    const { orderId, product = 'i129f_profile', amount = 500, status = 'captured' } = await req.json();

    // (Optional safety) create table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS payments (
        id bigserial PRIMARY KEY,
        user_id bigint NOT NULL,
        product text NOT NULL,
        amount_cents integer NOT NULL,
        status text NOT NULL,
        gateway_order_id text,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `;

    await sql`
      INSERT INTO payments (user_id, product, amount_cents, status, gateway_order_id)
      VALUES (${uid}, ${product}, ${Math.round(amount * 100)}, ${status}, ${orderId})
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('MARK_PAID_ERROR', err);
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
