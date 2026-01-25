'use client';

import { useEffect, useRef, useState } from 'react';
import PayButtons from '@/components/PayButtons';

export default function I129fGate({ children }) {
  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);
  const payRef = useRef(null);

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

  if (loading) return <div className="card">Checking access…</div>;

  if (!paid) {
    return (
      <div style={{display:'grid', gap:16}}>
        <section className="card" style={{display:'grid', gap:12}}>
          <h2 style={{margin:0}}>How it works — 3 easy steps</h2>
          <ol className="small" style={{margin:'0 0 4px 18px'}}>
            <li><strong>Guided prompts in your language.</strong> Answer simple questions on any device; we translate pages and instructions for you.</li>
            <li><strong>Helpful AI at every step.</strong> Get clear explanations, examples, and help crafting your story.</li>
            <li><strong>Download your packet.</strong> We pre-fill the I-129F and let you review & export a ready-to-print PDF.</li>
          </ol>
          <p className="small" style={{margin:0}}>
            Most people finish in ~15 minutes — no spreadsheets, no guesswork, less stress.
          </p>

          <button
            className="btn btn-primary"
            onClick={() => payRef.current?.scrollIntoView({ behavior:'smooth', block:'start' })}
          >
            Continue to checkout
          </button>
        </section>

        <section ref={payRef} className="card" style={{display:'grid', gap:8}}>
          <h3 style={{margin:0}}>Checkout</h3>
          <PayButtons
            amount="500.00"
            onApprove={() => setPaid(true)}
          />
        </section>
      </div>
    );
  }

  // Paid view
  return (
    <div style={{display:'grid', gap:16}}>
      {children ?? null}
    </div>
  );
}
