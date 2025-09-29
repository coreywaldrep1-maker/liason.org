// app/layout.jsx
import './globals.css';
import HeaderBasic from '@/components/HeaderBasic';
import FooterBasic from '@/components/FooterBasic';

// Works whether I18nProvider is a default export or a named export
import * as I18nModule from '@/components/I18nProvider';

// Stop Next from trying to prerender pages that touch cookies/headers
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'liason.org',
  description: 'K-1 / K-3 petition helper',
};

const I18n = I18nModule.default || I18nModule.I18nProvider || (({ children }) => <>{children}</>);

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <I18n>
          <HeaderBasic />
          <main style={{ maxWidth: 880, margin: '0 auto', padding: '16px' }}>
            {children}
          </main>
          <FooterBasic />
        </I18n>
      </body>
    </html>
  );
}
