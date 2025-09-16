// app/api/i129f/save/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(req) {
  try {
    const user = await requireAuth(req);
    const { data } = await req.json();
    if (!data || typeof data !== 'object') {
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
    const msg = String(e.message || e);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
