// app/api/i129f/save/route.js
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { sql } from '@/lib/db';

async function ensureTable() {
  // Adjust the users.id type if yours differs (INTEGER vs UUID)
  await sql`
    CREATE TABLE IF NOT EXISTS i129f_entries (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      data    JSONB    NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
}

export async function POST(req) {
  try {
    const user = await requireAuth(req); // throws if no cookie/JWT
    await ensureTable();

    const body = await req.json().catch(() => ({}));
    const data = (body && body.data && typeof body.data === 'object') ? body.data : {};

    await sql`
      INSERT INTO i129f_entries (user_id, data, updated_at)
      VALUES (${user.id}, ${sql.json(data)}, now())
      ON CONFLICT (user_id)
      DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at;
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Bubble the exact error to help debug quickly
    return NextResponse.json({ ok: false, error: String(err) }, { status: 400 });
  }
}
