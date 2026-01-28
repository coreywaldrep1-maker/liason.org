// components/HeaderBasic.jsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import AuthWidget from './AuthWidget';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/flow/us/i-129f', label: 'I-129F Wizard' },
  { href: '/visas', label: 'Visas' },
  { href: '/visas/us', label: 'United States' },
  { href: '/visas/canada', label: 'Canada' },
  { href: '/visas/europe', label: 'Europe' },
  { href: '/about', label: 'About' },
  { href: '/policies', label: 'Policies' },
];

export default function HeaderBasic() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onEsc = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  // ~4x larger than the old 34px: target 136px (but clamp so mobile doesn't explode)
  const HEADER_H = 'clamp(84px, 10vw, 180px)';
  const LOGO_H = 'clamp(72px, 9vw, 136px)';

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white">
      <div className="mx-auto max-w-screen-2xl px-4">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: HEADER_H,
            position: 'relative',
            width: '100%',
            gap: 12,
          }}
        >
          {/* LEFT: menu + language */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setOpen((o) => !o)}
              style={{
                height: 36,
                width: 36,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                background: '#fff',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <LanguageSwitcher />
            </div>
          </div>

          {/* CENTER: logo + brand */}
          <Link
            href="/"
            aria-label="Go to homepage"
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              minWidth: 0,
              textDecoration: 'none',
              color: 'inherit',
              padding: '6px 0',
            }}
          >
            <img
              src="/logo.svg"
              alt="Liason logo"
              width={400}
              height={160}
              style={{
                height: LOGO_H,
                width: 'auto',
                maxWidth: 'min(520px, 55vw)',
                display: 'block',
              }}
            />
            <span className="truncate text-3xl font-semibold tracking-tight">Liason</span>
          </Link>

          {/* RIGHT: profile icon */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <AuthWidget />
          </div>
        </div>

        {/* DROPDOWN NAV */}
        {open && (
          <nav className="mt-2 border-t pt-2">
            <ul className="grid gap-1 sm:grid-cols-2">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded px-3 py-2 hover:bg-slate-50"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
