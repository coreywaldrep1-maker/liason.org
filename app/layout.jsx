// app/layout.jsx (server component)
import './globals.css';
import SiteHeader from '@/components/SiteHeader';
import AutoTranslate from '@/components/AutoTranslate';
import { getServerLang } from '@/lib/i18n-server';

export const metadata = {
  title: 'Liason',
  description: 'Streamlining the visa process to connect you to the world.',
};

export default function RootLayout({ children }) {
  const lang = getServerLang(); // reads the cookie server-side
  return (
    <html lang={lang}>
      <body>
        <SiteHeader />
        <AutoTranslate />
        {children}
      </body>
    </html>
  );
}
