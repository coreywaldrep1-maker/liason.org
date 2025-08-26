export const metadata = { title: 'European Visas | Liason' };
export default function EuropeVisas() {
  const visas = [
    { href:'#', title:'Schengen short-stay', blurb:'Tourism and short business trips.' },
    { href:'#', title:'National long-stay (D)', blurb:'Study, work, family reunification options.' },
  ];
  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16}}>
        <h1 style={{margin:0}}>European Visas</h1>
        <p className="small">Choose the visa that best fits your situation.</p>
        <div style={{display:'grid', gap:12}}>
          {visas.map(v => (
            <a key={v.title} href={v.href} className="card" style={{display:'grid', gap:4}}>
              <strong>{v.title}</strong>
              <span className="small" style={{color:'#64748b'}}>{v.blurb}</span>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
