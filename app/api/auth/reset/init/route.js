// app/api/auth/reset/init/route.js
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ ok: false, error: 'Missing email' }, { status: 400 });
    }

    // Find user (don’t leak whether they exist)
    const users = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
    // Always behave the same way to avoid user enumeration
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // +1 hour
    const token = crypto.randomBytes(32).toString('hex');

    if (users.length > 0) {
      const userId = users[0].id;
      await sql`
        INSERT INTO password_resets (user_id, token, expires_at)
        VALUES (${userId}, ${token}, ${expiresAt})
      `;
    }

    // For now, return the token so you can test without email.
    // Later, send an email that links to: `${process.env.SITE_URL}/account/reset?token=${token}`
    return NextResponse.json({ ok: true, message: 'If the email exists, a reset was created.', token });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
