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
          <div className="shell">
            <a href="/" className="brand">liason.org</a>
          </div>
        </header>

        <main className="shell">
          {children}
        </main>

        <footer className="site-footer">
          <div className="shell">
            <small>© {new Date().getFullYear()} liason.org</small>
          </div>
        </footer>
      </body>
    </html>
  );
}
