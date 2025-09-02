// app/api/i129f/data/route.js
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

export async function GET(request) {
  try {
    const token = getCookie(request, 'liason_token');
    if (!token || !process.env.JWT_SECRET) {
      return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
    }
    const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
    const userId = payload?.sub;
    if (!userId) return NextResponse.json({ ok: false, error: 'No user in token' }, { status: 401 });

    const rows = await sql`
      SELECT data, updated_at
      FROM i129f_forms
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC NULLS LAST
      LIMIT 1
    `;
    return NextResponse.json({
      ok: true,
      data: rows[0]?.data ?? {},
      updated_at: rows[0]?.updated_at ?? null
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
      
