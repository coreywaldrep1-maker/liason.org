import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { jwtVerify } from 'jose';

export const runtime = 'edge';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

async function getUserFromCookie(req) {
  const cookie = req.headers.get('cookie') || '';
  const match = cookie.match(/(?:^|;\s*)liason_token=([^;]+)/);
  if (!match) return null;
  try {
    const { payload } = await jwtVerify(decodeURIComponent(match[1]), secret);
    return payload?.uid || null;
  } catch {
    return null;
  }
}

export async function POST(req) {
  try {
    const uid = await getUserFromCookie(req);
    if (!uid) return NextResponse.json({ ok: false, error: 'Not authed' }, { status: 401 });

    const body = await req.json(); // whatever fields you’re saving
    await sql`
      INSERT INTO i129f_forms (user_id, data)
      VALUES (${uid}, ${body})
      ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
    `;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
