// components/I129fGate.jsx
'use client';

import { useEffect, useState } from 'react';
import PayButtons from '@/components/PayButtons';
import I129fWizard from '@/components/I129fWizard'; // your existing wizard

export default function I129fGate() {
  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);
  const testMode = process.env.NEXT_PUBLIC_I129F_TEST_MODE === '1'; // optional

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/payments/status', { cache: 'no-store' });
        const j = await r.json();
        if (!cancelled) setPaid(Boolean(j?.paid));
      } catch {
        if (!cancelled) setPaid(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="card">Checking access…</div>;
  }

  if (!paid && !testMode) {
    return (
      <div className="card" style={{ display: 'grid', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Unlock the I-129F tool</h2>
        <p className="small" style={{ margin: 0 }}>
          Get the guided experience and downloadable, pre-filled packet.
        </p>
        <div>
          <PayButtons
            amount="500.00"
            onApprove={() => {
              setPaid(true);
            }}
          />
        </div>
      </div>
    );
  }

  // Paid OR test mode: show the tool
  return (
    <>
      {testMode && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="small">Test mode is ON.</div>
        </div>
      )}
      <I129fWizard />
    </>
  );
}
