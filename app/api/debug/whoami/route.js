import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getUserFromCookie } from '@/lib/auth';

const sql = neon(process.env.DATABASE_URL);

export async function GET(req) {
  const user = await getUserFromCookie(req.headers.get('cookie') || '');
  if (!user?.id) return NextResponse.json({ ok: false, reason: 'no-jwt' }, { status: 401 });

  const rows = await sql`SELECT id, email FROM users WHERE id = ${user.id} LIMIT 1`;
  return NextResponse.json({
    ok: true,
    jwt_user: user,
    user_exists_in_db: rows.length === 1,
    db_user: rows[0] || null,
  });
}
