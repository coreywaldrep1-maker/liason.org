// components/HeaderBasic.jsx
'use client';

import Link from 'next/link';
import AccountClient from '@/components/AccountClient';
import LanguageSwitcher from '@/components/LanguageSwitcher'; // assumes you already have this
import { useState } from 'react';

export default function HeaderBasic() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white">
      <div className="mx-auto max-w-screen-2xl px-4">
        <div className="flex h-14 items-center justify-between gap-3">
          {/* Left: hamburger + language switcher */}
          <div className="flex items-center gap-3">
            <button
              aria-label="Open menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border hover:bg-gray-50"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="sr-only">Open menu</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"
                viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"/>
              </svg>
            </button>

            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
          </div>

          {/* Center: logo + wordmark */}
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="Liason logo" className="h-6 w-6" />
            <span className="font-semibold tracking-tight">Liason</span>
          </Link>

          {/* Right: account */}
          <div className="flex items-center gap-3">
            <div className="sm:hidden">
              <LanguageSwitcher />
            </div>
            <AccountClient />
          </div>
        </div>

        {/* Simple dropdown menu panel */}
        {menuOpen && (
          <nav className="pb-3">
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <li><Link href="/visas/us" className="hover:underline">US Visas</Link></li>
              <li><Link href="/checkout" className="hover:underline">Checkout</Link></li>
              <li><Link href="/account" className="hover:underline">Account</Link></li>
              <li><Link href="/policies" className="hover:underline">Policies</Link></li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
