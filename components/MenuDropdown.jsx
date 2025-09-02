// components/MenuDropdown.jsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export default function MenuDropdown() {
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    setAuthed(document.cookie.includes('liason_token='));
  }, []);

  useEffect(() => {
    function onDocClick(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  async function doLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    window.location.href = '/';
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        aria-label="Menu"
        onClick={() => setOpen(v => !v)}
        className="small"
        style={{
          padding:'6px 10px',
          border:'1px solid #e2e8f0',
          borderRadius:8,
          background:'#fff',
          cursor:'pointer'
        }}
      >
        ☰
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position:'absolute',
            top:'120%',
            left:0,
            background:'#fff',
            border:'1px solid #e2e8f0',
            borderRadius:10,
            padding:10,
            minWidth:200,
            boxShadow:'0 6px 24px rgba(0,0,0,0.08)',
            display:'grid',
            gap:8,
            zIndex:50
          }}
        >
          <Link href="/" className="small" style={linkStyle}>Home</Link>
          <Link href="/visas" className="small" style={linkStyle}>Visas</Link>
          <Link href="/about" className="small" style={linkStyle}>About</Link>
          <Link href="/policies" className="small" style={linkStyle}>Policies</Link>

          {!authed ? (
            <Link href="/account" className="small" style={linkStyle}>Login</Link>
          ) : (
            <>
              <Link href="/account" className="small" style={linkStyle}>Profile & Settings</Link>
              <button
                onClick={doLogout}
                className="small"
                style={{ ...linkStyle, cursor:'pointer', textAlign:'left', background:'#fff' }}
              >
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const linkStyle = {
  display:'block',
  padding:'8px 10px',
  border:'1px solid #e2e8f0',
  borderRadius:8,
  textDecoration:'none',
  color:'#0f172a',
  background:'#fff'
};
