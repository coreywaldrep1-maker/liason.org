// app/api/auth/reset/complete/route.js
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const runtime = 'edge'; // bcryptjs is pure JS; ok on Edge

export async function POST(request) {
  try {
    const { token, newPassword } = await request.json();
    if (!token || !newPassword) {
      return NextResponse.json({ ok: false, error: 'Missing token or newPassword' }, { status: 400 });
    }

    const rows = await sql`
      SELECT pr.user_id
      FROM password_resets pr
      WHERE pr.token = ${token}
        AND pr.used_at IS NULL
        AND pr.expires_at > now()
      LIMIT 1
    `;
    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: 'Invalid or expired token' }, { status: 400 });
    }

    const userId = rows[0].user_id;

    const hash = await bcrypt.hash(newPassword, 10);
    await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${userId}`;
    await sql`UPDATE password_resets SET used_at = now() WHERE token = ${token}`;

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
