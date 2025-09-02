'use client';

import { useState } from 'react';

export default function CheckoutPage() {
  const [busy, setBusy] = useState(false);

  const recheck = async () => {
    // just go back to the tool; it will call /api/payments/status again
    window.location.href = '/flow/us/i-129f';
  };

  const devUnlock = async () => {
    try {
      setBusy(true);
      await fetch('/api/payments/mark-paid-dev', { method: 'POST' });
      window.location.href = '/flow/us/i-129f';
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="section">
      <div className="container" style={{ display:'grid', gap:16 }}>
        <h1>Checkout</h1>

        <div className="card" style={{ padding:20, display:'grid', gap:12 }}>
          <p>Payment integration is being finalized.</p>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <button className="btn" onClick={recheck}>
              I already paid — Check access
            </button>

            {/* TEMPORARY: remove this button when PayPal is live */}
            <button className="btn" onClick={devUnlock} disabled={busy}>
              Temporary Dev Unlock
            </button>
          </div>
          <p className="small" style={{opacity:.7}}>
            Once PayPal is reconnected, this page will redirect you to PayPal
            and then grant access automatically on return.
          </p>
        </div>
      </div>
    </main>
  );
}
