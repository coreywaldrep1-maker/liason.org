// app/api/i129f/load/route.js
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { requireUser } from '@/lib/auth';

const sql = neon(process.env.DATABASE_URL);

export async function GET(req) {
  try {
    const user = await requireUser(req);
    if (!user?.id) {
      return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
    }

    const rows = await sql`SELECT data FROM i129f_entries WHERE user_id = ${user.id}::uuid LIMIT 1`;
    const data = rows.length ? rows[0].data : null;

    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
