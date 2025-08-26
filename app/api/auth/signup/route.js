import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error:'Email and password required' }, { status: 400 });

    const exists = await query('select 1 from users where email=$1', [email]);
    if (exists.rowCount) return NextResponse.json({ error:'Email already in use' }, { status: 409 });

    const hash = await bcrypt.hash(password, 10);
    await query('insert into users (email, password_hash) values ($1, $2)', [email, hash]);
    return NextResponse.json({ ok:true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error:'Server error' }, { status: 500 });
  }
}
