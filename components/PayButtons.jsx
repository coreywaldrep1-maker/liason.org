'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

export default function PayButtons({ amount = 500, description = 'Liason Visa Prep Profile' }) {
  const containerRef = useRef(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState('');
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  // Render PayPal buttons when SDK is ready
  useEffect(() => {
    if (!sdkReady) return;
    if (!window.paypal || !containerRef.current) return;

    // Clear any previous render
    containerRef.current.innerHTML = '';

    try {
      window.paypal.Buttons({
        style: { layout: 'vertical', shape: 'rect', height: 45 },
        fundingSource: undefined, // let PayPal decide; we disabled Venmo/PayLater in the script URL

        // Create order for $amount USD
        createOrder: (_, actions) => {
          return actions.order.create({
            purchase_units: [
              {
                amount: { value: String(Number(amount).toFixed(2)), currency_code: 'USD' },
                description
              }
            ],
            intent: 'CAPTURE'
          });
        },

        // Capture payment, then set server paid flag and redirect back to the form
        onApprove: async (_data, actions) => {
          try {
            await actions.order.capture();
          } catch (e) {
            console.error(e);
            alert('Payment capture failed.');
            return;
          }

          try {
            // Mark the user as paid on the server
            await fetch('/api/payments/mark-paid', { method: 'POST' });
          } catch (e) {
            console.error('Could not mark paid on server, proceeding anyway.');
          }

          // Redirect back to the flow with ?paid=1 (wizard will also check server)
          window.location.href = '/flow/us/i-129f?paid=1';
        },

        onError: (err) => {
          console.error(err);
          setError('PayPal failed to load. Please refresh and try again.');
        }
      }).render(containerRef.current);
    } catch (e) {
      console.error(e);
      setError('PayPal failed to load. Please refresh and try again.');
    }
  }, [sdkReady, amount, description]);

  return (
    <div>
      {/* Load PayPal SDK */}
      {!clientId && (
        <div className="card" style={{ marginBottom: 12, color: '#b91c1c' }}>
          Missing NEXT_PUBLIC_PAYPAL_CLIENT_ID env var.
        </div>
      )}

      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId || '')}&currency=USD&intent=capture&disable-funding=venmo,paylater`}
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
        onError={() => setError('PayPal SDK failed to load.')}
      />

      <div ref={containerRef} />

      {error && (
        <div className="small" style={{ marginTop: 8, color: '#b91c1c' }}>
          {error}
        </div>
      )}
    </div>
  );
}
