import { getPool } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const pool = getPool();
  const hash = await bcrypt.hash(password, 10);

  try {
    const { rows } = await pool.query(
      `insert into users (email, password_hash) values ($1, $2)
       on conflict (email) do nothing
       returning id, email`,
       [email.toLowerCase(), hash]
    );
    if (!rows.length) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
