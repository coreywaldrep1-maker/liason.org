// app/api/auth/whoami/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function GET() {
  try {
    const token = cookies().get('token')?.value;
    if (!token) return NextResponse.json({ ok: false, user: null });

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is missing');
    const key = new TextEncoder().encode(secret);

    const { payload } = await jwtVerify(token, key);
    return NextResponse.json({ ok: true, user: { id: payload.uid, email: payload.email } });
  } catch (err) {
    return NextResponse.json({ ok: false, user: null, error: String(err?.message || err) }, { status: 401 });
  }
}
