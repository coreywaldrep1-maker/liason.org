// app/api/payments/mark-paid/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireAuth } from '@/lib/auth';
import { sql } from '@/lib/db';

const PRODUCT_CODE = 'i129f';

function setPaidCookie(res, days = 30) {
  const secure = !!process.env.VERCEL || process.env.NODE_ENV === 'production';
  res.cookies.set({
    name: 'i129f_paid',
    value: '1',
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: days * 24 * 60 * 60,
  });
}

export async function POST(request) {
  const res = NextResponse.json({ ok: true });

  // Always set cookie so the current browser unlocks immediately
  setPaidCookie(res, 30);

  // If logged in, also store in Neon so it syncs across devices
  try {
    const user = await requireAuth(request);
    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const source = body?.source || 'manual';
    const externalId = body?.externalId || null;

    try {
      await sql`
        INSERT INTO user_entitlements (user_id, product_code, paid, paid_at, paid_until, source, external_id, updated_at)
        VALUES (${user.id}, ${PRODUCT_CODE}, true, now(), now() + interval '365 days', ${source}, ${externalId}, now())
        ON CONFLICT (user_id, product_code) DO UPDATE SET
          paid = EXCLUDED.paid,
          paid_until = GREATEST(COALESCE(user_entitlements.paid_until, now()), EXCLUDED.paid_until),
          source = EXCLUDED.source,
          external_id = EXCLUDED.external_id,
          updated_at = now()
      `;
    } catch {
      // If table doesn't exist yet, ignore (cookie will still work)
    }

    // Return paid status for UI
    return res;
  } catch {
    // Not logged in: cookie-only
    return res;
  }
}
