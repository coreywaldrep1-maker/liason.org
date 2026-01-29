// app/api/payments/status/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireAuth } from '@/lib/auth';
import { sql } from '@/lib/db';

const PRODUCT_CODE = 'i129f';

function paidFromCookie() {
  // Current cookie
  const c = cookies().get('i129f_paid')?.value;
  if (c === '1') return true;

  // Legacy cookie (used in older endpoints)
  const legacy = cookies().get('liason_paid_i129f')?.value;
  if (legacy === '1') return true;

  return false;
}

function isStillValid(paidUntil) {
  if (!paidUntil) return true; // treat as non-expiring
  const t = Date.parse(paidUntil);
  if (Number.isNaN(t)) return false;
  return t > Date.now();
}

export async function GET(request) {
  let user = null;
  try {
    user = await requireAuth(request);
  } catch {
    // not logged in
  }

  // If logged in, prefer Neon-backed entitlement
  if (user) {
    try {
      const rows = await sql`
        SELECT paid, paid_at, paid_until
        FROM user_entitlements
        WHERE user_id = ${user.id} AND product_code = ${PRODUCT_CODE}
        LIMIT 1
      `;

      const r = rows?.[0];
      const paid =
        !!r?.paid && isStillValid(r?.paid_until);

      // If DB says paid, return paid regardless of cookie
      if (paid) {
        return NextResponse.json({
          ok: true,
          loggedIn: true,
          paid: true,
          source: 'db',
          paidAt: r?.paid_at ?? null,
          paidUntil: r?.paid_until ?? null,
        });
      }
    } catch {
      // Table may not exist yet; fall back to cookie
    }

    // Not paid in DB (or can't query yet) -> fallback to cookie
    const paid = paidFromCookie();
    return NextResponse.json({
      ok: true,
      loggedIn: true,
      paid,
      source: paid ? 'cookie' : 'none',
    });
  }

  // Not logged in -> cookie-only gating
  const paid = paidFromCookie();
  return NextResponse.json({
    ok: true,
    loggedIn: false,
    paid,
    source: paid ? 'cookie' : 'none',
  });
}
