'use client';
import { useEffect, useState } from 'react';
import PayButtons from '../../../../components/PayButtons';
import Hero from '../../../../components/Hero';

const PAID_KEY = 'liason:i129f:paid';

export default function CheckoutI129F() {
  const [alreadyPaid, setAlreadyPaid] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(PAID_KEY) === '1') {
        setAlreadyPaid(true);
        // Immediately bounce back to the wizard
        window.location.replace('/flow/us/i-129f');
      }
    } catch {}
  }, []);

  // Fallback UI for the millisecond before redirect
  if (alreadyPaid) {
    return (
      <main className="section">
        <div className="container" style={{display:'grid', gap:16}}>
          <Hero size="sm" title="You’re all set" subtitle="Your payment is recorded. Taking you back to your form…" />
          <div className="small">If you’re not redirected, <a href="/flow/us/i-129f">click here</a>.</div>
        </div>
      </main>
    );
  }

  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16}}>
        <Hero
          size="sm"
          title="Checkout — K-1 (I-129F)"
          subtitle="Pay securely with PayPal or card. You’ll return to your wizard with access marked as paid."
        />

        <div className="card" style={{display:'grid', gap:12}}>
          <div style={{display:'flex', justifyContent:'space-between'}}>
            <strong>Liason — Visa Prep Profile</strong>
            <strong>$500.00</strong>
          </div>
          <div className="small" style={{color:'#64748b'}}>
            Includes: guided answers, AI help in multiple languages, draft PDF, and a pre-submission checklist.
          </div>
          <PayButtons
            amount={500}
            description="Liason — Visa Prep Profile (I-129F)"
            onSuccess={() => {
              try { localStorage.setItem(PAID_KEY, '1'); } catch {}
              window.location.href = '/flow/us/i-129f?paid=1';
            }}
          />
        </div>

        <div className="small" style={{color:'#64748b'}}>
          Not legal advice. For legal advice, consult a licensed attorney.
        </div>
      </div>
    </main>
  );
}
