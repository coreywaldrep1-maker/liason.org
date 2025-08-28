// app/api/auth/signup/route.js
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

async function ensureUsersTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id bigserial PRIMARY KEY,
      email text UNIQUE NOT NULL,
      password_hash text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;
}

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'Email and password required' }, { status: 400 });
    }

    await ensureUsersTable();

    const normEmail = String(email).trim().toLowerCase();
    const existing = await sql`SELECT id FROM users WHERE email = ${normEmail}`;
    if (existing.length) {
      return NextResponse.json({ ok: false, error: 'Email already in use' }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    const rows = await sql`
      INSERT INTO users (email, password_hash)
      VALUES (${normEmail}, ${hash})
      RETURNING id, email, created_at
    `;
    const user = rows[0];

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
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return res;
  } catch (err) {
    console.error('SIGNUP_ERROR', err);
    // TEMP: return the message to help debug; swap to generic later
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}

