// app/api/auth/reset/init/route.js
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

export const runtime = 'edge'; // optional, works fine with Neon

const sql = neon(process.env.DATABASE_URL);

// Simple GET so visiting the URL doesn't 404 or 405
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

    // Look up user (don’t reveal existence)
    const users = await sql`SELECT id FROM users WHERE email = ${em} LIMIT 1`;
    if (users.length === 0) {
      // Return ok anyway to avoid user enumeration
      return NextResponse.json({
        ok: true,
        sent: true,
        note: 'If that email exists, a reset link was created.',
      });
    }

    const userId = users[0].id;

    // Invalidate any previous unused tokens for this user (optional safety)
    await sql`UPDATE password_resets SET used_at = now() WHERE user_id = ${userId} AND used_at IS NULL`;

    // Create new token (expires in 1 hour)
    const token = crypto.randomBytes(32).toString('hex');
    await sql`
      INSERT INTO password_resets (user_id, token, expires_at)
      VALUES (${userId}, ${token}, now() + interval '1 hour')
    `;

    // TODO: email the link to the user
    // const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.liason.org';
    // const link = `${base}/reset?token=${token}`;

    // For now, return token for end-to-end testing
    return NextResponse.json({ ok: true, token });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
