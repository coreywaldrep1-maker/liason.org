// app/flow/us/i-129f/page.jsx
import Hero from '../../../components/Hero';
import I129fGate from '../../../components/I129fGate';

export const metadata = { title: 'I-129F — Liason' };

export default function Page() {
  return (
    <main className="section">
      <div className="container" style={{ display: 'grid', gap: 16 }}>
        <Hero
          image="/hero.jpg"
          title="I-129F (K-1/K-3) made simple"
          subtitle="Streamlined guidance to confidently prepare your petition."
          ctas={[]}
        />
        <I129fGate />
      </div>
    </main>
  );
}
