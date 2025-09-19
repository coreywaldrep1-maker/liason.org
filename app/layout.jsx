// app/layout.jsx
import "./globals.css";

export const metadata = {
  title: "liason.org",
  description: "Visa helper",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="shell header-bar">
            {/* LEFT: Menu + Language */}
            <div className="header-left">
              <details className="menu">
                <summary aria-label="Open menu" title="Menu">
                  <span className="menu-icon" />
                </summary>
                <nav className="menu-sheet">
                  <a href="/">Home</a>
                  <a href="/visas/us">United States</a>
                  <a href="/visas">Visas</a>
                  <a href="/checkout/us/i-129f">Checkout</a>
                  <a href="/about">About</a>
                  <a href="/policies">Policies</a>
                </nav>
              </details>

              <nav className="lang-switch" aria-label="Language">
                {/* Simple links to your existing /api/i18n/set endpoint */}
                <a href="/api/i18n/set?lang=en">EN</a>
                <a href="/api/i18n/set?lang=es">ES</a>
              </nav>
            </div>

            {/* CENTER: Brand */}
            <div className="header-center">
              <a href="/" className="brand">liason.org</a>
            </div>

            {/* RIGHT: Auth */}
            <div className="header-right">
              <a className="button secondary" href="/login">Login</a>
              {/* logout often requires POST — this form keeps it simple */}
              <form method="post" action="/api/auth/logout">
                <button type="submit" className="button">Logout</button>
              </form>
            </div>
          </div>
        </header>

        <main className="shell">
          {children}
        </main>

        <footer className="site-footer">
          <div className="shell footer-bar">
            <small>© {new Date().getFullYear()} liason.org</small>
            <div className="muted">Made for smooth filings</div>
          </div>
        </footer>
      </body>
    </html>
  );
}
