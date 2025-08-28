'use client';
import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';
import MenuDropdown from './MenuDropdown';

export default function SiteHeader() {
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
        {/* LEFT: Login + Account icon */}
        <div style={{justifySelf:'start', display:'flex', alignItems:'center', gap:10}}>
          <Link href="/account" className="btn" style={{padding:'6px 10px'}}>Login</Link>
          <Link href="/account" aria-label="Account" style={{display:'inline-flex', alignItems:'center'}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="8" r="4" stroke="#0f172a" strokeWidth="1.8"/>
              <path d="M4 20c1.6-3.5 5-5.5 8-5.5S18.4 16.5 20 20" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </Link>
        </div>

        {/* CENTER: Logo (home) */}
        <div style={{justifySelf:'center'}}>
          <Link
            href="/"
            className="logo"
            aria-label="Liason home"
            style={{fontWeight:700, fontSize:20, textDecoration:'none', color:'#0f172a'}}
          >
            Liason
          </Link>
        </div>

        {/* RIGHT: Menu dropdown + Language switcher */}
        <div style={{justifySelf:'end', display:'flex', alignItems:'center', gap:12}}>
          <MenuDropdown />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
