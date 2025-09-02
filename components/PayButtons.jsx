// components/PayButtons.jsx
'use client';

import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useState } from 'react';

export default function PayButtons({ amount = '500.00', onPaid }) {
  const [error, setError] = useState('');

  const options = {
    'client-id': process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
    currency: 'USD',
    intent: 'capture',
    'data-funding-allowed': 'card', // show card option if eligible
    'disable-funding': 'paylater'   // optional
  };

  async function createOrder() {
    const r = await fetch('/api/payments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, description: 'I-129F Guided Tool' })
    });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'Create order failed');
    return j.id;
  }

  async function capture(orderID) {
    const r = await fetch('/api/payments/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderID })
    });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'Capture failed');
    onPaid?.(); // refresh the gate
  }

  return (
    <PayPalScriptProvider options={options}>
      <PayPalButtons
        style={{ layout: 'vertical' }}
        createOrder={async () => {
          try { return await createOrder(); }
          catch (e) { setError(String(e)); return ''; }
        }}
        onApprove={async (data) => {
          try { await capture(data.orderID); }
          catch (e) { setError(String(e)); }
        }}
        onError={(err) => setError(String(err))}
      />
      {/* Dedicated Card button (renders only if eligible) */}
      <PayPalButtons
        fundingSource="card"
        style={{ layout: 'vertical' }}
        createOrder={async () => {
          try { return await createOrder(); }
          catch (e) { setError(String(e)); return ''; }
        }}
        onApprove={async (data) => {
          try { await capture(data.orderID); }
          catch (e) { setError(String(e)); }
        }}
        onError={(err) => setError(String(err))}
      />
      {error && <div className="small" style={{ color: '#b91c1c', marginTop: 8 }}>{error}</div>}
    </PayPalScriptProvider>
  );
}
