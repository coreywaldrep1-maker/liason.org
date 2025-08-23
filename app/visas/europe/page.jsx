// app/visas/europe/page.jsx
import Hero from '../../../components/Hero';

export const metadata = {
  title: 'Europe Visas | Liason',
  description: 'Explore European visa categories supported by Liason.',
};

export default function EuropeVisasPage() {
  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16}}>
        <Hero
          size="sm"
          image="/hero-europe.jpg" // optional — if missing, gradient fallback will show
          title="Europe — Coming soon"
          subtitle="Popular European routes with plain-language guidance and upload help."
          ctas={[
            { href: '/', label: 'Back to Home' }
          ]}
        />

        <div className="card" style={{display:'grid', gap:8}}>
          <strong>What’s next?</strong>
          <p className="small">More categories with step-by-step wizards are in progress.</p>
        </div>
      </div>
    </main>
  );
}
