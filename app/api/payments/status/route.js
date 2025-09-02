// app/api/payments/status/route.js
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import * as jose from 'jose';

const sql = neon(process.env.DATABASE_URL);

// tiny cookie parser (works in Edge runtime)
function getCookie(req, name) {
  const raw = req.headers.get('cookie') || '';
  const found = raw.split(';').map(v => v.trim()).find(v => v.startsWith(name + '='));
  return found ? decodeURIComponent(found.split('=')[1]) : null;
}

export async function GET(request) {
  let paid = false;

  // 1) quick cookie check (temporary fallback)
  if (getCookie(request, 'i129f_paid') === 'yes') {
    paid = true;
  }

  // 2) if logged in, check DB entitlement
  try {
    const token = getCookie(request, 'liason_token');
    if (token && process.env.JWT_SECRET) {
      const { payload } = await jose.jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET)
      );
      const userId = payload?.sub;
      if (userId) {
        const rows = await sql`
          SELECT 1 FROM i129f_access WHERE user_id = ${userId} LIMIT 1
        `;
        if (rows.length > 0) paid = true;
      }
    }
  } catch {
    // ignore and fall back to cookie only
  }

  return NextResponse.json({ paid });
}
