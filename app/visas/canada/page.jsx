export const metadata = { title: 'Canadian Visas | Liason' };
export default function CanadaVisas() {
  const visas = [
    { href:'#', title:'Express Entry (PR)', blurb:'Skilled worker pathways to permanent residence.' },
    { href:'#', title:'Study/Work permits', blurb:'Temporary work and education paths.' },
    { href:'#', title:'Family sponsorship', blurb:'Reunite with spouse/partner or family.' },
  ];
  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16}}>
        <h1 style={{margin:0}}>Canadian Visas</h1>
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
