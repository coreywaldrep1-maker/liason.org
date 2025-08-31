'use client';

import Link from 'next/link';

const linkStyle = { padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 8, textDecoration: 'none', background: '#fff' };

export default function MenuDropdown() {
  // simple inline menu (keeps header compact). Your dropdown logic can live here later.
  return (
    <nav aria-label="Inline menu" style={{ display: 'flex', gap: 10 }}>
      <Link href="/" className="small" style={linkStyle}>Home</Link>
      <Link href="/visas" className="small" style={linkStyle}>Visas</Link>
      <Link href="/about" className="small" style={linkStyle}>About</Link>
      <Link href="/policies" className="small" style={linkStyle}>Policies</Link>
    </nav>
  );
}
