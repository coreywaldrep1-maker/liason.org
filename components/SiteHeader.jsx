'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const acctRef = useRef(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const r = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!cancel) setAuthed(r.ok);
      } catch {
        if (!cancel) setAuthed(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  useEffect(() => {
    function onDocClick(e) {
      if (!acctRef.current) return;
      if (!acctRef.current.contains(e.target)) setAcctOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  async function doLogout() {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
    window.location.href = '/';
  }

  return (
    <header className="site-header" style={{ borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
      <div className="container"
        style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 12, padding: '12px 0' }}>
        {/* LEFT: Menu + Language */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            aria-label="Menu"
            onClick={() => setMenuOpen(v => !v)}
            className="small"
            style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}
          >
            ☰
          </button>
          <LanguageSwitcher />
        </div>

        {/* CENTER: Brand */}
        <div style={{ justifySelf: 'center' }}>
          <Link href="/" className="logo" aria-label="Liason home"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#0f172a' }}>
            <img src="/logo.svg" alt="Liason" width={24} height={24} style={{ display: 'block' }} />
            <strong>Liason</strong>
          </Link>
        </div>

        {/* RIGHT: Account */}
        <div ref={acctRef} style={{ justifySelf: 'end', position: 'relative' }}>
          <button
            onClick={() => setAcctOpen(v => !v)}
            className="small"
            aria-haspopup="menu"
            aria-expanded={acctOpen}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="8" r="4" stroke="#0f172a" strokeWidth="1.8" />
              <path d="M4 20c1.6-3.5 5-5.5 8-5.5S18.4 16.5 20 20" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span>{authed ? 'Account' : 'Login'}</span>
          </button>

          {acctOpen && (
            <div role="menu"
              style={{
                position: 'absolute', right: 0, top: 'calc(100% + 6px)', background: '#fff',
                border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 6px 20px rgba(0,0,0,0.06)', padding: 8, minWidth: 180,
                display: 'grid', gap: 6, zIndex: 20
              }}>
              {!authed ? (
                <Link href="/account" className="small" role="menuitem" style={menuItemStyle}>Login</Link>
              ) : (
                <>
                  <Link href="/account" className="small" role="menuitem" style={menuItemStyle}>Settings</Link>
                  <button onClick={doLogout} className="small" role="menuitem" style={{ ...menuItemStyle, width: '100%', textAlign: 'left' }}>
                    Logout
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Vertical dropdown menu */}
      {menuOpen && (
        <nav aria-label="Main" className="container" style={{ padding: '10px 0 12px' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8, maxWidth: 260 }}>
            <li><Link href="/" className="small" style={navBtnStyle}>Home</Link></li>
            <li><Link href="/visas" className="small" style={navBtnStyle}>Visas</Link></li>
            <li><Link href="/about" className="small" style={navBtnStyle}>About</Link></li>
            <li><Link href="/policies" className="small" style={navBtnStyle}>Policies</Link></li>
            {!authed
              ? <li><Link href="/account" className="small" style={navBtnStyle}>Login</Link></li>
              : <li><button onClick={() => { setMenuOpen(false); doLogout(); }} className="small" style={{ ...navBtnStyle, width: '100%', textAlign: 'left' }}>Logout</button></li>}
          </ul>
        </nav>
      )}
    </header>
  );
}

const navBtnStyle = { padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, textDecoration: 'none', background: '#fff', display: 'block' };
const menuItemStyle = { padding: '8px 10px', borderRadius: 6, textDecoration: 'none', background: '#fff' };
