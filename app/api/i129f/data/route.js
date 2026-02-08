// app/api/i129f/data/route.js
// NOTE: This endpoint is used by the wizard to rehydrate saved data on reload.
// It must read from the same storage as /api/i129f/save and /api/i129f/load.
//
// IMPORTANT:
// Your current wizard uses this endpoint for BOTH:
//   - GET (load)
//   - POST (save)
// So we support both here to avoid drift.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req) {
  try {
    const user = await requireAuth(req);

    const rows = await sql`
      SELECT data, updated_at
      FROM i129f_entries
      WHERE user_id = ${user.id}
      LIMIT 1
    `;

    const row = rows?.[0];
    const data = row?.data ?? { pdf: {} };
    const updatedAt = row?.updated_at ?? null;

    // Keep both keys for backward compatibility with older client code.
    return NextResponse.json({ ok: true, data, updatedAt, updated_at: updatedAt });
  } catch (e) {
    // Keep status 200 so unauthenticated clients don't throw hard.
    return NextResponse.json({ ok: false, error: String(e) }, { status: 200 });
  }
}

export async function POST(req) {
  try {
    const user = await requireAuth(req);

    const body = await req.json().catch(() => null);

    // Accept either:
    // 1) { data: {...} }
    // 2) {...} (older clients)
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
    console.error('i129f/data POST error', e);
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 400 });
  }
}
