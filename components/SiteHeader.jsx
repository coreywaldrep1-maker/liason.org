'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import MenuDropdown from './MenuDropdown';
import LanguageSwitcher from './LanguageSwitcher';

export default function SiteHeader() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(document.cookie.includes('liason_token='));
  }, []);

  return (
    <header className="site-header" style={{ borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
      <div
        className="container"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 12,
          padding: '12px 0',
        }}
      >
        {/* LEFT: Menu + Language */}
        <div style={{ justifySelf: 'start', display: 'flex', alignItems: 'center', gap: 10 }}>
          <MenuDropdown />
          <LanguageSwitcher />
        </div>

        {/* CENTER: Brand (logo + text) */}
        <div style={{ justifySelf: 'center' }}>
          <Link
            href="/"
            className="brand"
            aria-label="Liason home"
            style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
          >
            <img src="/logo.svg" alt="Liason logo" width={28} height={28} style={{ display: 'block' }} />
            <span style={{ fontWeight: 700, fontSize: 18, color: '#0f172a' }}>Liason</span>
          </Link>
        </div>

        {/* RIGHT: Login + account icon */}
        <div style={{ justifySelf: 'end', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/account" className="small" style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', textDecoration: 'none' }}>
            {authed ? 'Logged in' : 'Login'}
          </Link>
          <Link href="/account" aria-label="Account" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="8" r="4" stroke="#0f172a" strokeWidth="1.8" />
              <path d="M4 20c1.6-3.5 5-5.5 8-5.5S18.4 16.5 20 20" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
