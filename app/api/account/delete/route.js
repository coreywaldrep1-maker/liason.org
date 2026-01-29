// app/api/account/delete/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireAuth, clearAuthCookie } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function POST(req) {
  const res = NextResponse.json({ ok: true });

  try {
    const user = await requireAuth(req);

    // Delete user-owned data first
    try {
      await sql`DELETE FROM i129f_entries WHERE user_id = ${user.id}`;
    } catch {
      // ignore if table doesn't exist
    }

    // Remove paid entitlements (if present)
    try {
      await sql`DELETE FROM user_entitlements WHERE user_id = ${user.id}`;
    } catch {
      // ignore if table doesn't exist
    }

    // Delete password resets (if exists)
    try {
      await sql`DELETE FROM password_resets WHERE user_id = ${user.id}`;
    } catch {
      // ignore
    }

    // Delete user record
    await sql`DELETE FROM users WHERE id = ${user.id}`;

    // Clear auth cookie
    clearAuthCookie(res);

    // Clear any payment cookies
    res.headers.append(
      'Set-Cookie',
      `i129f_paid=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.VERCEL ? '; Secure' : ''}`
    );
    res.headers.append(
      'Set-Cookie',
      `liason_paid_i129f=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.VERCEL ? '; Secure' : ''}`
    );

    return res;
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 401 });
  }
}
