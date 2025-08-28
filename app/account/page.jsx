'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // On mount, check session
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/auth/whoami', { cache: 'no-store' });
        const j = await r.json();
        if (j?.ok && j.user) setUser(j.user);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  async function handleSignup(e) {
    e.preventDefault();
    setBusy(true); setError('');
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');

    try {
      const r = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email, password }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j?.error || 'Sign up failed');

      setUser(j.user);
      // Redirect after successful sign up (choose where you want to land)
      window.location.href = '/'; // or '/account' to stay here and show dashboard
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setBusy(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setBusy(true); setError('');
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');

    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email, password }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j?.error || 'Login failed');

      setUser(j.user);
      // Redirect after successful login (choose where you want to land)
      window.location.href = '/'; // or '/account'
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setUser(null);
    router.refresh();
    window.location.href = '/';
  }

  // If logged in, show a simple account panel instead of forms
  if (user) {
    return (
      <main className="section">
        <div className="container" style={{display:'grid', gap:16}}>
          <div className="card" style={{display:'grid', gap:12}}>
            <h1 style={{margin:0}}>Account</h1>
            <div className="small">Signed in as <b>{user.email}</b></div>
            <div style={{display:'flex', gap:8}}>
              <a href="/flow/us/i-129f" className="btn btn-primary">Go to I-129F</a>
              <button type="button" className="btn" onClick={handleLogout}>Sign out</button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Not logged in: show login/signup switcher
  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16}}>
        <div style={{display:'flex', gap:8}}>
          <button
            className={mode === 'login' ? 'btn btn-primary' : 'btn'}
            onClick={() => setMode('login')}
            type="button"
          >
            Sign in
          </button>
          <button
            className={mode === 'signup' ? 'btn btn-primary' : 'btn'}
            onClick={() => setMode('signup')}
            type="button"
          >
            Create account
          </button>
        </div>

        {error ? <div className="card" style={{color:'#b91c1c'}}>{error}</div> : null}

        {mode === 'login' ? (
          <form className="card" onSubmit={handleLogin} style={{display:'grid', gap:12}}>
            <h1 style={{margin:0}}>Sign in</h1>
            <label className="small">Email<br/>
              <input name="email" type="email" required style={{width:'100%', padding:8, border:'1px solid #e2e8f0', borderRadius:8}}/>
            </label>
            <label className="small">Password<br/>
              <input name="password" type="password" required style={{width:'100%', padding:8, border:'1px solid #e2e8f0', borderRadius:8}}/>
            </label>
            <button className="btn btn-primary" disabled={busy} type="submit">
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        ) : (
          <form className="card" onSubmit={handleSignup} style={{display:'grid', gap:12}}>
            <h1 style={{margin:0}}>Create account</h1>
            <label className="small">Email<br/>
              <input name="email" type="email" required style={{width:'100%', padding:8, border:'1px solid #e2e8f0', borderRadius:8}}/>
            </label>
            <label className="small">Password<br/>
              <input name="password" type="password" required style={{width:'100%', padding:8, border:'1px solid #e2e8f0', borderRadius:8}}/>
            </label>
            <button className="btn btn-primary" disabled={busy} type="submit">
              {busy ? 'Creating…' : 'Create account'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
