// app/layout.jsx
import './globals.css';
import { cookies } from 'next/headers';
import { getDict } from '@/i18n/config';
import { I18nProvider } from '@/components/I18nProvider';
import SiteHeader from '@/components/SiteHeader';

export const metadata = {
  title: 'Liason',
  description: 'Streamlining the visa process to connect you to the world.',
};

export default function RootLayout({ children }) {
  const cookieStore = cookies();
  const locale = cookieStore.get('liason_lang')?.value || 'en';
  const dict = getDict(locale);

  return (
    <html lang={locale}>
      <body>
        <I18nProvider initialLocale={locale} dict={dict}>
          <SiteHeader />
          {children}
          <footer className="container small" style={{ padding: '24px 0', color: '#475569' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>&copy; {new Date().getFullYear()} Liason</div>
              <div>
                Billing: <a href="mailto:billing@liason.org">billing@liason.org</a> &nbsp;•&nbsp; Help:{' '}
                <a href="mailto:helpdesk@liason.org">helpdesk@liason.org</a>
              </div>
            </div>
          </footer>
        </I18nProvider>
      </body>
    </html>
  );
}
