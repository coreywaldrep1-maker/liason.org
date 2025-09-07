export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { requireAuth } from '@/lib/auth';

const sql = neon(process.env.DATABASE_URL);

export async function GET(req) {
  try {
    const user = await requireAuth(req);
    const rows = await sql`SELECT data FROM i129f_entries WHERE user_id = ${user.id}::uuid`;
    const data = rows[0]?.data || null;
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    const msg = String(e?.message || e);
    const status = msg.includes('no-jwt') || msg.includes('no-user') ? 401 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
