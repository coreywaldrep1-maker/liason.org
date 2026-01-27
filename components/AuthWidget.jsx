// components/AuthWidget.jsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

function initialsFromEmail(email = '') {
  const s = String(email || '').trim();
  if (!s) return '';
  const left = s.split('@')[0] || '';
  const parts = left
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);

  if (parts.length === 0) return left.slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function UserIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2.25c-4.2 0-7.5 2.1-7.5 4.6875V21h15v-2.0625C19.5 16.35 16.2 14.25 12 14.25Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function AuthWidget() {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const popRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' });
        const j = await r.json();
        if (!cancelled) setUser(j?.ok ? j.user : null);
      } catch {
        if (!cancelled) setUser(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Close on outside click / escape
  useEffect(() => {
    function onDocClick(e) {
      const t = e.target;
      if (btnRef.current?.contains(t)) return;
      if (popRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onEsc(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('keydown', onEsc);
    };
  }, []);

  const email = user?.email || '';
  const initials = useMemo(() => initialsFromEmail(email), [email]);
  const avatarUrl = user?.avatarUrl || user?.avatar_url || user?.photoUrl || user?.photo_url || '';

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // ignore
    }
    setUser(null);
    setOpen(false);
    // hard refresh to clear any gated / cached UI
    window.location.href = '/';
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        type="button"
        aria-label={user ? 'Open profile menu' : 'Open login menu'}
        onClick={() => setOpen((v) => !v)}
        style={{
          height: 36,
          width: 36,
          borderRadius: 999,
          border: '1px solid #e2e8f0',
          background: '#fff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : user ? (
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{initials || 'ME'}</span>
        ) : (
          <UserIcon size={18} />
        )}
      </button>

      {open && (
        <div
          ref={popRef}
          role="menu"
          aria-label="Account menu"
          style={{
            position: 'absolute',
            top: 44,
            right: 0,
            width: 220,
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            boxShadow: '0 10px 22px rgba(15,23,42,0.10)',
            padding: 8,
            zIndex: 50,
          }}
        >
          {user ? (
            <>
              <div style={{ padding: '6px 8px 8px 8px' }}>
                <div style={{ fontSize: 12, color: '#475569' }}>Signed in as</div>
                <div className="truncate" style={{ fontSize: 13, fontWeight: 600 }}>
                  {email}
                </div>
              </div>
              <div style={{ height: 1, background: '#e2e8f0', margin: '6px 0' }} />
              <Link
                href="/account"
                className="btn"
                style={{ width: '100%', justifyContent: 'flex-start' }}
                onClick={() => setOpen(false)}
              >
                Account
              </Link>
              <button
                type="button"
                className="btn"
                style={{ width: '100%', justifyContent: 'flex-start', marginTop: 6 }}
                onClick={logout}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => setOpen(false)}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="btn"
                style={{ width: '100%', marginTop: 6 }}
                onClick={() => setOpen(false)}
              >
                Create account
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
