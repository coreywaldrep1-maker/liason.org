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

    // Delete user account
    await sql`DELETE FROM users WHERE id = ${user.id}`;

    // Clear auth + payment cookies
    clearAuthCookie(res);
    res.headers.append('Set-Cookie', 'i129f_paid=; Path=/; Max-Age=0; SameSite=Lax;');

    return res;
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 200 });
  }
}
