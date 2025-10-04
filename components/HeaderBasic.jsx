'use client';

import { useState } from 'react';
import Link from 'next/link';

// These already exist in your repo per earlier file list
import MenuDropdown from '../components/MenuDropdown';
import LanguageSwitcher from '../components/LanguageSwitcher';
import UserMenu from '../components/UserMenu';

export default function HeaderBasic() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white">
      <div className="mx-auto max-w-screen-2xl px-4">
        {/* 3-column grid keeps the brand perfectly centered */}
        <div className="grid h-14 grid-cols-[auto_1fr_auto] items-center gap-3">
          {/* Left: menu + language switcher */}
          <div className="flex items-center gap-2">
            <MenuDropdown open={menuOpen} setOpen={setMenuOpen} />
            <LanguageSwitcher />
          </div>

          {/* Center: logo + brand */}
          <div className="flex items-center justify-center">
            <Link href="/" className="flex items-center gap-2 min-w-0">
              <img
                src="/logo.svg"
                alt="Liason logo"
                className="block h-7 w-auto shrink-0"
              />
              <span className="font-semibold tracking-tight truncate">
                Liason
              </span>
            </Link>
          </div>

          {/* Right: user icon (handles login/logout inside) */}
          <div className="flex items-center justify-end">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
