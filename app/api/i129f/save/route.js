// app/api/i129f/save/route.js
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import * as jose from 'jose';

const sql = neon(process.env.DATABASE_URL);

function getCookie(req, name) {
  const raw = req.headers.get('cookie') || '';
  const found = raw.split(';').map(v => v.trim()).find(v => v.startsWith(name + '='));
  return found ? decodeURIComponent(found.split('=')[1]) : null;
}

export async function POST(request) {
  try {
    // auth
    const token = getCookie(request, 'liason_token');
    if (!token || !process.env.JWT_SECRET) {
      return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
    }
    const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
    const userId = payload?.sub;
    if (!userId) return NextResponse.json({ ok: false, error: 'No user in token' }, { status: 401 });

    // body
    let data;
    try { data = await request.json(); } catch { data = null; }
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    // write: keep it simple + robust even if no unique on (user_id)
    await sql`DELETE FROM i129f_forms WHERE user_id = ${userId}`;
    const rows = await sql`
      INSERT INTO i129f_forms (user_id, data)
      VALUES (${userId}, ${data}::jsonb)
      RETURNING id, updated_at
    `;
    return NextResponse.json({ ok: true, id: rows[0].id, updated_at: rows[0].updated_at });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
