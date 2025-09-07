// app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { signJWT, setAuthCookie } from '@/lib/auth';

const sql = neon(process.env.DATABASE_URL);

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    
    // Check if user exists
    const rows = await sql`
      SELECT id, email, password_hash 
      FROM users 
      WHERE email = ${email} 
      LIMIT 1
    `;
    
    if (!rows.length) {
      return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash || '');
    if (!validPassword) {
      return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate JWT token
    const token = await signJWT({ id: user.id, email: user.email });
    
    // Create response with auth cookie
    const res = NextResponse.json({ 
      ok: true, 
      user: { id: user.id, email: user.email }
    });
    
    setAuthCookie(res, token);
    return res;

  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
