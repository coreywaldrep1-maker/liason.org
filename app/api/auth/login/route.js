// app/api/auth/login/route.js
export const runtime = 'nodejs'; // bcryptjs + Node features

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { signJWT, setAuthCookie } from '@/lib/auth';

const sql = neon(process.env.DATABASE_URL);

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'Missing email or password' }, { status: 400 });
    }

    // Adjust table/columns to your schema if needed
    const rows = await sql`
      SELECT id, email, password_hash
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const user = rows[0];
    const ok = user.password_hash
      ? await bcrypt.compare(password, user.password_hash)
      : false;

    if (!ok) {
      return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 });
    }

    // Create JWT and set HttpOnly cookie
    const token = await signJWT({ id: user.id, email: user.email });
    const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
    setAuthCookie(res, token);
    return res;
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
