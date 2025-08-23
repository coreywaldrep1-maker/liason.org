// app/page.jsx
import Hero from '../components/Hero';

export const metadata = {
  title: 'Liason — Visa Prep',
  description: 'Guided, multilingual visa preparation with simple steps and plain-language help.',
};

export default function HomePage() {
  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16}}>
        <Hero
          image="/hero.jpg"  // <-- put your image in /public/hero.jpg
          title="Start your visa journey with confidence"
          subtitle="Simple steps, plain-language guidance, and a friendly helper—so you can focus on what matters: being together."
          ctas={[
            { href: '/flow/us/i-129f', label: 'Start K-1 (I-129F)', primary: true },
            { href: '/visas/us', label: 'Browse US Visas' }
          ]}
        />

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
            <a className="btn" href="/policies">Policies</a>
          </div>
        </div>
      </div>
    </main>
  );
}
