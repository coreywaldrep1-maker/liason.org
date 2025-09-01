// app/api/auth/reset/init/route.js
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const runtime = 'edge'; // Edge-friendly

function randomHex(bytes = 32) {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  let out = '';
  for (let b of buf) out += b.toString(16).padStart(2, '0');
  return out;
}

// Simple GET so visiting the URL doesn’t 405
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: '/api/auth/reset/init',
    usage: 'POST JSON { email }',
  });
}

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ ok: false, error: 'Missing email' }, { status: 400 });
    }
    const em = String(email).trim().toLowerCase();

    const users = await sql`SELECT id FROM users WHERE email = ${em} LIMIT 1`;
    // Always respond "ok" to avoid user enumeration
    if (users.length === 0) {
      return NextResponse.json({ ok: true, sent: true });
    }

    const userId = users[0].id;

    // Invalidate older tokens (optional safety)
    await sql`
      UPDATE password_resets
      SET used_at = now()
      WHERE user_id = ${userId} AND used_at IS NULL
    `;

    const token = randomHex(32);
    await sql`
      INSERT INTO password_resets (user_id, token, expires_at)
      VALUES (${userId}, ${token}, now() + interval '1 hour')
    `;

    // TODO: email link to user. For testing, return token:
    return NextResponse.json({ ok: true, token });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
