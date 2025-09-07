import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { signJWT, setAuthCookie } from '@/lib/auth';

export const runtime = 'nodejs';
const sql = neon(process.env.DATABASE_URL);

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ ok:false, error:'missing' }, { status:400 });

    const rows = await sql`SELECT id, email, password_hash FROM users WHERE email = ${email}`;
    if (!rows.length) return NextResponse.json({ ok:false, error:'invalid-credentials' }, { status:400 });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return NextResponse.json({ ok:false, error:'invalid-credentials' }, { status:400 });

    const jwt = await signJWT({ id: user.id, email: user.email });
    const res = NextResponse.json({ ok:true, user: { id: user.id, email: user.email } });
    setAuthCookie(res, jwt);
    return res;
  } catch (e) {
    return NextResponse.json({ ok:false, error:String(e) }, { status:500 });
  }
}
