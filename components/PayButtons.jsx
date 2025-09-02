// components/PayButtons.jsx
'use client';

import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useState } from 'react';

export default function PayButtons({ amount = '500.00', onPaid }) {
  const [error, setError] = useState('');

  return (
    <PayPalScriptProvider options={{
      'client-id': process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
      currency: 'USD',
      intent: 'capture'
    }}>
      <PayPalButtons
        style={{ layout: 'vertical' }}
        createOrder={(data, actions) => {
          return actions.order.create({
            purchase_units: [{
              amount: { value: amount },
              description: 'I-129F Guided Tool'
            }]
          });
        }}
        onApprove={async (data, actions) => {
          try {
            // Confirm/capture on our server and set cookie
            const r = await fetch('/api/payments/confirm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderID: data.orderID })
            });
            const j = await r.json();
            if (!j.ok) throw new Error(j.error || 'Confirm failed');
            // refresh UI
            onPaid?.();
          } catch (e) {
            setError(String(e));
          }
        }}
        onError={(err) => setError(String(err))}
      />
      {error && <div className="small" style={{ color: '#b91c1c' }}>{error}</div>}
    </PayPalScriptProvider>
  );
}
