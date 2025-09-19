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

              {/* Language dropdown (auto-submits to your i18n endpoint) */}
              <form action="/api/i18n/set" method="GET" className="lang-select-form">
                <select
                  name="lang"
                  className="select"
                  aria-label="Language"
                  onChange={(e) => e.currentTarget.form?.submit()}
                  defaultValue="en"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="pt">Português</option>
                  <option value="it">Italiano</option>
                  <option value="zh">中文</option>
                  <option value="ja">日本語</option>
                  <option value="ko">한국어</option>
                  <option value="ar">العربية</option>
                  <option value="hi">हिन्दी</option>
                  <option value="vi">Tiếng Việt</option>
                  <option value="ru">Русский</option>
                </select>
              </form>
            </div>

            {/* CENTER: Brand */}
            <div className="header-center">
              <a href="/" className="brand">liason.org</a>
            </div>

            {/* RIGHT: Auth */}
            <div className="header-right">
              <a className="button secondary" href="/login">Login</a>
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
