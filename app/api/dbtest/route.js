// app/api/dbtest/route.js
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const [{ now, user: db_user, version: pg_version }] = await sql/*sql*/`
      SELECT now() AS now, current_user AS "user", version() AS version
    `;
    return NextResponse.json({ ok: true, now, db_user, pg_version });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
