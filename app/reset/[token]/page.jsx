'use client';

import { useState } from 'react';

export default function ResetPage({ params }) {
  const { token } = params;
  const [pw, setPw] = useState('');
  const [ok, setOk] = useState(null);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    const r = await fetch('/api/auth/reset', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ token, password: pw })
    });
    const data = await r.json();
    if (data.ok) setOk(true); else setErr(data.error || 'Error');
  };

  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16, maxWidth:420}}>
        <h1 style={{margin:0, fontSize:24, fontWeight:700}}>Set a new password</h1>
        <form onSubmit={submit} className="card" style={{display:'grid', gap:12}}>
          <label className="small">New password
            <br/>
            <input type="password" value={pw} onChange={e=>setPw(e.target.value)} required minLength={8} style={inputStyle}/>
          </label>
          <button className="btn btn-primary" type="submit">Update password</button>
        </form>
        {ok && <div className="card small">Password updated. You can now <a href="/account">sign in</a>.</div>}
        {err && <div className="card small" style={{color:'#b91c1c'}}>Error: {err}</div>}
      </div>
    </main>
  );
}

const inputStyle = {width:'100%', padding:8, border:'1px solid #e2e8f0', borderRadius:8};
