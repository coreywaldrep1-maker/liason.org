'use client';

import { useState } from 'react';

export default function AccountPage() {
  const [mode, setMode] = useState('login'); // <-- plain JS

  const onLogin = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = {
      email: form.get('email')?.toString().trim(),
      password: form.get('password')?.toString(),
    };
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      window.location.href = '/flow/us/i-129f';
    } else {
      alert('Login failed');
    }
  };

  const onSignup = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = {
      email: form.get('email')?.toString().trim(),
      password: form.get('password')?.toString(),
    };
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      alert('Account created. Please log in.');
      setMode('login');
    } else {
      alert('Sign up failed');
    }
  };

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 480, display: 'grid', gap: 16 }}>
        <h1 style={{ margin: 0 }}>{mode === 'login' ? 'Sign in' : 'Create account'}</h1>

        {mode === 'login' ? (
          <form className="card" onSubmit={onLogin}>
            <div style={{ display: 'grid', gap: 12 }}>
              <label className="small">
                Email
                <br />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@email.com"
                  style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 8 }}
                />
              </label>

              <label className="small">
                Password
                <br />
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 8 }}
                />
              </label>

              <button className="btn btn-primary" type="submit">Sign in</button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  className="small"
                  onClick={() => setMode('signup')}
                  style={{ background: 'transparent', border: 0, padding: 0, textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Create account
                </button>

                <a className="small" href="/account/reset" style={{ textDecoration: 'underline' }}>
                  Forgot password?
                </a>
              </div>
            </div>
          </form>
        ) : (
          <form className="card" onSubmit={onSignup}>
            <div style={{ display: 'grid', gap: 12 }}>
              <label className="small">
                Email
                <br />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@email.com"
                  style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 8 }}
                />
              </label>

              <label className="small">
                Password
                <br />
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="Create a strong password"
                  style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 8 }}
                />
              </label>

              <button className="btn btn-primary" type="submit">Create account</button>

              <div style={{ textAlign: 'right' }}>
                <button
                  type="button"
                  className="small"
                  onClick={() => setMode('login')}
                  style={{ background: 'transparent', border: 0, padding: 0, textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Back to sign in
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
