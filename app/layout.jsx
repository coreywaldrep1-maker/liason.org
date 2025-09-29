// app/layout.jsx
import './globals.css';
import I18nProvider from '@/components/I18nProvider';
import HeaderBasic from '@/components/HeaderBasic';

export const metadata = {
  title: 'liason',
  description: 'Visa prep made simple',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ background:'#fafafa', color:'#111827' }}>
        <I18nProvider>
          <HeaderBasic />
          <main style={{ maxWidth:'1100px', margin:'24px auto', padding:'0 16px' }}>
            {children}
          </main>
        </I18nProvider>
      </body>
    </html>
  );
}
