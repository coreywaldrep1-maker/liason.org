import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { randomBytes } from 'crypto';

export const runtime = 'nodejs'; // IMPORTANT: use Node, not Edge

const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ ok: false, error: 'Missing email' }, { status: 400 });
    }

    // Look up the user (do not reveal existence in response)
    const users = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
    if (users.length === 0) {
      // Always return ok to avoid leaking whether the email exists
      return NextResponse.json({ ok: true });
    }

    const userId = users[0].id;
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await sql`
      INSERT INTO password_resets (user_id, token, expires_at)
      VALUES (${userId}, ${token}, ${expiresAt.toISOString()})
    `;

    // TODO: send email with a link like: https://YOUR_SITE/reset?token=${token}
    // For dev/testing, return the token:
    return NextResponse.json({ ok: true, token });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
