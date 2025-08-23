// app/visas/canada/page.jsx
import Hero from '../../../components/Hero';

export const metadata = {
  title: 'Canada Visas | Liason',
  description: 'Explore Canada visa categories supported by Liason.',
};

export default function CanadaVisasPage() {
  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16}}>
        <Hero
          size="sm"
          image="/hero-canada.jpg" // optional — if missing, gradient fallback will show
          title="Canada — Coming soon"
          subtitle="We’re expanding coverage for common Canadian pathways (family, work, study) with guided checklists."
          ctas={[
            { href: '/', label: 'Back to Home' }
          ]}
        />

        <div className="card" style={{display:'grid', gap:8}}>
          <strong>What’s next?</strong>
          <p className="small">Stay tuned—guided flows with document upload and section help are on the way.</p>
        </div>
      </div>
    </main>
  );
}
