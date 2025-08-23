// app/visas/us/page.jsx
export const metadata = {
  title: 'US Visas | Liason',
  description: 'Explore US visa categories supported by Liason.',
};

export default function USVisasPage() {
  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16}}>
        <h1 style={{fontSize:28, fontWeight:600, margin:0}}>US Visas</h1>
        <p className="small">Start with the fiancé(e) visa (K-1 / I-129F). More categories coming soon.</p>

        <div className="card" style={{display:'grid', gap:8}}>
          <strong>Fiancé(e) visa (K-1 / I-129F)</strong>
          <p className="small">Guided upload + plain-language help per section.</p>
          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            <a className="btn btn-primary" href="/flow/us/i-129f">Start</a>
            <a className="btn" href="/checkout/us/i-129f">Checkout</a>
          </div>
        </div>
      </div>
    </main>
  );
}
