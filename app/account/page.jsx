'use client';

import { useState } from 'react';

export const metadata = { title: 'Account | Liason' };

export default function AccountPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setMsg('');
    try {
      const url = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const res = await fetch(url, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email, password: pw })
      });
      const j = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(j.error || 'Request failed');
      setMsg(mode === 'login' ? 'Signed in! Redirecting…' : 'Account created! You can sign in now.');
      if (mode === 'login') {
        setTimeout(()=> { window.location.href = '/flow/us/i-129f'; }, 700);
      } else {
        setMode('login');
      }
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="section">
      <div className="container" style={{maxWidth:520, display:'grid', gap:16}}>
        <h1 style={{margin:0}}>{mode === 'login' ? 'Sign in' : 'Create account'}</h1>

        <form onSubmit={submit} className="card" style={{display:'grid', gap:12}}>
          <label className="small">Email<br/>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          </label>
          <label className="small">Password<br/>
            <input type="password" value={pw} onChange={e=>setPw(e.target.value)} required />
          </label>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Please wait…' : (mode === 'login' ? 'Sign in' : 'Create account')}
          </button>
          {msg && <div className="small">{msg}</div>}
        </form>

        <div className="small">
          {mode === 'login' ? (
            <>Don’t have an account? <button className="link" onClick={()=>setMode('signup')}>Create account</button></>
          ) : (
            <>Already have an account? <button className="link" onClick={()=>setMode('login')}>Sign in</button></>
          )}
        </div>
      </div>
    </main>
  );
}
