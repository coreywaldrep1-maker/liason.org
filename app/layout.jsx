import './globals.css';
import HeaderBasic from '../components/HeaderBasic';

export const metadata = {
  title: 'Liason',
  description: 'Liason – immigration made simpler',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* ✅ Make the entire site translatable */}
      <body className="min-h-screen bg-white text-slate-900" data-i18n-scan>
        <HeaderBasic />
        <main className="min-h-svh">{children}</main>
      </body>
    </html>
  );
}
