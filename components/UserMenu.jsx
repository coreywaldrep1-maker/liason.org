// components/UserMenu.jsx
'use client';

import { useEffect, useState } from 'react';

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/account/me', { credentials:'include', cache:'no-store' });
        if (!r.ok) return;
        const j = await r.json().catch(()=> ({}));
        if (j?.ok && j.user) setUser(j.user);
      } catch {}
    })();
  }, []);

  const logout = async () => {
    setErr('');
    try {
      await fetch('/api/auth/logout', { method:'POST', credentials:'include' });
      window.location.href = '/login';
    } catch (e) {
      setErr('Could not log out.');
    }
  };

  return (
    <div style={{ position:'relative' }}>
      <button type="button" className="btn" onClick={()=>setOpen(o=>!o)} aria-haspopup="menu" aria-expanded={open}>
        {user ? (user.name || 'Account') : 'Sign in'}
      </button>
      {open && (
        <div role="menu" className="card" style={{ position:'absolute', right:0, top:'110%', display:'grid', gap:6, padding:10, minWidth:180 }}>
          {user ? (
            <>
              <a role="menuitem" className="small" href="/account">Account</a>
              <a role="menuitem" className="small" href="/orders">Orders</a>
              <button role="menuitem" className="btn" onClick={logout}>Log out</button>
            </>
          ) : (
            <>
              <a role="menuitem" className="btn btn-primary" href="/login">Log in</a>
              <a role="menuitem" className="btn" href="/signup">Create account</a>
            </>
          )}
          {err && <div className="small" style={{color:'#b91c1c'}}>{err}</div>}
        </div>
      )}
    </div>
  );
}
