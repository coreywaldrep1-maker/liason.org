import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { verifyJWT } from '@/lib/auth';

const sql = neon(process.env.DATABASE_URL);

export async function POST(req) {
  try {
    const user = await verifyJWT(req);
    if (!user?.id) {
      return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const data = body?.data && typeof body.data === 'object' ? body.data : {};

    await sql`
      INSERT INTO i129f_forms (user_id, data)
      VALUES (${user.id}, ${sql.json(data)})
      ON CONFLICT (user_id) DO UPDATE
      SET data = EXCLUDED.data,
          updated_at = NOW()
    `;

    return NextResponse.json({ ok: true });

  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
