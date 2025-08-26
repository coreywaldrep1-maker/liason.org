import { getPool } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const enc = new TextEncoder();

export async function POST(req) {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const pool = getPool();
  const { rows } = await pool.query(
    `select id, email, password_hash from users where email = $1`,
    [email.toLowerCase()]
  );
  if (!rows.length) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  const token = await new SignJWT({ sub: user.id, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(enc.encode(process.env.JWT_SECRET));

  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', `liason_token=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60*60*24*30}`);
  return res;
}
