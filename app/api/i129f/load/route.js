// app/api/i129f/load/route.js
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { sql } from '@/lib/db';

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS i129f_entries (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      data    JSONB    NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
}

export async function GET(req) {
  try {
    const user = await requireAuth(req); // throws if not logged in
    await ensureTable();

    const rows = await sql`
      SELECT data FROM i129f_entries
      WHERE user_id = ${user.id}
      LIMIT 1;
    `;

    const data = rows?.[0]?.data || {};
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 400 });
  }
}
