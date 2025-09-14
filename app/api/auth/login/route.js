// app/api/auth/login/route.js
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signJWT, setAuthCookie } from '@/lib/auth';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    const rows = await sql`SELECT id, email, password_hash FROM users WHERE email = ${email} LIMIT 1;`;
    if (!rows?.length) {
      return NextResponse.json({ ok: false, error: 'invalid-credentials' }, { status: 401 });
    }
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash || '');
    if (!ok) {
      return NextResponse.json({ ok: false, error: 'invalid-credentials' }, { status: 401 });
    }

    const token = await signJWT({ id: user.id, email: user.email }, { expiresIn: '30d' });
    const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
    setAuthCookie(res, token, req); // <-- IMPORTANT: pass req so domain=.liason.org is used
    return res;
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }
}
