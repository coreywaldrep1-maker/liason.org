// components/HeaderBasic.jsx
'use client';

import Link from 'next/link';
import UserMenu from './UserMenu';
import LanguageSwitcher from './LanguageSwitcher';

export default function HeaderBasic() {
  return (
    <header style={{borderBottom:'1px solid #e5e7eb', background:'#fff'}}>
      <div style={{maxWidth:1100, margin:'0 auto', padding:'10px 16px', display:'flex', alignItems:'center', gap:12, justifyContent:'space-between'}}>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <Link href="/" className="small" style={{fontWeight:700}}>liason.org</Link>
          <nav className="small" style={{display:'flex', gap:10}}>
            <Link href="/i129f">I-129F</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/help">Help</Link>
          </nav>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <LanguageSwitcher />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
