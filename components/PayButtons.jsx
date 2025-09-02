// components/PayButtons.jsx
'use client';

import { useEffect, useRef } from 'react';

export default function PayButtons({ amount = '500.00', onApprove }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId || !containerRef.current) return;

    // Load PayPal SDK once
    const id = 'paypal-sdk';
    if (!document.getElementById(id)) {
      const s = document.createElement('script');
      s.id = id;
      s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture`;
      s.onload = renderButtons;
      document.body.appendChild(s);
    } else {
      renderButtons();
    }

    function renderButtons() {
      if (!window.paypal) return;
      window.paypal.Buttons({
        style: { layout: 'vertical', shape: 'rect' },
        createOrder: (data, actions) => actions.order.create({
          purchase_units: [{ amount: { value: amount } }],
        }),
        onApprove: async (data, actions) => {
          try {
            await actions.order.capture();
          } catch {}
          try {
            await fetch('/api/payments/mark-paid', { method: 'POST' });
          } catch {}
          onApprove?.(data?.orderID);
        },
        onError: (err) => {
          console.error('PayPal error', err);
          alert('Payment failed. Please try again.');
        },
      }).render(containerRef.current);
    }
  }, [amount, onApprove]);

  return <div ref={containerRef} />;
}
