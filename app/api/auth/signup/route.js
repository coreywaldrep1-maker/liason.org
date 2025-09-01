import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const runtime = 'edge';

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'Missing email or password' }, { status: 400 });
    }
    const em = String(email).trim().toLowerCase();
    const hash = await bcrypt.hash(password, 10);

    const exists = await sql`SELECT 1 FROM users WHERE email = ${em} LIMIT 1`;
    if (exists.length > 0) {
      return NextResponse.json({ ok: false, error: 'Email already registered' }, { status: 400 });
    }

    await sql`
      INSERT INTO users (email, password_hash)
      VALUES (${em}, ${hash})
    `;

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
