// app/api/payments/confirm/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

const ENV = (process.env.PAYPAL_ENV || 'live').toLowerCase();
const BASE = ENV === 'sandbox'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

async function getAccessToken() {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  if (!res.ok) throw new Error('PayPal OAuth failed: ' + res.status);
  return res.json();
}

export async function POST(req) {
  try {
    const { orderID } = await req.json();
    if (!orderID) {
      return NextResponse.json({ ok: false, error: 'Missing orderID' }, { status: 400 });
    }

    const { access_token } = await getAccessToken();

    // Capture the order
    const cap = await fetch(`${BASE}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    });

    const capJson = await cap.json();
    if (!cap.ok || (capJson.status !== 'COMPLETED' && capJson.purchase_units?.[0]?.payments?.captures?.[0]?.status !== 'COMPLETED')) {
      return NextResponse.json({ ok: false, error: 'Capture failed', details: capJson }, { status: 400 });
    }

    // Mark paid via an HttpOnly cookie (no login required)
    const res = NextResponse.json({ ok: true, id: capJson.id || orderID });
    res.headers.set(
      'Set-Cookie',
      // 1 year, HttpOnly, Secure. Page checks for this to unlock the tool.
      'liason_paid_i129f=1; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax'
    );
    return res;
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
