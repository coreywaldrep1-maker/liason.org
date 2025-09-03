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
  return { id: payload.sub || payload.id, email: payload.email };
}

export async function POST(request) {
  try {
    const { id } = requireUser(request);
    const { data } = await request.json();
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ ok:false, error:'Missing data' }, { status:400 });
    }
    await sql`
      INSERT INTO i129f_drafts (user_id, data)
      VALUES (${id}, ${sql.json(data)})
      ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
    `;
    return NextResponse.json({ ok:true });
  } catch (e) {
    return NextResponse.json({ ok:false, error:String(e) }, { status: e.message.includes('Not authenticated') ? 401 : 500 });
  }
}
