"use client";

import Link from "next/link";
import { useState } from "react";

// If these paths differ in your repo, adjust the import paths:
import MenuDropdown from "./MenuDropdown";
import LanguageSwitcher from "./LanguageSwitcher";
import UserMenu from "./UserMenu"; // falls back to your existing auth menu

export default function HeaderBasic() {
  // (You might not need local state if MenuDropdown manages its own open/close)
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

          {/* Center: logo + brand */}
          <Link href="/" className="flex items-center gap-2 min-w-0 justify-self-center">
            <img
              src="/logo.svg"
              alt="Liason logo"
              className="logo-clamp block shrink-0"
            />
            <span className="truncate font-semibold tracking-tight">Liason</span>
          </Link>

          {/* Right: user icon/menu (sign in/out) */}
          <div className="flex items-center justify-self-end">
            <UserMenu />
            {/* If you don't have UserMenu, swap in your AuthButton:
               <AuthButton /> */}
          </div>
        </div>
      </div>
    </header>
  );
}
