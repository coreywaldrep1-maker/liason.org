import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

export const runtime = 'nodejs';

const sql = neon(process.env.DATABASE_URL);
const COOKIE = 'liason_token';
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined; // e.g. ".liason.org" if you want apex + www

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'Missing email/password' }, { status: 400 });
    }

    const rows = await sql`SELECT id, email, password_hash FROM users WHERE email = ${email} LIMIT 1`;
    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash || '');
    if (!ok) {
      return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const jwt = await new SignJWT({ email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(String(user.id))
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));

    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE, jwt, {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,           // site is HTTPS on Vercel
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      domain: COOKIE_DOMAIN,  // leave undefined unless you need apex+www sharing
    });
    return res;
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
