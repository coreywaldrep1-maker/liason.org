import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { requireAuth } from '@/lib/auth';

const sql = neon(process.env.DATABASE_URL);

export async function GET(req) {
  try {
    const user = await requireAuth(req);
    const rows = await sql`
      SELECT data FROM i129f_entries
      WHERE user_id = ${user.id}::uuid
      LIMIT 1
    `;
    const data = rows[0]?.data || {};
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 401 });
  }
}
