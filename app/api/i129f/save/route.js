// app/api/i129f/save/route.js
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { verifyJWT } from '@/lib/auth';

export const runtime = 'edge'; // Neon works great on Edge

const sql = neon(process.env.DATABASE_URL);

export async function POST(req) {
  try {
    const user = await verifyJWT(req); // throws if not logged in
    if (!user?.id) throw new Error('no-user');

    const body = await req.json().catch(() => ({}));
    const data = body?.data && typeof body.data === 'object' ? body.data : {};

    await sql`
      INSERT INTO i129f_entries (user_id, data, updated_at)
      VALUES (${user.id}, ${sql.json(data)}, now())
      ON CONFLICT (user_id) DO UPDATE
      SET data = EXCLUDED.data, updated_at = now()
    `;

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 401 });
  }
}
