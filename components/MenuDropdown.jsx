'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MenuDropdown() {
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(document.cookie.includes('liason_token='));
  }, []);

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    // nuke the cookie client-side too, then reload
    document.cookie = 'liason_token=; Path=/; Max-Age=0; SameSite=Lax; Secure';
    window.location.href = '/';
  }

  const linkStyle = {
    padding: '6px 10px',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    textDecoration: 'none',
    background: '#fff',
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        aria-label="Menu"
        onClick={() => setOpen(v => !v)}
        className="small"
        style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}
      >
        ☰
      </button>

      {open && (
        <nav
          aria-label="Main"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: 8,
            boxShadow: '0 8px 24px rgba(15,23,42,.08)',
            zIndex: 50
          }}
        >
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
            <li><Link href="/" style={linkStyle}>Home</Link></li>
            <li><Link href="/visas" style={linkStyle}>Visas</Link></li>
            <li><Link href="/about" style={linkStyle}>About</Link></li>
            <li><Link href="/policies" style={linkStyle}>Policies</Link></li>
            <li style={{ height: 6 }} />
            {!authed ? (
              <li><Link href="/account" style={linkStyle}>Login</Link></li>
            ) : (
              <li>
                <button onClick={logout} className="small" style={{ ...linkStyle, width: '100%' }}>
                  Logout
                </button>
              </li>
            )}
          </ul>
        </nav>
      )}
    </div>
  );
}
