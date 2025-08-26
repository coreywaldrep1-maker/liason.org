'use client';
import { useEffect, useState } from 'react';
import Hero from '../../components/Hero';

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(()=> {
    (async ()=>{
      const me = await fetch('/api/auth/whoami').then(r=>r.json()).catch(()=>null);
      if (me?.user) {
        setUser(me.user);
        const pay = await fetch('/api/payments/mark-paid', { method:'GET' }).then(r=>r.json()).catch(()=>({paid:false}));
        setPaid(!!pay?.paid);
      }
      setLoading(false);
    })();
  }, []);

  async function logout() {
    await fetch('/api/auth/logout', { method:'POST' });
    window.location.href = '/';
  }

  if (loading) return <main className="section"><div className="container">Loading…</div></main>;

  if (!user) return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16}}>
        <Hero size="sm" title="Account" subtitle="Please log in to view your profile." />
        <a className="btn btn-primary" href="/login">Log in</a>
      </div>
    </main>
  );

  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16}}>
        <Hero size="sm" title="Your account" subtitle={`Signed in as ${user.email}`} />
        <div className="card" style={{display:'grid', gap:8}}>
          <div><strong>Payment status:</strong> {paid ? '✅ Paid' : '❌ Not paid'}</div>
          <div><a className="btn" href="/flow/us/i-129f">Go to your I-129F</a></div>
          {!paid && <div><a className="btn" href="/checkout/us/i-129f">Go to checkout</a></div>}
          <div><button className="btn" onClick={logout}>Log out</button></div>
        </div>
      </div>
    </main>
  );
}
