import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { signJWT, setAuthCookie } from '@/lib/auth';

export const runtime = 'nodejs';
const sql = neon(process.env.DATABASE_URL);

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'missing-fields' }, { status: 400 });
    }

    const exists = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (exists.length) {
      return NextResponse.json({ ok: false, error: 'email-taken' }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);
    const rows = await sql`
      INSERT INTO users (email, password_hash)
      VALUES (${email}, ${hash})
      RETURNING id, email
    `;
    const user = rows[0];

    const jwt = await signJWT({ id: user.id, email: user.email });
    const res = NextResponse.json({ ok: true, user });
    setAuthCookie(res, jwt);
    return res;
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
