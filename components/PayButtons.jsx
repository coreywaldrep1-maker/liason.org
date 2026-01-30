// components/PayButtons.jsx
'use client';

import { useEffect, useRef, useState } from 'react';

function loadPaypalSdk({ clientId, currency = 'USD' }) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('No window'));
    if (window.paypal) return resolve(window.paypal);

    const scriptId = 'paypal-sdk';
    const existing = document.getElementById(scriptId);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.paypal));
      existing.addEventListener('error', () => reject(new Error('PayPal SDK failed to load')));
      return;
    }

    const s = document.createElement('script');
    s.id = scriptId;
    s.async = true;
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(
      currency
    )}&intent=capture`;

    s.onload = () => resolve(window.paypal);
    s.onerror = () => reject(new Error('PayPal SDK failed to load'));
    document.body.appendChild(s);
  });
}

/**
 * Renders PayPal buttons without @paypal/react-paypal-js dependency.
 * Uses server routes:
 *  - POST /api/payments/create  -> { ok:true, id }
 *  - POST /api/payments/capture -> sets paid cookie, returns { ok:true }
 */
export default function PayButtons({ amount = '500.00', currency = 'USD', onApprove }) {
  const containerRef = useRef(null);
  const renderedRef = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

    if (!clientId) {
      setError('Missing NEXT_PUBLIC_PAYPAL_CLIENT_ID environment variable.');
      return;
    }

    if (!containerRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        setError('');

        // Ensure we don't render twice (React strict mode / re-renders)
        if (renderedRef.current) return;
        renderedRef.current = true;

        // Clear any prior render
        containerRef.current.innerHTML = '';

        const paypal = await loadPaypalSdk({ clientId, currency });
        if (cancelled) return;

        paypal
          .Buttons({
            style: { layout: 'vertical', shape: 'rect' },

            createOrder: async () => {
              const r = await fetch('/api/payments/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  amount,
                  description: 'I-129F Guided Tool',
                }),
              });

              const j = await r.json().catch(() => ({}));
              if (!r.ok || !j?.id) {
                throw new Error(j?.error || 'Could not create PayPal order');
              }
              return j.id;
            },

            onApprove: async (data) => {
              // Capture on YOUR server so cookies / DB writes happen consistently
              const r = await fetch('/api/payments/capture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderID: data.orderID }),
              });

              const j = await r.json().catch(() => ({}));
              if (!r.ok || !j?.ok) {
                throw new Error(j?.error || 'Payment capture failed');
              }

              onApprove?.(data.orderID);
            },

            onError: (err) => {
              console.error('PayPal error:', err);
              setError('Payment failed. Please try again.');
            },
          })
          .render(containerRef.current);
      } catch (e) {
        console.error(e);
        setError(String(e?.message || e));
        renderedRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [amount, currency, onApprove]);

  return (
    <div>
      {error ? (
        <div className="mb-2 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-800">
          {error}
        </div>
      ) : null}
      <div ref={containerRef} />
    </div>
  );
}
