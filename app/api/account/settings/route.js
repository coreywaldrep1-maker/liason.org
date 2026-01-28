// app/api/account/settings/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET(req) {
  try {
    const user = await requireAuth(req);

    // Paid status is currently cookie-based in this project
    const i129fPaid = cookies().get('i129f_paid')?.value === '1';

    let joinedAt = null;

    // Try database created_at if it exists; fall back to token iat (login time)
    try {
      const rows = await sql`
        SELECT created_at
        FROM users
        WHERE id = ${user.id}
        LIMIT 1
      `;
      joinedAt = rows?.[0]?.created_at ?? null;
    } catch {
      // ignore if column doesn't exist
    }

    if (!joinedAt && user?.iat) {
      joinedAt = new Date(Number(user.iat) * 1000).toISOString();
    }

    return NextResponse.json({
      ok: true,
      email: user.email || '',
      joinedAt,
      paid: { i129f: i129fPaid },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 200 });
  }
}
