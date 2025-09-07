'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(document.cookie.includes('liason_token='));
  }, []);

  async function doLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    // force cookie re-check
    setAuthed(false);
    window.location.href = '/';
  }

  return (
    <header style={{borderBottom:'1px solid #e2e8f0', background:'#fff'}}>
      <div className="container" style={{display:'grid', gridTemplateColumns:'auto 1fr auto', alignItems:'center', gap:12, padding:'10px 0'}}>
        {/* Left: Menu + Language */}
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <button
            aria-label="Menu"
            onClick={() => setOpen(v => !v)}
            className="small"
            style={{padding:'6px 10px', border:'1px solid #e2e8f0', borderRadius:8, background:'#fff'}}
          >
            ☰
          </button>
          <LanguageSwitcher />
        </div>

        {/* Center: Brand */}
        <div style={{justifySelf:'center'}}>
          <Link href="/" style={{fontWeight:700, fontSize:18, textDecoration:'none', color:'#0f172a'}}>Liason</Link>
        </div>

        {/* Right: Account */}
        <div style={{justifySelf:'end', display:'flex', alignItems:'center', gap:8}}>
          {authed ? (
            <>
              <Link href="/account" className="small" style={{padding:'6px 10px', border:'1px solid #e2e8f0', borderRadius:8, background:'#fff', textDecoration:'none'}}>
                Account
              </Link>
              <button className="small" onClick={doLogout} style={{padding:'6px 10px', border:'1px solid #e2e8f0', borderRadius:8, background:'#fff'}}>
                Logout
              </button>
            </>
          ) : (
            <Link href="/account" className="small" style={{padding:'6px 10px', border:'1px solid #e2e8f0', borderRadius:8, background:'#fff', textDecoration:'none'}}>
              Login
            </Link>
          )}
        </div>
      </div>

      {/* Dropdown (vertical) */}
      {open && (
        <nav aria-label="Main" className="container" style={{padding:'8px 0 12px'}}>
          <ul style={{listStyle:'none', padding:0, margin:0, display:'grid', gap:8, maxWidth:220}}>
            <li><Link href="/" className="small" style={linkStyle}>Home</Link></li>
            <li><Link href="/visas" className="small" style={linkStyle}>Visas</Link></li>
            <li><Link href="/about" className="small" style={linkStyle}>About</Link></li>
            <li><Link href="/policies" className="small" style={linkStyle}>Policies</Link></li>
            {authed ? (
              <li><button onClick={doLogout} className="small" style={{...linkStyle, width:'100%'}}>Logout</button></li>
            ) : (
              <li><Link href="/account" className="small" style={linkStyle}>Login</Link></li>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}

const linkStyle = {padding:'8px 10px', border:'1px solid #e2e8f0', borderRadius:8, background:'#fff', textDecoration:'none', display:'block'};
