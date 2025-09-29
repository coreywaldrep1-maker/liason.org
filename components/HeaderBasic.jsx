// components/HeaderBasic.jsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LanguageSwitcher from './LanguageSwitcher';
import AccountClient from './AccountClient';

export default function HeaderBasic() {
  const pathname = usePathname();

  return (
    <header style={{
      position:'sticky', top:0, zIndex:50, background:'#fff',
      borderBottom:'1px solid #e5e7eb'
    }}>
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '10px 16px',
        display:'grid',
        gridTemplateColumns:'auto auto 1fr auto',
        gap:12,
        alignItems:'center'
      }}>
        {/* Far left: menu dropdown */}
        <DetailsMenu />

        {/* Right of menu: language switcher */}
        <div style={{minWidth:120}}>
          <LanguageSwitcher />
        </div>

        {/* Center: logo + name */}
        <div style={{textAlign:'center'}}>
          <Link href="/" style={{textDecoration:'none', color:'inherit'}} data-no-translate="true" translate="no">
            <div style={{fontWeight:700, fontSize:18, letterSpacing:0.2}}>liason</div>
          </Link>
        </div>

        {/* Far right: login/logout/profile */}
        <div style={{justifySelf:'end'}}>
          <AccountClient />
        </div>
      </div>

      {/* Secondary nav */}
      <nav style={{borderTop:'1px solid #f1f5f9'}}>
        <div style={{
          maxWidth:'1100px', margin:'0 auto', padding:'6px 16px',
          display:'flex', gap:16, flexWrap:'wrap'
        }}>
          <NavLink href="/" active={pathname === '/'}>Home</NavLink>
          <NavLink href="/flow/us/i-129f" active={pathname?.startsWith('/flow/us/i-129f')}>I-129F</NavLink>
          <NavLink href="/checkout/us/i-129f" active={pathname?.startsWith('/checkout')}>Checkout</NavLink>
          <NavLink href="/account" active={pathname?.startsWith('/account')}>Account</NavLink>
        </div>
      </nav>
    </header>
  );
}

function NavLink({ href, active, children }) {
  return (
    <Link
      href={href}
      style={{
        padding:'6px 10px',
        borderRadius:8,
        textDecoration:'none',
        background: active ? '#eef2ff' : 'transparent',
        color:'#111827'
      }}
      data-no-translate="true"
      translate="no"
    >
      {children}
    </Link>
  );
}

function DetailsMenu() {
  return (
    <details style={{position:'relative'}}>
      <summary
        style={{
          listStyle:'none', cursor:'pointer',
          padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:8
        }}
        data-no-translate="true"
        translate="no"
      >
        ☰ Menu
      </summary>
      <div
        style={{
          position:'absolute', top:'calc(100% + 6px)', left:0,
          background:'#fff', border:'1px solid #e5e7eb', borderRadius:8,
          minWidth:200, boxShadow:'0 8px 24px rgba(0,0,0,.08)', padding:8
        }}
      >
        <MenuLink href="/">Home</MenuLink>
        <MenuLink href="/flow/us/i-129f">I-129F Wizard</MenuLink>
        <MenuLink href="/flow/us/i-129f/all-fields">All Fields (debug)</MenuLink>
        <MenuLink href="/checkout/us/i-129f">Checkout</MenuLink>
        <MenuLink href="/account">Account</MenuLink>
      </div>
    </details>
  );
}

function MenuLink({ href, children }) {
  return (
    <Link
      href={href}
      style={{display:'block', padding:'8px 10px', borderRadius:6, textDecoration:'none', color:'#111827'}}
      data-no-translate="true"
      translate="no"
    >
      {children}
    </Link>
  );
}
