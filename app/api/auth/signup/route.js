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
    const hash = await bcrypt.hash(password, 10);

    const rows = await sql`
      INSERT INTO users (email, password_hash)
      VALUES (${email}, ${hash})
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email
    `;
    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: 'Email already exists' }, { status: 409 });
    }

    const user = rows[0];
    const token = await signJWT({ id: user.id, email: user.email });
    const res = NextResponse.json({ ok: true, user });
    setAuthCookie(res, token);
    return res;
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
