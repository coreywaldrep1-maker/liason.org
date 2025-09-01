// app/api/dbwrite/route.js
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const [{ id }] = await sql/*sql*/`
      INSERT INTO test_pings (note) VALUES ('ok-from-dbwrite') RETURNING id
    `;
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
