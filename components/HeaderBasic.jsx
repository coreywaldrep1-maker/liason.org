// components/HeaderBasic.jsx
"use client";

import Link from "next/link";
import { useState } from "react";

import MenuDropdown from "./MenuDropdown";
import LanguageSwitcher from "./LanguageSwitcher";
import UserMenu from "./UserMenu";

export default function HeaderBasic() {
  // kept in case you later want to control open/close state
  const [_menuOpen, _setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white">
      <div className="mx-auto max-w-screen-2xl px-4">
        {/* 3 columns: left tools, centered brand, right user */}
        <div className="grid h-14 grid-cols-[1fr_auto_1fr] items-center gap-3">
          {/* Left: dropdown + language */}
          <div className="flex items-center gap-3">
            <MenuDropdown />
            <LanguageSwitcher />
          </div>

          {/* Center: brand with /logo.svg from public/ */}
          <Link
            href="/"
            className="flex items-center gap-2 min-w-0 justify-self-center"
          >
            <img
              src="/logo.svg"
              alt="Liason logo"
              className="h-6 w-auto shrink-0"
            />
            <span className="truncate font-semibold tracking-tight">Liason</span>
          </Link>

          {/* Right: user icon/menu (handles sign in/out) */}
          <div className="flex items-center justify-self-end">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
