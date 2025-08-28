// app/api/profile/status/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { sql } from '@/lib/db';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev');

async function getUserIdFromCookie() {
  const token = cookies().get('liason_jwt')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload.sub || null; // sub = user id
  } catch {
    return null;
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const product = searchParams.get('product') || 'i129f';

  const userId = await getUserIdFromCookie();
  if (!userId) {
    return NextResponse.json({ loggedIn: false, paid: false });
  }

  // Is there a profile for this product, and is it paid?
  const rows = await sql`
    SELECT paid
    FROM user_profiles
    WHERE user_id = ${userId} AND product_code = ${product}
    LIMIT 1
  `;

  const paid = rows[0]?.paid === true;
  return NextResponse.json({ loggedIn: true, paid });
}
