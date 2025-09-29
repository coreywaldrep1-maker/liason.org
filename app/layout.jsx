// app/layout.jsx
import './globals.css';
import I18nProvider from '@/components/I18nProvider';
import AutoTranslate from '@/components/AutoTranslate';
import HeaderBasic from '@/components/HeaderBasic';

export const metadata = {
  title: 'Liaison',
  description: 'Visa & immigration helper'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <I18nProvider initialLang="en">
          <AutoTranslate />
          <HeaderBasic />
          <main className="mx-auto max-w-4xl w-full px-4 py-6">
            {children}
          </main>
        </I18nProvider>
      </body>
    </html>
  );
}
