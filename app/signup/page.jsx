'use client';
import { useState } from 'react';
import Hero from '../../components/Hero';

export default function SignupPage() {
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    const res = await fetch('/api/auth/signup', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email, password })
    });
    const j = await res.json();
    if (!res.ok) return alert(j.error || 'Error');
    alert('Account created. Please log in.');
    window.location.href = '/login';
  }

  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16, maxWidth:560}}>
        <Hero size="sm" title="Create account" subtitle="One profile per account. Save your progress and return anytime." />
        <form className="card" onSubmit={onSubmit} style={{display:'grid', gap:12}}>
          <label className="small">Email<br/>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          </label>
          <label className="small">Password<br/>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          </label>
          <button className="btn btn-primary" type="submit">Sign up</button>
          <div className="small">Already have an account? <a href="/login">Log in</a></div>
        </form>
      </div>
    </main>
  );
}
