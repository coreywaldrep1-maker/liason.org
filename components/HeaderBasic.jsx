// ...imports unchanged

export default function HeaderBasic() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white">
      <div className="mx-auto max-w-screen-2xl px-4">
        <div className="flex h-14 items-center justify-between gap-3">
          {/* left cluster unchanged ... */}

          {/* Center: logo + brand (clamped size) */}
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <img
              src="/logo.svg"
              alt="Liason logo"
              className="logo-clamp block shrink-0"   // ⟵ clamp here
            />
            <span className="font-semibold tracking-tight truncate">
              Liason
            </span>
          </Link>

          {/* right cluster unchanged ... */}
        </div>

        {/* menu dropdown unchanged ... */}
      </div>
    </header>
  );
}
