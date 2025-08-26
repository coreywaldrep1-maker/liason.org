import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { jwtVerify } from 'jose';

const enc = new TextEncoder();

async function getUserId() {
  try {
    const cookie = require('next/headers').cookies().get('liason_token')?.value;
    if (!cookie) return null;
    const { payload } = await jwtVerify(cookie, enc.encode(process.env.JWT_SECRET));
    return payload.sub;
  } catch { return null; }
}

export async function POST() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const pool = getPool();
  await pool.query(
    `insert into payments (user_id, paid, updated_at) values ($1, true, now())
     on conflict (user_id) do update set paid = true, updated_at = now()`,
    [userId]
  );
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const pool = getPool();
  const { rows } = await pool.query(`select paid from payments where user_id = $1`, [userId]);
  return NextResponse.json({ paid: rows[0]?.paid || false });
}
