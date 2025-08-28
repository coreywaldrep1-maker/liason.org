'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function MenuDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  useEffect(() => {
    function onEsc(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        className="btn"
        style={{ padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        Menu
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 10l5 5 5-5" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Main menu"
          style={{
            position: 'absolute',
            right: 0,
            top: '110%',
            minWidth: 200,
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            boxShadow: '0 6px 18px rgba(15,23,42,0.08)',
            padding: 8,
            zIndex: 50
          }}
        >
          {/* ORDER: Home, Visas, About, Policies */}
          <MenuItem href="/" label="Home" onPick={() => setOpen(false)} />
          <MenuItem href="/visas" label="Visas" onPick={() => setOpen(false)} />
          <MenuItem href="/about" label="About" onPick={() => setOpen(false)} />
          <MenuItem href="/policies" label="Policies" onPick={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

function MenuItem({ href, label, onPick }) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onPick}
      className="small"
      style={{
        display: 'block',
        padding: '10px 12px',
        borderRadius: 8,
        textDecoration: 'none',
        color: '#0f172a'
      }}
      onMouseEnter={(e)=> e.currentTarget.style.background='#f8fafc'}
      onMouseLeave={(e)=> e.currentTarget.style.background='transparent'}
    >
      {label}
    </Link>
  );
}
