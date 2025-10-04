import './globals.css';
import HeaderBasic from '../components/HeaderBasic';

export const metadata = {
  title: 'Liason',
  description: 'Liason – immigration made simpler',
  // Use the same logo for the browser tab icon
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900">
        <HeaderBasic />
        <main className="min-h-svh">{children}</main>
      </body>
    </html>
  );
}
