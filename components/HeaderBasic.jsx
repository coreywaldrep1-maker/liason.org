'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// If these already exist in your project, great—this uses them.
// If not, you can temporarily comment them out.
import MenuDropdown from './MenuDropdown';
import LanguageSwitcher from './LanguageSwitcher';
import AuthIcon from './AuthIcon';

export default function HeaderBasic() {
  // purely to force client rendering (no SSR mismatch on center layout)
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white">
      <div className="mx-auto max-w-screen-2xl px-4">
        <div className="flex h-14 items-center justify-between gap-3">
          {/* LEFT: menu + language */}
          <div className="flex items-center gap-3">
            <MenuDropdown />
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
          </div>

          {/* CENTER: logo + brand (kept compact) */}
          <Link
            href="/"
            className="flex items-center gap-2 min-w-0 mx-auto"
            aria-label="Go to Liason home"
          >
            <img
              src="/logo.svg"
              alt="Liason logo"
              className="h-7 w-auto shrink-0 sm:h-8" /* smaller logo */
            />
            <span className="font-semibold tracking-tight truncate">
              Liason
            </span>
          </Link>

          {/* RIGHT: auth/profile icon */}
          <div className="flex items-center">
            <AuthIcon />
          </div>
        </div>
      </div>
    </header>
  );
}
