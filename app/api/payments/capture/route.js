// app/api/payments/capture/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { captureOrderServer } from '@/lib/paypal';
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
  try {
    const { orderID } = await request.json();

    if (!orderID) {
      return NextResponse.json({ ok: false, error: 'Missing orderID' }, { status: 400 });
    }

    // Capture via PayPal server API
    const data = await captureOrderServer(orderID);

    // Always set cookie so the current device unlocks immediately
    const res = NextResponse.json({ ok: true, data });
    setPaidCookie(res, 30);

    // If logged in, persist entitlements to Neon for cross-device access
    try {
      const user = await requireAuth(request);

      const source = 'paypal';
      const externalId = orderID;

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
        // Table might not exist yet; ignore
      }
    } catch {
      // Not logged in, cookie-only
    }

    return res;
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
