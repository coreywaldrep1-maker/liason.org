// components/SiteHeader.jsx (snippet)
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SiteHeader() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' });
        const j = await r.json();
        setAuthed(!!j?.ok);
      } catch {
        setAuthed(false);
      }
    })();
  }, []);

  async function onLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    try { localStorage.removeItem('i129f_paid'); } catch {}
    window.location.href = '/';
  }

  return (
    <header>
      {/* ... your left menu & language switcher ... */}

      <div style={{ display:'flex', gap:8 }}>
        {authed ? (
          <>
            <Link href="/account" className="btn">Account</Link>
            <button onClick={onLogout} className="btn">Logout</button>
          </>
        ) : (
          <Link href="/account" className="btn">Login</Link>
        )}
      </div>
    </header>
  );
}
