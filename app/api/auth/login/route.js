// app/api/auth/login/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { setAuthCookie, signJWT } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'Missing email/password' }, { status: 400 });
    }

    const rows = await sql`SELECT id, email, password_hash FROM users WHERE email = ${email} LIMIT 1`;
    if (!rows.length) {
      return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await signJWT({ id: user.id, email: user.email }, { expiresIn: '30d' });
    const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
    setAuthCookie(res, token);
    return res;
  } catch (e) {
    console.error('login error', e);
    return NextResponse.json({ ok: false, error: 'Login failed' }, { status: 500 });
  }
}
