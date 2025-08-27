import Link from 'next/link';

export default function HomeMenu() {
  return (
    <nav
      aria-label="Home menu"
      className="container"
      style={{display:'flex', justifyContent:'center', gap:12, marginTop:16}}
    >
      <Link
        href="/visas"
        className="small"
        style={{padding:'8px 12px', border:'1px solid #e2e8f0', borderRadius:8}}
      >
        Visas
      </Link>
    </nav>
  );
}
