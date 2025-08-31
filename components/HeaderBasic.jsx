'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    // simple check: if token cookie exists (set by your login route)
    const has = document.cookie.includes('liason_token=');
    setAuthed(has);
  }, []);

  return (
    <header className="site-header" style={{borderBottom:'1px solid #e2e8f0', background:'#fff'}}>
      <div className="container" style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, padding:'10px 0'}}>
        {/* Left: Menu button */}
        <button
          aria-label="Menu"
          onClick={() => setOpen(v => !v)}
          className="small"
          style={{padding:'6px 10px', border:'1px solid #e2e8f0', borderRadius:8, background:'#fff'}}
        >
          ☰
        </button>

        {/* Center: Brand (logo + text) */}
        <Link href="/" className="brand" style={{display:'flex', alignItems:'center', gap:8, textDecoration:'none'}}>
          <img
            src="/newlogo.jpg"
            alt="Liason logo"
            width={28}
            height={28}
            style={{display:'block'}}
          />
          <span style={{fontWeight:700, fontSize:18, color:'#0f172a'}}>Liason</span>
        </Link>

        {/* Right: Auth */}
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          {authed ? (
            <Link href="/account" className="small" style={{padding:'6px 10px', border:'1px solid #e2e8f0', borderRadius:8, background:'#fff', textDecoration:'none'}}>
              Logged in
            </Link>
          ) : (
            <Link href="/account" className="small" style={{padding:'6px 10px', border:'1px solid #e2e8f0', borderRadius:8, background:'#fff', textDecoration:'none'}}>
              Login
            </Link>
          )}
        </div>
      </div>

      {/* Dropdown menu */}
      {open && (
        <nav aria-label="Main" className="container" style={{padding:'10px 0 12px'}}>
          <ul style={{listStyle:'none', padding:0, margin:0, display:'flex', gap:10}}>
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

const linkStyle = {padding:'6px 10px', border:'1px solid #e2e8f0', borderRadius:8, textDecoration:'none', background:'#fff'};
'use client';
import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';
import MenuDropdown from './MenuDropdown';

export default function HeaderBasic() {
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
