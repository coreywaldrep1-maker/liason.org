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

export async function POST(req) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { answers } = await req.json();
  if (!answers || typeof answers !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const pool = getPool();
  try {
    await pool.query(
      `insert into i129f_answers (user_id, answers, updated_at)
       values ($1, $2, now())
       on conflict (user_id) do update set answers = excluded.answers, updated_at = now()`,
       [userId, answers]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const pool = getPool();
  const { rows } = await pool.query(`select answers from i129f_answers where user_id = $1`, [userId]);
  return NextResponse.json({ answers: rows[0]?.answers || {} });
}
