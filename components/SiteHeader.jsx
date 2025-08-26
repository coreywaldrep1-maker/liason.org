'use client';
import Link from 'next/link';

export default function SiteHeader() {
  return (
    <header className="site-header" style={{borderBottom:'1px solid #e2e8f0', background:'#fff'}}>
      <div className="container" style={{display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center', gap:12, padding:'12px 0'}}>
        {/* Left: Login button */}
        <div style={{justifySelf:'start'}}>
          <Link href="/account" className="btn" style={{padding:'6px 10px'}}>Login</Link>
        </div>

        {/* Center: Logo → home */}
        <div style={{justifySelf:'center'}}>
          <Link href="/" className="logo" aria-label="Liason home" style={{fontWeight:700, fontSize:20, textDecoration:'none', color:'#0f172a'}}>
            Liason
          </Link>
        </div>

        {/* Right: your existing menu links (adjust as you like) */}
        <nav style={{justifySelf:'end', display:'flex', gap:12}}>
          <Link href="/" className="small">Home</Link>
          <Link href="/visas" className="small">Visas</Link>
          <Link href="/about" className="small">About</Link>
          <Link href="/policies" className="small">Policies</Link>
        </nav>
      </div>
    </header>
  );
}
