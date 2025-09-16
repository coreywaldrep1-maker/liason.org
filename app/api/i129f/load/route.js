// app/api/i129f/load/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req) {
  try {
    const user = await requireAuth(req);
    const rows = await sql`
      SELECT data FROM i129f_entries
      WHERE user_id = ${user.id}
      LIMIT 1
    `;
    if (!rows.length) return NextResponse.json({ ok: true, data: null });
    return NextResponse.json({ ok: true, data: rows[0].data || null });
  } catch (e) {
    console.error('load error', e);
    const msg = String(e.message || e);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
