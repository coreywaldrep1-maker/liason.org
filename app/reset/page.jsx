'use client';

import { useEffect, useState } from 'react';

export default function ResetPage() {
  const [step, setStep] = useState<'email' | 'token'>('email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If a token is in the URL (?token=...), prefill and jump to step 2
  useEffect(() => {
    const u = new URL(window.location.href);
    const t = u.searchParams.get('token');
    if (t) {
      setToken(t);
      setStep('token');
    }
  }, []);

  async function onInitSubmit(e) {
    e.preventDefault();
    setError('');
    setMsg('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset/init', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.error || 'Failed to start reset');
      }
      // If your API returns a token (dev mode), show it and continue.
      if (json.token) {
        setToken(json.token);
      }
      setMsg('If this email exists, a reset link/token has been issued.');
      setStep('token');
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  }

  async function onCompleteSubmit(e) {
    e.preventDefault();
    setError('');
    setMsg('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset/complete', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ token, newPassword }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.error || 'Failed to reset password');
      }
      setMsg('Password updated. Redirecting to login…');
      setTimeout(() => {
        window.location.href = '/account?reset=1';
      }, 1200);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16, maxWidth:720}}>
        <h1 style={{margin:0}}>Reset your password</h1>

        {step === 'email' && (
          <form onSubmit={onInitSubmit} className="card" style={{display:'grid', gap:12, padding:16}}>
            <label className="small">Your account email
              <br/>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={e=>setEmail(e.target.value)}
                style={{width:'100%', padding:8, border:'1px solid #e2e8f0', borderRadius:8}}
              />
            </label>
            <button className="btn btn-primary" disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
            <div className="small">
              <a href="/account">Back to login</a>
            </div>
            {msg && <div className="small" style={{color:'#065f46'}}>{msg}</div>}
            {error && <div className="small" style={{color:'#b91c1c'}}>{error}</div>}
          </form>
        )}

        {step === 'token' && (
          <form onSubmit={onCompleteSubmit} className="card" style={{display:'grid', gap:12, padding:16}}>
            <p className="small">
              Enter the reset token you received (or it may be pre-filled here in dev),
              and choose a new password.
            </p>
            <label className="small">Reset token
              <br/>
              <input
                type="text"
                required
                placeholder="paste your token"
                value={token}
                onChange={e=>setToken(e.target.value)}
                style={{width:'100%', padding:8, border:'1px solid #e2e8f0', borderRadius:8}}
              />
            </label>
            <label className="small">New password
              <br/>
              <input
                type="password"
                required
                minLength={8}
                placeholder="at least 8 characters"
                value={newPassword}
                onChange={e=>setNewPassword(e.target.value)}
                style={{width:'100%', padding:8, border:'1px solid #e2e8f0', borderRadius:8}}
              />
            </label>
            <div style={{display:'flex', gap:8}}>
              <button className="btn btn-primary" disabled={loading}>
                {loading ? 'Updating…' : 'Update password'}
              </button>
              <a className="btn" href="/reset" style={{textDecoration:'none'}}>Start over</a>
            </div>
            <div className="small">
              <a href="/account">Back to login</a>
            </div>
            {msg && <div className="small" style={{color:'#065f46'}}>{msg}</div>}
            {error && <div className="small" style={{color:'#b91c1c'}}>{error}</div>}
          </form>
        )}
      </div>
    </main>
  );
}
