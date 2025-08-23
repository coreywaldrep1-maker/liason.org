// app/visas/us/page.jsx
import Hero from '../../../components/Hero';

export const metadata = {
  title: 'US Visas | Liason',
  description: 'Explore US visa categories supported by Liason.',
};

export default function USVisasPage() {
  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16}}>
        <Hero
          size="sm"
          image="/hero-us.jpg" // optional — if missing, it still looks fine; place file in /public
          title="United States — Visa pathways"
          subtitle="We’ll start you with K-1 (I-129F) and expand to family, work, and study categories."
          ctas={[
            { href: '/flow/us/i-129f', label: 'Start K-1 (I-129F)', primary: true },
            { href: '/checkout/us/i-129f', label: 'Checkout' }
          ]}
        />

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
