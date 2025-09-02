'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/auth/me', { cache:'no-store' });
        if (!cancelled) setAuthed(r.ok);
      } catch {
        if (!cancelled) setAuthed(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function doLogout() {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
    window.location.href = '/';
  }

  return (
    <header className="site-header" style={{borderBottom:'1px solid #e2e8f0', background:'#fff'}}>
      <div className="container" style={{display:'grid', gridTemplateColumns:'auto 1fr auto', alignItems:'center', gap:12, padding:'12px 0'}}>
        {/* Left: Menu toggle */}
        <button
          aria-label="Menu"
          onClick={() => setOpen(v => !v)}
          className="small"
          style={{padding:'6px 10px', border:'1px solid #e2e8f0', borderRadius:8, background:'#fff'}}
        >
          ☰
        </button>

        {/* Center: Brand */}
        <div style={{justifySelf:'center'}}>
          <Link href="/" className="logo" aria-label="Liason home" style={{display:'inline-flex', alignItems:'center', gap:8, textDecoration:'none', color:'#0f172a'}}>
            <img src="/logo.svg" alt="Liason" width={24} height={24} style={{display:'block'}}/>
            <strong>Liason</strong>
          </Link>
        </div>

        {/* Right: Language + Account/Login */}
        <div style={{justifySelf:'end', display:'flex', alignItems:'center', gap:10}}>
          <LanguageSwitcher />
          <Link href="/account" className="btn" style={{padding:'6px 10px'}}>
            {authed ? 'Account' : 'Login'}
          </Link>
          <Link href="/account" aria-label="Account" style={{display:'inline-flex', alignItems:'center'}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="8" r="4" stroke="#0f172a" strokeWidth="1.8"/>
              <path d="M4 20c1.6-3.5 5-5.5 8-5.5S18.4 16.5 20 20" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </Link>
        </div>
      </div>

      {/* Vertical dropdown menu */}
      {open && (
        <nav aria-label="Main" className="container" style={{padding:'10px 0 12px'}}>
          <ul style={{listStyle:'none', padding:0, margin:0, display:'grid', gap:8}}>
            <li><Link href="/" className="small" style={linkStyle}>Home</Link></li>
            <li><Link href="/visas" className="small" style={linkStyle}>Visas</Link></li>
            <li><Link href="/about" className="small" style={linkStyle}>About</Link></li>
            <li><Link href="/policies" className="small" style={linkStyle}>Policies</Link></li>
            {!authed
              ? <li><Link href="/account" className="small" style={linkStyle}>Login</Link></li>
              : <li><button onClick={doLogout} className="small" style={{...linkStyle, background:'#fff', cursor:'pointer'}}>Logout</button></li>}
          </ul>
        </nav>
      )}
    </header>
  );
}

const linkStyle = {padding:'8px 12px', border:'1px solid #e2e8f0', borderRadius:8, textDecoration:'none', background:'#fff', textAlign:'left'};
