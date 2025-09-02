// components/I129fGate.jsx
'use client';

import { useEffect, useState } from 'react';
import PayButtons from './PayButtons';
import I129fWizard from './I129fWizard'; // your existing wizard

export default function I129fGate() {
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshStatus = async () => {
    const r = await fetch('/api/payments/status', { cache: 'no-store' });
    const j = await r.json();
    setPaid(!!j.paid);
    setLoading(false);
  };

  useEffect(() => { refreshStatus(); }, []);

  if (loading) return <div className="card">Loading…</div>;

  if (!paid) {
    return (
      <div className="card" style={{ display: 'grid', gap: 16 }}>
        <h2 style={{ margin: 0 }}>How it works — 3 easy steps</h2>
        <ol className="small" style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }}>
          <li><strong>Upload your documents.</strong> We pre-fill as much of the I-129F as possible.</li>
          <li><strong>Use our assistant.</strong> Clear guidance to finish the remaining fields.</li>
          <li><strong>Download your packet.</strong> Review and download your completed I-129F PDF.</li>
        </ol>
        <div style={{ marginTop: 8 }}>
          <PayButtons amount="500.00" onPaid={refreshStatus} />
        </div>
      </div>
    );
  }

  // Paid view: wizard + (optionally) AI. Keep AI hidden until paid — it is.
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <I129fWizard />
      {/* If you have an AI component, render it here (now that paid is true) */}
      {/* <AiHelp /> */}
    </div>
  );
}
