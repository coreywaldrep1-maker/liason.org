// app/api/i129f/save/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(req) {
  try {
    const user = await requireAuth(req);

    const body = await req.json().catch(() => null);

    // Accept either:
    // 1) { data: {...} }
    // 2) {...}  (older clients)
    const data =
      body && typeof body === 'object' && body.data && typeof body.data === 'object'
        ? body.data
        : body;

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
    }

    await sql`
      INSERT INTO i129f_entries (user_id, data, updated_at)
      VALUES (${user.id}, ${sql.json(data)}, now())
      ON CONFLICT (user_id)
      DO UPDATE SET data = EXCLUDED.data, updated_at = now()
    `;

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('save error', e);
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 400 });
  }
}
