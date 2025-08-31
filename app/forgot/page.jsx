'use client';

import { useState } from 'react';

export default function ForgotPage() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    const r = await fetch('/api/auth/request-reset', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await r.json();
    setDone(data);
  };

  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16}}>
        <h1 style={{margin:0, fontSize:24, fontWeight:700}}>Password recovery</h1>
        <form onSubmit={submit} className="card" style={{display:'grid', gap:12, maxWidth:420}}>
          <label className="small">Email
            <br/>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required style={inputStyle}/>
          </label>
          <button className="btn btn-primary" type="submit">Send reset link</button>
        </form>

        {done && (
          <div className="card small" style={{display:'grid', gap:8}}>
            <div>Request received. If that email exists, you’ll get a reset link.</div>
            {done.resetUrl && (
              <>
                <div><strong>Dev shortcut:</strong> click to reset now</div>
                <a className="btn" href={done.resetUrl}>{done.resetUrl}</a>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

const inputStyle = {width:'100%', padding:8, border:'1px solid #e2e8f0', borderRadius:8};
