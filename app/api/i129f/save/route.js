// app/api/i129f/save/route.js
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { requireUser } from '@/lib/auth';

const sql = neon(process.env.DATABASE_URL);

export async function POST(req) {
  try {
    const user = await requireUser(req);
    if (!user?.id) {
      return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { data } = await req.json();
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ ok: false, error: 'Invalid data' }, { status: 400 });
    }

    await sql`
      INSERT INTO i129f_entries (user_id, data, updated_at)
      VALUES (${user.id}::uuid, ${JSON.stringify(data)}::jsonb, now())
      ON CONFLICT (user_id)
      DO UPDATE SET data = EXCLUDED.data, updated_at = now()
    `;

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
