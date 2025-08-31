'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import MenuDropdown from './MenuDropdown';

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    // simple check: if token cookie exists (set by your login route)
    setAuthed(document.cookie.includes('liason_token='));
  }, []);

  const Brand = () => (
    <Link
      href="/"
      className="brand"
      aria-label="Liason home"
      style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
    >
      <img
        src="/logo.svg"
        alt="Liason logo"
        width={28}
        height={28}
        style={{ display: 'block' }}
      />
      <span style={{ fontWeight: 700, fontSize: 20, color: '#0f172a' }}>Liason</span>
    </Link>
  );

  return (
    <header className="site-header" style={{ borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
      <div
        className="container"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 12,
          padding: '10px 0',
        }}
      >
        {/* LEFT: Menu + Language */}
        <div style={{ justifySelf: 'start', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="small"
            style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}
          >
            ☰
          </button>
          <LanguageSwitcher />
        </div>

        {/* CENTER: Brand (logo + text) */}
        <div style={{ justifySelf: 'center' }}>
          <Brand />
        </div>

        {/* RIGHT: Inline menu + Login */}
        <div style={{ justifySelf: 'end', display: 'flex', alignItems: 'center', gap: 10 }}>
          <MenuDropdown />
          <Link
            href="/account"
            className="small"
            style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', textDecoration: 'none' }}
          >
            {authed ? 'Logged in' : 'Login'}
          </Link>
        </div>
      </div>

      {/* Dropdown (mobile/compact) */}
      {open && (
        <nav aria-label="Main" className="container" style={{ padding: '10px 0 12px' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', gap: 10 }}>
            <li><Link href="/" className="small" style={linkStyle}>Home</Link></li>
            <li><Link href="/visas" className="small" style={linkStyle}>Visas</Link></li>
            <li><Link href="/about" className="small" style={linkStyle}>About</Link></li>
            <li><Link href="/policies" className="small" style={linkStyle}>Policies</Link></li>
          </ul>
        </nav>
      )}
    </header>
  );
}

const linkStyle = { padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 8, textDecoration: 'none', background: '#fff' };
