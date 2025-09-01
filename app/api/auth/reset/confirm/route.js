// app/api/auth/reset/confirm/route.js
export const runtime = 'nodejs';

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import sql from '@/lib/db';

/**
 * POST /api/auth/reset/confirm
 * body: { token: string, password: string }
 */
export async function POST(req) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) {
      return Response.json({ ok: false, error: 'Missing token or password' }, { status: 400 });
    }
    if (password.length < 8) {
      return Response.json({ ok: false, error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const now = new Date().toISOString();

    const found = await sql`
      select pr.id, pr.user_id
      from password_resets pr
      where pr.token_hash = ${tokenHash}
        and pr.used_at is null
        and pr.expires_at > ${now}
      limit 1
    `;

    if (!found.length) {
      return Response.json({ ok: false, error: 'Invalid or expired token' }, { status: 400 });
    }

    const pr = found[0];
    const password_hash = await bcrypt.hash(password, 10);

    // Update user password and mark token used
    await sql`update users set password_hash = ${password_hash} where id = ${pr.user_id}`;
    await sql`update password_resets set used_at = ${now} where id = ${pr.id}`;

    return Response.json({ ok: true });
  } catch (err) {
    console.error('reset/confirm error', err);
    return Response.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
