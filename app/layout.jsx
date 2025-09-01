import './globals.css';
import SiteHeader from '@/components/SiteHeader';

export const metadata = {
  title: 'Liason',
  description: 'Streamlining the visa process to connect you to the world.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
