// app/page.jsx
import HomeMenu from '../components/HomeMenu';

export const metadata = {
  title: 'Liason — Visa Prep',
  description: 'Guided, multilingual visa preparation with simple steps and plain-language help.',
};

export default function HomePage() {
  return (
    <main className="section">
      {/* Floating menu button (top-left now) */}
      <HomeMenu />

      <div className="container" style={{display:'grid', gap:16}}>
        <h1 style={{fontSize:28, fontWeight:600, margin:0}}>Liason</h1>
        <p className="small">
          Guided, multilingual visa preparation. Start with the fiancé(e) visa (K-1 / I-129F), with more categories coming soon.
        </p>

        <div className="card" style={{display:'grid', gap:12}}>
          <strong>Fiancé(e) visa (K-1 / I-129F)</strong>
          <div className="small">Price: $500 per profile • PayPal & cards</div>
          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            <a className="btn btn-primary" href="/flow/us/i-129f">Start</a>
            <a className="btn" href="/checkout/us/i-129f">Checkout</a>
          </div>
        </div>

        <div className="card" style={{display:'grid', gap:8}}>
          <strong>Browse visas</strong>
          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            <a className="btn" href="/visas/us">US Visas</a>
            <a className="btn" href="/visas/canada">Canada Visas</a>
            <a className="btn" href="/visas/europe">Europe Visas</a>
            <a className="btn" href="/policies">Policies</a> {/* policies is its own page */}
          </div>
        </div>
      </div>
    </main>
  );
}
