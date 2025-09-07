// app/api/i129f/save/route.js
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { requireAuth } from '@/lib/auth';

const sql = neon(process.env.DATABASE_URL);

export async function POST(req) {
  try {
    const user = await requireAuth(req); // throws if no cookie/invalid
    const { data } = await req.json();
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ ok: false, error: 'bad-payload' }, { status: 400 });
    }

    // If your users.id is INTEGER in Neon, keep user.id as integer.
    // Upsert by user_id
    const payload = JSON.stringify(data);
    await sql`
      INSERT INTO i129f_entries (user_id, data, updated_at)
      VALUES (${user.id}, ${payload}::jsonb, now())
      ON CONFLICT (user_id)
      DO UPDATE SET data = EXCLUDED.data, updated_at = now()
    `;

    return NextResponse.json({ ok: true });
  } catch (e) {
    // Common reasons: no cookie, wrong secret, cookie not sent
    return NextResponse.json({ ok: false, error: String(e) }, { status: 401 });
  }
}
