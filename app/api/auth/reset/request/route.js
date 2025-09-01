// app/api/auth/reset/request/route.js
export const runtime = 'nodejs';

import crypto from 'crypto';
import sql from '@/lib/db';

/**
 * POST /api/auth/reset/request
 * body: { email: string }
 * Always responds 200 to prevent user enumeration.
 * Returns { ok:true, message, devLink? } with a dev reset link for now.
 */
export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return Response.json({ ok: false, error: 'Email required' }, { status: 400 });
    }

    const normalized = email.trim().toLowerCase();
    const rows = await sql`select id from users where email = ${normalized} limit 1`;
    // Always pretend success even if user not found
    if (!rows.length) {
      // tiny delay to make timing similar
      await new Promise(r => setTimeout(r, 250));
      return Response.json({
        ok: true,
        message: 'If that account exists, a password reset email has been sent.'
      });
    }

    const userId = rows[0].id;
    const token = crypto.randomUUID() + crypto.randomBytes(16).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60).toISOString(); // 1 hour

    await sql`
      insert into password_resets (user_id, token_hash, expires_at)
      values (${userId}, ${tokenHash}, ${expiresAt})
    `;

    const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.liason.org';
    const link = `${base}/account/reset?token=${encodeURIComponent(token)}`;

    // TODO: send real email; for now provide dev link
    return Response.json({
      ok: true,
      message: 'If that account exists, a password reset email has been sent.',
      devLink: link
    });
  } catch (err) {
    console.error('reset/request error', err);
    return Response.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
