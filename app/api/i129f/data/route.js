// app/api/i129f/data/route.js
// NOTE: This endpoint is used by the wizard to rehydrate saved data on reload.
// It must read from the same storage as /api/i129f/save and /api/i129f/load.

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
    const data = row?.data ?? {};
    const updatedAt = row?.updated_at ?? null;

    // Keep both keys for backward compatibility with older client code.
    return NextResponse.json({ ok: true, data, updatedAt, updated_at: updatedAt });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 200 });
  }
}
