import { NextResponse } from 'next/server';
import { neon, neonConfig } from '@neondatabase/serverless';
import { getUserFromCookie } from '@/lib/auth';

export const runtime = 'nodejs';
neonConfig.fetchConnectionCache = true;
const sql = neon(process.env.DATABASE_URL);

export async function GET(request) {
  try {
    const user = await getUserFromCookie(request.headers.get('cookie') || '');
    if (!user?.id) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });

    const rows = await sql`SELECT data FROM i129f_drafts WHERE user_id = ${user.id} LIMIT 1`;
    return NextResponse.json({ ok: true, data: rows[0]?.data || null });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
