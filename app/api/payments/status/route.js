import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { jwtVerify } from 'jose';

export const runtime = 'edge';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

async function getUserFromCookie(req) {
  const cookie = req.headers.get('cookie') || '';
  const match = cookie.match(/(?:^|;\s*)liason_token=([^;]+)/);
  if (!match) return null;
  try {
    const { payload } = await jwtVerify(decodeURIComponent(match[1]), secret);
    return payload?.uid || null;
  } catch {
    return null;
  }
}

export async function GET(req) {
  try {
    const uid = await getUserFromCookie(req);
    if (!uid) return NextResponse.json({ ok: true, paid: false });

    const rows = await sql`
      SELECT paid
      FROM payments
      WHERE user_id = ${uid} AND product = 'i129f'
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const paid = rows.length > 0 ? !!rows[0].paid : false;
    return NextResponse.json({ ok: true, paid });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
