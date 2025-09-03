export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

const sql = neon(process.env.DATABASE_URL);
const COOKIE = 'liason_token';

function requireUser(req) {
  const cookie = req.headers.get('cookie') || '';
  const m = cookie.match(new RegExp(`${COOKIE}=([^;]+)`));
  if (!m) throw new Error('Not authenticated');
  const token = decodeURIComponent(m[1]);
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  return { id: payload.sub || payload.id };
}

export async function GET(request) {
  try {
    const { id } = requireUser(request);
    const rows = await sql`SELECT data FROM i129f_drafts WHERE user_id = ${id}`;
    return NextResponse.json({ ok:true, data: rows[0]?.data || null });
  } catch (e) {
    return NextResponse.json({ ok:false, error:String(e) }, { status: e.message.includes('Not authenticated') ? 401 : 500 });
  }
}
