// components/I129fGate.jsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const TEST_MODE = process.env.NEXT_PUBLIC_TEST_MODE === '1';

export default function I129fGate({ children }) {
  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (TEST_MODE) {
          if (!cancelled) {
            setPaid(true);
            setLoading(false);
          }
          return;
        }
        const r = await fetch('/api/payments/status', { cache: 'no-store' });
        const j = await r.json();
        if (!cancelled) setPaid(!!j.paid);
      } catch (e) {
        if (!cancelled) setErr(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="card">Checking access…</div>;
  if (err) return <div className="card" style={{color:'#b91c1c'}}>Error: {err}</div>;

  if (!paid) {
    return (
      <div className="card" style={{display:'grid', gap:8}}>
        <h2 style={{margin:0}}>Unlock the I-129F tool</h2>
        <p style={{margin:0}}>Please complete checkout to use the guided form and download the filled PDF.</p>
        <div>
          <Link href="/checkout/us/i-129f" className="btn btn-primary">Go to checkout</Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
