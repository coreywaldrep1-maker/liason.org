// app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'Email and password required' }, { status: 400 });
    }

    const normEmail = String(email).trim().toLowerCase();
    const rows = await sql`SELECT id, email, password_hash FROM users WHERE email = ${normEmail}`;
    if (!rows.length) {
      return NextResponse.json({ ok: false, error: 'Invalid email or password' }, { status: 401 });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return NextResponse.json({ ok: false, error: 'Invalid email or password' }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is missing');
    const key = new TextEncoder().encode(secret);

    const token = await new SignJWT({ uid: user.id, email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(key);

    const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
    res.cookies.set('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (err) {
    console.error('LOGIN_ERROR', err);
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
