// components/HeaderBasic.jsx
'use client';
import Link from 'next/link';
import UserMenu from './UserMenu';

export default function HeaderBasic() {
  return (
    <header className="border-b">
      <div className="mx-auto max-w-4xl w-full px-4 h-14 flex items-center gap-6">
        <Link href="/" className="font-semibold">Liaison</Link>
        <nav className="flex items-center gap-4">
          <Link href="/visas/us">United States</Link>
          <Link href="/visas/canada">Canada</Link>
          <Link href="/visas/europe">Europe</Link>
          <Link href="/about">About</Link>
        </nav>
        <UserMenu />
      </div>
    </header>
  );
}
