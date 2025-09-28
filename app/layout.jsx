// app/layout.jsx
import './globals.css';
import HeaderBasic from '@/components/HeaderBasic';
import FooterBasic from '@/components/FooterBasic';
import I18nProvider from '@/components/I18nProvider';

export const metadata = { title: 'liason.org', description: 'K-1 / K-3 petition helper' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>
          <HeaderBasic />
          <main style={{maxWidth:880, margin:'0 auto', padding:'16px'}}>
            {children}
          </main>
          <FooterBasic />
        </I18nProvider>
      </body>
    </html>
  );
}
