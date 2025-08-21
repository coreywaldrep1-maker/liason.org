export default function HeaderBasic() {
  return (
    <header style={{background:'#fff',borderBottom:'1px solid #e2e8f0', position:'sticky', top:0, zIndex:50}}>
      <div className="container" style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0'}}>
        <a href="/" style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none',color:'inherit'}}>
          <img src="/logo.svg" alt="Liaison" height={32}/>
        </a>
        <nav style={{display:'flex',gap:18,fontSize:14}}>
          <a href="/visas">Visas</a>
          <a href="/policies">Policies</a>
          <a href="/dpa">DPA</a>
        </nav>
      </div>
    </header>
  );
}