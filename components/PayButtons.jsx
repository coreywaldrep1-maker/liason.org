'use client';
import { useEffect, useRef } from 'react';
import Script from 'next/script';

export default function PayButtons({
  amount = 500,
  description = 'Liason Visa Prep Profile',
  onSuccess,
}) {
  const ref = useRef(null);
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  useEffect(() => {
    if (!window.paypal || !ref.current) return;
    const btns = window.paypal.Buttons({
      style: { layout: 'vertical' },
      fundingSource: undefined, // PayPal + cards
      createOrder: (_, actions) => actions.order.create({
        purchase_units: [{
          amount: { value: String(Number(amount).toFixed(2)), currency_code: 'USD' },
          description,
        }],
      }),
      onApprove: async (_, actions) => {
        try { await actions.order.capture(); } catch {}
        if (onSuccess) onSuccess();
        else window.location.href = '/flow/us/i-129f?paid=1';
      },
      onError: (err) => {
        console.error(err);
        alert('Payment error. Please try again.');
      },
    });
    btns.render(ref.current);
    return () => { try { btns.close(); } catch {} };
  }, [amount, description]);

  return (
    <>
      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture&disable-funding=venmo,paylater`}
        strategy="afterInteractive"
      />
      <div ref={ref} />
    </>
  );
}
