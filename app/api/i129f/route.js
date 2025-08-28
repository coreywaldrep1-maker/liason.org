// app/api/i129f/save/route.js
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

    const body = await req.json();
    const answers = body?.answers || {};

    // (Optional safety) create table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS i129f_answers (
        user_id bigint PRIMARY KEY,
        answers jsonb NOT NULL DEFAULT '{}'::jsonb,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `;

    // Upsert
    const rows = await sql`
      INSERT INTO i129f_answers (user_id, answers, updated_at)
      VALUES (${uid}, ${answers}, now())
      ON CONFLICT (user_id)
      DO UPDATE SET answers = ${answers}, updated_at = now()
      RETURNING user_id, updated_at
    `;

    return NextResponse.json({ ok: true, saved: rows[0] });
  } catch (err) {
    console.error('I129F_SAVE_ERROR', err);
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
