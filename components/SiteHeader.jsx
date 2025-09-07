'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
        const j = await r.json().catch(() => ({}));
        setAuthed(Boolean(j?.ok && j?.user?.id));
      } catch {
        setAuthed(false);
      }
    })();
  }, []);

  async function doLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      // Hard refresh so the header resets everywhere
      window.location.assign('/');
    }
  }

  return (
    <header className="site-header" style={{ borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 12, padding: '10px 0' }}>
        {/* Left: dropdown toggle */}
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
                top: '110%',
                left: 0,
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: 8,
                minWidth: 180,
                boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
                zIndex: 20
              }}
            >
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
                <li><Link className="small" href="/" style={linkStyle}>Home</Link></li>
                <li><Link className="small" href="/visas" style={linkStyle}>Visas</Link></li>
                <li><Link className="small" href="/about" style={linkStyle}>About</Link></li>
                <li><Link className="small" href="/policies" style={linkStyle}>Policies</Link></li>
                {!authed ? (
                  <li><Link className="small" href="/account" style={linkStyle}>Login</Link></li>
                ) : (
                  <li><button type="button" className="small" style={linkBtn} onClick={doLogout}>Logout</button></li>
                )}
              </ul>
            </nav>
          )}
        </div>

        {/* Center: brand */}
        <Link href="/" className="brand" style={{ justifySelf: 'center', display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <img src="/logo.svg" alt="Liason logo" width={24} height={24} style={{ display: 'block' }} />
          <span style={{ fontWeight: 700, fontSize: 18, color: '#0f172a' }}>Liason</span>
        </Link>

        {/* Right: account/login */}
        <div style={{ justifySelf: 'end', position: 'relative' }}>
          {!authed ? (
            <Link href="/account" className="small" style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', textDecoration: 'none' }}>
              Login
            </Link>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setMenu(m => !m)}
                className="small"
                style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}
              >
                <span style={{ marginRight: 6 }}>👤</span> Account ▾
              </button>
              {menu && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '110%',
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: 8,
                    minWidth: 180,
                    boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
                    zIndex: 20,
                    display: 'grid',
                    gap: 6
                  }}
                >
                  <Link className="small" href="/account" style={linkStyle}>Settings</Link>
                  <button type="button" className="small" style={linkBtn} onClick={doLogout}>Logout</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}

const linkStyle = { padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 8, textDecoration: 'none', background: '#fff', textAlign: 'left' };
const linkBtn = { ...linkStyle, width: '100%', background: '#fff', cursor: 'pointer' };
