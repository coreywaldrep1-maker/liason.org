// components/AuthWidget.jsx
'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export default function AuthWidget() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Check session via GET /api/auth/login (treat 200 as logged-in)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const r = await fetch('/api/auth/login', { credentials: 'include', cache: 'no-store' });
        if (cancelled) return;
        if (r.ok) {
          let data = null;
          try { data = await r.json(); } catch {}
          if (data?.user) setUser(data.user);
          else setUser(data || {}); // 200 OK without JSON still counts as "logged in"
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => { cancelled = true; document.removeEventListener('mousedown', onDoc); };
  }, []);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    setUser(null);
    setOpen(false);
    if (typeof window !== 'undefined') window.location.reload();
  };

  if (loading) {
    return <div className="h-8 w-8 animate-pulse rounded-full border" aria-label="Loading" />;
  }

  if (!user) {
    return (
      <Link href="/login" className="btn small whitespace-nowrap" aria-label="Log in">
        Log in
      </Link>
    );
  }

  const initials = (user.name || user.email || '?').slice(0, 1).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-full border"
        title={user.email || user.name || 'Account'}
      >
        <span className="text-sm">{initials}</span>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-44 rounded-xl border bg-white p-2 shadow-md">
          <div className="truncate px-2 py-1 text-xs text-slate-500">{user.email || user.name}</div>
          <Link href="/account" className="block rounded px-2 py-1 hover:bg-slate-100" role="menuitem">
            Account
          </Link>
          <button onClick={logout} className="block w-full rounded px-2 py-1 text-left hover:bg-slate-100" role="menuitem">
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
