// app/api/i129f/save/route.js
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { requireAuth } from '@/lib/auth';

const sql = neon(process.env.DATABASE_URL);

/*
DB:
CREATE TABLE IF NOT EXISTS i129f_entries (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
*/

export async function POST(req) {
  try {
    const user = await requireAuth(req);
    const { data } = await req.json();

    if (!data || typeof data !== 'object') {
      return NextResponse.json({ ok: false, error: 'bad-data' }, { status: 400 });
    }

    await sql`
      INSERT INTO i129f_entries (user_id, data)
      VALUES (${user.id}, ${sql.json(data)})
      ON CONFLICT (user_id) DO UPDATE
        SET data = EXCLUDED.data,
            updated_at = now()
    `;

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 401 });
  }
}
