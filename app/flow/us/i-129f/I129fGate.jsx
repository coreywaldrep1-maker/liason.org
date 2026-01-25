'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
// show wizard only when paid; ensure this exists
import I129fWizard from '../../../../components/I129fWizard';

export default function I129fGate() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const who = await fetch('/api/auth/whoami', { cache: 'no-store' }).then(r => r.json());
        if (who?.ok && who.user) {
          setUser(who.user);
          const ps = await fetch('/api/payments/status?product=i129f', { cache: 'no-store' }).then(r => r.json());
          if (ps?.ok) setPaid(!!ps.paid);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="card">Loading…</div>;

  if (!user) {
    return (
      <div className="card" style={{ display: 'grid', gap: 12 }}>
        <b>Please sign in to continue</b>
        <a className="btn btn-primary" href="/account">Sign in / Create account</a>
      </div>
    );
  }

  if (!paid) {
    return <PrePayLanding />;
  }

  // Paid: show the real tool.
  return (
    <>
      <I129fWizard />
      <div className="card" style={{ display: 'grid', gap: 8 }}>
        {/* If user already saved, this GET will return a filled PDF; otherwise it returns the blank template. */}
        <a className="btn" href="/api/i129f/pdf">
          Download (from saved draft)
        </a>
      </div>
    </>
  );
}

function PrePayLanding() {
  return (
    <div className="card" style={{ display: 'grid', gap: 12 }}>
      <h2 style={{ margin: 0 }}>How it works — 3 easy steps</h2>
      <ol className="small" style={{ margin: 0, paddingLeft: 18 }}>
        <li><b>Upload your documents.</b> We pre-fill as much of the I-129F as possible.</li>
        <li><b>Use our assistant.</b> Get clear guidance to finish the remaining fields.</li>
        <li><b>Download your packet.</b> Review and download your completed I-129F PDF.</li>
      </ol>
      <div>
        <Link className="btn btn-primary" href="/checkout/us/i-129f">
          Continue to checkout
        </Link>
      </div>
    </div>
  );
}
