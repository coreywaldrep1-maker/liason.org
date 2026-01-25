export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET /api/i129f/load
// Loads the latest saved I-129F wizard data for the logged-in user.
export async function GET(req) {
  try {
    const user = await requireAuth(req);

    const rows = await sql`
      SELECT data, updated_at
      FROM i129f_entries
      WHERE user_id = ${user.id}
      LIMIT 1
    `;

    return NextResponse.json({
      ok: true,
      data: rows[0]?.data ?? {},
      updated_at: rows[0]?.updated_at ?? null,
    });
  } catch (err) {
    // If not logged in, return 401 so the client can handle it quietly.
    const msg = String(err?.message || err);
    const status = msg.includes('no-jwt') || msg.includes('no-user') ? 401 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
