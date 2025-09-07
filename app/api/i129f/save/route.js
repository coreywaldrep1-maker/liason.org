// app/api/i129f/save/route.js
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyJWT } from '@/lib/auth';

export const runtime = 'edge';

export async function POST(req) {
  try {
    const user = await verifyJWT(req);
    if (!user?.id) {
      return NextResponse.json(
        { ok: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const data = body?.data || {};

    await sql`
      INSERT INTO i129f_forms (user_id, data, updated_at)
      VALUES (${user.id}, ${sql.json(data)}, NOW())
      ON CONFLICT (user_id) DO UPDATE
      SET data = EXCLUDED.data, updated_at = NOW()
    `;

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e) },
      { status: 500 }
    );
  }
}
