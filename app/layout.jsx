import './globals.css';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { I18nProvider } from '@/components/I18nProvider';
import LanguageSelect from '@/components/LanguageSelect';

export const metadata = {
  title: 'Liason',
  description: 'Streamlining the visa process to connect you to the world.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>
          {/* Top bar: menu + brand + auth are in SiteHeader; add language selector next to menu if you want */}
          <div style={{background:'#fff'}}>
            <div className="container" style={{display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:8}}>
              {/* Left spacer to align with header's menu button area */}
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <LanguageSelect />
              </div>
              <div style={{opacity:0}}>.</div>
            </div>
          </div>

          <SiteHeader />
          {children}
          <SiteFooter />
        </I18nProvider>
      </body>
    </html>
  );
}
