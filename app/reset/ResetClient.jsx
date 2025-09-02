// app/reset/ResetClient.jsx
'use client';

import { useState } from 'react';

export default function ResetClient() {
  const [tab, setTab] = useState('request'); // 'request' | 'complete'
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  async function requestReset(e) {
    e.preventDefault();
    try {
      const r = await fetch('/api/auth/reset/init', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email })
      });
      const j = await r.json();
      if (j.ok) {
        alert('If that email exists, a reset link has been sent.');
        setTab('complete');
      } else {
        alert('Unable to start reset. Please try again.');
      }
    } catch {
      alert('Network error. Please try again.');
    }
  }

  async function completeReset(e) {
    e.preventDefault();
    try {
      const r = await fetch('/api/auth/reset/complete', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ token, newPassword })
      });
      const j = await r.json();
      if (j.ok) {
        alert('Password updated. Please sign in.');
        window.location.href = '/account';
      } else {
        alert('Reset failed. Check your token and try again.');
      }
    } catch {
      alert('Network error. Please try again.');
    }
  }

  return (
    <main className="section">
      <div className="container" style={{maxWidth:480, display:'grid', gap:16}}>
        <h1 style={{margin:0}}>Reset password</h1>

        {tab === 'request' ? (
          <form className="card" onSubmit={requestReset} style={{display:'grid', gap:12}}>
            <label className="small">
              Email
              <br />
              <input
                type="email"
                required
                placeholder="you@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{width:'100%', padding:8, border:'1px solid #e2e8f0', borderRadius:8}}
              />
            </label>
            <button className="btn btn-primary" type="submit">Send reset link</button>
          </form>
        ) : (
          <form className="card" onSubmit={completeReset} style={{display:'grid', gap:12}}>
            <label className="small">
              Reset token
              <br />
              <input
                type="text"
                required
                placeholder="Paste the token from your email"
                value={token}
                onChange={e => setToken(e.target.value)}
                style={{width:'100%', padding:8, border:'1px solid #e2e8f0', borderRadius:8}}
              />
            </label>

            <label className="small">
              New password
              <br />
              <input
                type="password"
                required
                placeholder="Create a strong password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                style={{width:'100%', padding:8, border:'1px solid #e2e8f0', borderRadius:8}}
              />
            </label>

            <button className="btn btn-primary" type="submit">Update password</button>
            <button
              type="button"
              className="small"
              onClick={() => setTab('request')}
              style={{background:'transparent', border:0, padding:0, textDecoration:'underline', justifySelf:'end', cursor:'pointer'}}
            >
              Start over
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
