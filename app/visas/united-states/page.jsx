export const metadata = { title: 'United States Visas | Liason' };
export default function USVisas() {
  const visas = [
    { href:'/flow/us/i-129f', title:'Fiancé(e) (K-1 / I-129F)', blurb:'Bring your fiancé(e) to the U.S. to marry within 90 days.' },
    { href:'#', title:'Family (IR/CR/…)', blurb:'Spouse and immediate relative options.' },
    { href:'#', title:'Work (H-1B/L-1/O-1/…)', blurb:'Employer-sponsored and talent visas.' },
    { href:'#', title:'Study (F-1/J-1/M-1)', blurb:'Academic and exchange visitor visas.' },
  ];
  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16}}>
        <h1 style={{margin:0}}>United States Visas</h1>
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
