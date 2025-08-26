export const metadata = { title: 'Visas | Liason' };

export default function Visas() {
  const cards = [
    { href:'/visas/united-states', title:'United States Visas', blurb:'Family, work, study, and more — pick what fits your case.' },
    { href:'/visas/europe',        title:'European Visas',     blurb:'Common permits and long-stay options.' },
    { href:'/visas/canada',        title:'Canadian Visas',     blurb:'Permanent residence pathways, study, work permits.' },
  ];
  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16}}>
        <h1 style={{margin:0}}>Choose a region</h1>
        <p className="small">Pick your region to see visa types and a short description for each.</p>
        <div style={{display:'grid', gap:12}}>
          {cards.map(c => (
            <a key={c.href} href={c.href} className="card" style={{display:'grid', gap:4}}>
              <strong>{c.title}</strong>
              <span className="small" style={{color:'#64748b'}}>{c.blurb}</span>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
