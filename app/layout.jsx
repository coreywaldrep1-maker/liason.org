// app/layout.jsx
import './globals.css';
import SiteHeader from '../components/SiteHeader';
import HomeMenu from '../components/HomeMenu';
import SiteFooter from '../components/SiteFooter';

export const metadata = {
  title: 'Liason',
  description: 'Guided, multilingual visa prep with simple steps and plain-language help.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {/* Floating menu appears on every page, left side */}
        <HomeMenu />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
