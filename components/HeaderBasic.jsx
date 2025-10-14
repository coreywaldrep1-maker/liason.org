// components/HeaderBasic.jsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import AuthWidget from './AuthWidget';

const NAV = [
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

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white">
      <div className="mx-auto max-w-screen-2xl px-4">
        <div className="relative flex h-14 items-center justify-between gap-3">
          {/* LEFT: hamburger + language */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Open menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border hover:bg-slate-50"
              onClick={() => setOpen((o) => !o)}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <LanguageSwitcher />
          </div>

          {/* CENTER: logo + brand (hard size clamp) */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 flex min-w-0 items-center gap-2"
            aria-label="Go to homepage"
          >
            <img
              src="/logo.svg"
              alt="Liason logo"
              width={112}
              height={28}
              className="shrink-0"
              style={{ height: 28, width: 'auto', maxWidth: 160, display: 'block' }}
            />
            <span className="truncate font-semibold tracking-tight">Liason</span>
          </Link>

          {/* RIGHT: auth avatar/login */}
          <div className="flex items-center gap-2">
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
