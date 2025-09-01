// app/api/auth/reset/complete/route.js
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const { token, newPassword } = await request.json();
    if (!token || !newPassword) {
      return NextResponse.json({ ok: false, error: 'Missing token or newPassword' }, { status: 400 });
    }

    // Look up valid token
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

    // Update password
    const hash = await bcrypt.hash(newPassword, 10);
    await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${userId}`;

    // Mark token used
    await sql`UPDATE password_resets SET used_at = now() WHERE token = ${token}`;

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
