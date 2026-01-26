// app/api/i129f/load/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import sql from '@/lib/db';
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
    return NextResponse.json({
      ok: true,
      data: row?.data || { pdf: {} },
      updatedAt: row?.updated_at || null,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 401 });
  }
}
