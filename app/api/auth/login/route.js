import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { SignJWT } from 'jose';

const enc = new TextEncoder();

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'Missing email/password' }, { status: 400 });
    }

    const pool = getPool();
    const { rows } = await pool.query(
      'SELECT id, email FROM users WHERE email=$1 AND password_hash = crypt($2, password_hash)',
      [email, password]
    );
    const user = rows[0];
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await new SignJWT({ sub: String(user.id), email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(enc.encode(process.env.JWT_SECRET));

    const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
    res.cookies.set('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      domain: process.env.COOKIE_DOMAIN || undefined, // <- important
    });
    return res;
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
