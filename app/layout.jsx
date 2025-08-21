import './globals.css'
import HeaderBasic from '../components/HeaderBasic'
import FooterBasic from '../components/FooterBasic'

export const metadata = {
  title: 'Liaison — Helping you bring love home.',
  description: 'Affordable, multilingual visa preparation.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <HeaderBasic />
        {children}
        <FooterBasic />
      </body>
    </html>
  );
}