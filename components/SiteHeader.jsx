// components/SiteHeader.jsx
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
    <header className="site-header" style={{borderBottom:'1px solid #e2e8f0', background:'#fff'}}>
      <div
        className="container"
        style={{
          display:'grid',
          gridTemplateColumns:'1fr auto 1fr',
          alignItems:'center',
          gap:12,
          padding:'12px 0'
        }}
      >
        {/* LEFT: Menu + Language */}
        <div style={{justifySelf:'start', display:'flex', alignItems:'center', gap:10}}>
          <MenuDropdown />
          <LanguageSwitcher />
        </div>

        {/* CENTER: Brand (logo + text) */}
        <Link href="/" className="brand" style={{display:'flex', alignItems:'center', gap:8, textDecoration:'none', justifySelf:'center'}}>
          <img
            src="/logo.svg"
            alt="Liason logo"
            width={24}
            height={24}
            style={{display:'block'}}
          />
          <span style={{fontWeight:700, fontSize:18, color:'#0f172a'}}>Liason</span>
        </Link>

        {/* RIGHT: Auth (Login/Profile + person icon) */}
        <div style={{justifySelf:'end'}}>
          <Link
            href="/account"
            className="small"
            style={{
              display:'inline-flex',
              alignItems:'center',
              gap:8,
              padding:'6px 10px',
              border:'1px solid #e2e8f0',
              borderRadius:8,
              background:'#fff',
              textDecoration:'none'
            }}
          >
            <span>{authed ? 'Profile' : 'Login'}</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="8" r="4" stroke="#0f172a" strokeWidth="1.8"/>
              <path d="M4 20c1.6-3.5 5-5.5 8-5.5S18.4 16.5 20 20" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
