'use client';
import { useState } from 'react';
import Hero from '../../components/Hero';

export default function LoginPage() {
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email, password })
    });
    const j = await res.json();
    if (!res.ok) return alert(j.error || 'Error');
    window.location.href = '/account';
  }

  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16, maxWidth:560}}>
        <Hero size="sm" title="Log in" subtitle="Pick up where you left off." />
        <form className="card" onSubmit={onSubmit} style={{display:'grid', gap:12}}>
          <label className="small">Email<br/>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          </label>
          <label className="small">Password<br/>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          </label>
          <button className="btn btn-primary" type="submit">Log in</button>
          <div className="small">No account? <a href="/signup">Create one</a></div>
        </form>
      </div>
    </main>
  );
}
