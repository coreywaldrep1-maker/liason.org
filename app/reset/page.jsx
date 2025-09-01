'use client';

import { useState } from 'react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Reset password | Liason' };

export default function ResetPage() {
  const [tab, setTab] = useState('request'); // 'request' | 'complete'
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');

  const requestReset = async (e) => {
    e.preventDefault();
    setMsg('');
    const res = await fetch('/api/auth/reset/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsg(
        data?.token
          ? `Dev token (for testing): ${data.token}`
          : 'If that email exists, you’ll receive a reset link shortly.'
      );
      setTab('complete');
    } else {
      setMsg(data?.error || 'Something went wrong.');
    }
  };

  const completeReset = async (e) => {
    e.preventDefault();
    setMsg('');
    const res = await fetch('/api/auth/reset/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsg('Password updated. You can now sign in.');
    } else {
      setMsg(data?.error || 'Something went wrong.');
    }
  };

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 520, display: 'grid', gap: 16 }}>
        <h1 style={{ margin: 0 }}>Reset your password</h1>

        <div className="card">
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button
              type="button"
              className="small"
              onClick={() => setTab('request')}
              style={{
                padding: '6px 10px',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                background: tab === 'request' ? '#eef2ff' : '#fff',
              }}
            >
              Request link
            </button>
            <button
              type="button"
              className="small"
              onClick={() => setTab('complete')}
              style={{
                padding: '6px 10px',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                background: tab === 'complete' ? '#eef2ff' : '#fff',
              }}
            >
              Enter token
            </button>
          </div>

          {tab === 'request' ? (
            <form onSubmit={requestReset} style={{ display: 'grid', gap: 12 }}>
              <label className="small">
                Email
                <br />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@email.com"
                  style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 8 }}
                />
              </label>
              <button className="btn btn-primary" type="submit">
                Send reset link
              </button>
            </form>
          ) : (
            <form onSubmit={completeReset} style={{ display: 'grid', gap: 12 }}>
              <label className="small">
                Token
                <br />
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  placeholder="Paste token from email"
                  style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 8 }}
                />
              </label>
              <label className="small">
                New password
                <br />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 8 }}
                />
              </label>
              <button className="btn btn-primary" type="submit">
                Update password
              </button>
            </form>
          )}
        </div>

        {msg && (
          <div className="small" style={{ padding: 8, border: '1px dashed #cbd5e1', borderRadius: 8 }}>
            {msg}
          </div>
        )}

        <div style={{ textAlign: 'right' }}>
          <a className="small" href="/account" style={{ textDecoration: 'underline' }}>
            Back to sign in
          </a>
        </div>
      </div>
    </main>
  );
}
