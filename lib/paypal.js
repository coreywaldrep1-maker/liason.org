// lib/paypal.js
const ENV = process.env.PAYPAL_ENV || 'sandbox';
const BASE = ENV === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

export async function getAccessToken() {
  const client = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  const auth = Buffer.from(`${client}:${secret}`).toString('base64');

  const r = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(`PayPal token error: ${r.status} ${t}`);
  }
  return r.json();
}

export async function createOrderServer(amount = '500.00', description = 'I-129F Guided Tool') {
  const { access_token } = await getAccessToken();
  const r = await fetch(`${BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{ amount: { currency_code: 'USD', value: amount }, description }]
    })
  });

  const j = await r.json();
  if (!r.ok) throw new Error(`PayPal create error: ${r.status} ${JSON.stringify(j)}`);
  return j; // includes { id }
}

export async function captureOrderServer(orderID) {
  const { access_token } = await getAccessToken();
  const r = await fetch(`${BASE}/v2/checkout/orders/${orderID}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    }
  });

  const j = await r.json();
  if (!r.ok) throw new Error(`PayPal capture error: ${r.status} ${JSON.stringify(j)}`);
  return j; // includes captures, payer, etc.
}
