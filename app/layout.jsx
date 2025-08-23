// app/layout.jsx
import './globals.css';
import SiteFooter from '../components/SiteFooter';

export const metadata = {
  title: 'Liason',
  description: 'Guided, multilingual visa prep with simple steps and plain-language help.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
