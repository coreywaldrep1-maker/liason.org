export const runtime = 'edge'; // Neon works fine on Edge here
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { requireAuth } from '@/lib/auth';

const sql = neon(process.env.DATABASE_URL);

export async function POST(req) {
  try {
    const user = await requireAuth(req); // throws if no cookie/jwt
    const { data } = await req.json();
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ ok: false, error: 'invalid-payload' }, { status: 400 });
    }
    await sql`
      INSERT INTO i129f_entries (user_id, data)
      VALUES (${user.id}::uuid, ${JSON.stringify(data)}::jsonb)
      ON CONFLICT (user_id)
      DO UPDATE SET data = EXCLUDED.data, updated_at = now()
    `;
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = String(e?.message || e);
    const status = msg.includes('no-jwt') || msg.includes('no-user') ? 401 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
