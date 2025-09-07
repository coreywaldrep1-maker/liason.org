// app/api/i129f/load/route.js 
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { verifyJWT } from '@/lib/auth';

export const runtime = 'edge';

const sql = neon(process.env.DATABASE_URL);

export async function GET(req) {
  try {
    const user = await verifyJWT(req);
    if (!user?.id) throw new Error('no-user');

    const rows = await sql`SELECT data FROM i129f_entries WHERE user_id = ${user.id} LIMIT 1`;
    const data = rows?.[0]?.data || {};
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 401 });
  }
}
