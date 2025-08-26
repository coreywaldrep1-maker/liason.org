'use client';

import { useEffect, useState } from 'react';
import PayButtons from './PayButtons';

export default function CheckoutI129FClient() {
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(()=> {
    (async ()=>{
      try {
        const j = await fetch('/api/payments/mark-paid', { method:'GET' }).then(r=>r.json());
        setPaid(!!j?.paid);
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="container">Checking payment status…</div>
    );
  }

  if (paid) {
    return (
      <div className="container" style={{display:'grid', gap:12}}>
        <h1 style={{margin:0}}>You’re all set ✅</h1>
        <div className="card">Your payment is on file. Continue filling your I-129F.</div>
        <a className="btn btn-primary" href="/flow/us/i-129f">Go to your form</a>
      </div>
    );
  }

  return (
    <div className="container" style={{display:'grid', gap:16, maxWidth:520}}>
      <h1 style={{margin:0}}>Checkout</h1>
      <div className="card" style={{display:'grid', gap:8}}>
        <div><strong>Liason Visa Prep Profile</strong></div>
        <div>Price: <strong>$500</strong></div>
        <PayButtons amount={500} description="Liason Visa Prep Profile" />
      </div>
    </div>
  );
}
