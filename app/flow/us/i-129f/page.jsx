'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import I129fWizard from '@/components/I129fWizard';
import AiHelp from '@/components/AiHelp'; // will be hidden unless paid

export default function I129FPage() {
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch real payment status from your API (no auto-paid)
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch('/api/payments/status', { cache: 'no-store' });
        if (!res.ok) throw new Error('status not ok');
        const data = await res.json();
        if (!ignore) setPaid(!!data?.paid);
      } catch {
        // If status fails, keep paid=false
        if (!ignore) setPaid(false);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  if (loading) {
    return (
      <main className="section">
        <div className="container">
          <p>Loading…</p>
        </div>
      </main>
    );
  }

  return paid ? <PaidView /> : <PrePayView />;
}

/** PRE-PAY VIEW: shows “3 easy steps”, hides AI, CTA to checkout */
function PrePayView() {
  return (
    <main className="section">
      <div className="container" style={{ display: 'grid', gap: 16 }}>
        <header className="card" style={{ padding: 20 }}>
          <h1 style={{ margin: 0 }}>How it works — 3 easy steps</h1>
          <p style={{ margin: '8px 0 0', opacity: 0.8 }}>
            We guide you from upload to a complete, printable I-129F packet.
          </p>
        </header>

        <ol className="card" style={{ padding: 20, display: 'grid', gap: 12 }}>
          <li>
            <strong>Upload your documents.</strong>{' '}
            We pre-fill as much of the I-129F as possible.
          </li>
          <li>
            <strong>Finish the remaining fields with guidance.</strong>{' '}
            Clear tips on every section. (AI assistant unlocks after purchase.)
          </li>
          <li>
            <strong>Download your packet.</strong>{' '}
            Review and download your completed I-129F PDF.
          </li>
        </ol>

        <div className="card" style={{ padding: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/checkout" className="btn btn-primary">Purchase access</Link>
          <button
            className="btn"
            onClick={() => window.location.reload()}
            title="If you just paid, refresh to continue"
          >
            I already paid — Refresh
          </button>
          {/* DEV NOTE: If you need a local test unlock, temporarily use:
              localStorage.setItem('i129f_paid','yes'); location.reload();
              (Do not ship this button to production.) */}
        </div>
      </div>
    </main>
  );
}

/** PAID VIEW: shows Wizard; AI help visible here only */
function PaidView() {
  // You can load previously saved answers here if you store them.
  const initialAnswers = useMemo(() => ({}), []);

  return (
    <main className="section">
      <div className="container" style={{ display: 'grid', gap: 16 }}>
        <header className="card" style={{ padding: 20 }}>
          <h1 style={{ margin: 0 }}>I-129F — Guided Application</h1>
          <p style={{ margin: '8px 0 0', opacity: 0.8 }}>
            Work through each section. You can save progress anytime and return later.
          </p>
        </header>

        <I129fWizard initialAnswers={initialAnswers} />

        {/* AI help: visible only after payment */}
        <div className="card" style={{ padding: 20 }}>
          <h2 style={{ marginTop: 0 }}>Need a hand?</h2>
          <p className="small" style={{ marginTop: 4, opacity: 0.8 }}>
            Ask specific questions about a field or section.
          </p>
          <AiHelp />
        </div>
      </div>
    </main>
  );
}
