// components/Header.jsx
import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  return (
    <header className="w-full border-b bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/65">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        {/* Left: Menu + Language */}
        <nav className="flex items-center gap-3">
          {/* Replace with your dropdown menu component if you have one */}
          <Link href="/visas" className="text-sm font-medium hover:opacity-80">Visas</Link>
          <Link href="/policies" className="text-sm font-medium hover:opacity-80">Policies</Link>
          <LanguageSwitcher className="border rounded-md px-2 py-1 text-sm" />
        </nav>

        {/* Center: Brand */}
        <Link href="/" className="text-base md:text-lg font-semibold tracking-tight">
          liason.org
        </Link>

        {/* Right: Auth */}
        <nav className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium hover:opacity-80">Login</Link>
          <Link href="/signup" className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-semibold hover:bg-gray-50">
            Sign up
          </Link>
        </nav>
      </div>
    </header>
  );
}
