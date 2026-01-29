// components/PayButtons.jsx
'use client';

import { PayPalButtons } from '@paypal/react-paypal-js';
import { useMemo, useState } from 'react';

/**
 * Uses server routes:
 *  - POST /api/payments/create  -> returns { id }
 *  - POST /api/payments/capture -> captures + sets paid cookie (and writes to DB when possible)
 */
export default function PayButtons({ amount = 500, currency = 'USD', onPaid }) {
  const [err, setErr] = useState('');

  const style = useMemo(
    () => ({
      layout: 'vertical',
      label: 'pay',
      tagline: false,
    }),
    []
  );

  return (
    <div>
      {err ? (
        <div className="mb-2 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-800">
          {err}
        </div>
      ) : null}

      <PayPalButtons
        style={style}
        createOrder={async () => {
          setErr('');
          const r = await fetch('/api/payments/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, currency }),
          });

          const j = await r.json();
          if (!r.ok || !j?.id) {
            throw new Error(j?.error || 'Could not create PayPal order');
          }
          return j.id;
        }}
        onApprove={async (data) => {
          setErr('');
          try {
            const r = await fetch('/api/payments/capture', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderID: data.orderID }),
            });
            const j = await r.json();
            if (!r.ok || !j?.ok) {
              throw new Error(j?.error || 'Payment capture failed');
            }

            // Let parent unlock UI immediately
            onPaid?.(true);
          } catch (e) {
            setErr(String(e));
          }
        }}
        onError={(e) => setErr(String(e))}
      />
    </div>
  );
}
