import { NextResponse } from 'next/server';
import { neon, neonConfig } from '@neondatabase/serverless';
import { getUserFromCookie } from '@/lib/auth';

export const runtime = 'nodejs';
neonConfig.fetchConnectionCache = true;
const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const user = await getUserFromCookie(request.headers.get('cookie') || '');
    if (!user?.id) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });

    const { data } = await request.json();
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ ok: false, error: 'Bad payload' }, { status: 400 });
    }

    // upsert by user_id
    await sql`
      INSERT INTO i129f_drafts (user_id, data)
      VALUES (${user.id}, ${sql.json(data)})
      ON CONFLICT (user_id)
      DO UPDATE SET data = EXCLUDED.data, updated_at = now()
    `;

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
