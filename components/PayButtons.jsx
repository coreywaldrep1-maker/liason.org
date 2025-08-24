// components/PayButtons.jsx
'use client';
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

export default function PayButtons({
  amount = 500,
  description = 'Liason Visa Prep Profile',
  onSuccess,
}) {
  const ref = useRef(null);
  const [sdkReady, setSdkReady] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  useEffect(() => {
    if (!sdkReady || !ref.current || !window.paypal) return;

    try {
      const btns = window.paypal.Buttons({
        style: { layout: 'vertical' },
        fundingSource: undefined, // allow PayPal + cards
        createOrder: (_, actions) =>
          actions.order.create({
            purchase_units: [
              {
                amount: {
                  value: String(Number(amount).toFixed(2)),
                  currency_code: 'USD',
                },
                description,
              },
            ],
          }),
        onApprove: async (_, actions) => {
          try {
            await actions.order.capture();
          } catch {}
          if (onSuccess) onSuccess();
          else window.location.href = '/flow/us/i-129f?paid=1';
        },
        onError: (err) => {
          console.error(err);
          alert('Payment error. Please try again.');
        },
      });

      btns.render(ref.current);
      return () => {
        try {
          btns.close();
        } catch {}
      };
    } catch (e) {
      console.error('PayPal Buttons render error', e);
    }
  }, [sdkReady, amount, description, onSuccess]);

  return (
    <>
      {!clientId && (
        <div
          className="card"
          style={{
            background: '#fffbe6',
            borderColor: '#f59e0b',
            color: '#92400e',
            padding: 8,
            marginBottom: 8,
          }}
        >
          Missing <code>NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> environment variable. Add it in
          Vercel → Project → Settings → Environment Variables (Production), then redeploy.
        </div>
      )}

      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${clientId || ''}&currency=USD&intent=capture&disable-funding=venmo,paylater`}
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
        onError={(e) => {
          console.error('PayPal SDK failed to load', e);
          alert('PayPal failed to load. Please refresh and try again.');
        }}
      />

      <div ref={ref} />
      {!sdkReady && (
        <div className="small" style={{ color: '#64748b', marginTop: 8 }}>
          Loading PayPal…
        </div>
      )}
    </>
  );
}
