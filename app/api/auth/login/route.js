import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error:'Email and password required' }, { status: 400 });

    const r = await query('select id, password_hash from users where email=$1', [email]);
    if (!r.rowCount) return NextResponse.json({ error:'Invalid credentials' }, { status: 401 });

    const user = r.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return NextResponse.json({ error:'Invalid credentials' }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret');
    const token = await new SignJWT({ sub: user.id, email })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);

    cookies().set('liason_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 60*60*24*7
    });

    return NextResponse.json({ ok:true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error:'Server error' }, { status: 500 });
  }
}
