// app/flow/us/i-129f/page.jsx
import Hero from '@/components/Hero';
import I129fGate from '@/components/I129fGate';

export const metadata = { title: 'I-129F — Guided Tool | Liason' };

export default function I129fFlowPage() {
  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16}}>
        <Hero
          image="/hero.jpg"
          title="How it works — 3 easy steps"
          subtitle="1) Upload your documents to pre-fill the I-129F • 2) Use our assistant for any remaining fields • 3) Download your completed I-129F PDF."
          ctas={[{ href: '/checkout/us/i-129f', label: 'Continue to checkout', primary: true }]}
        />

        <I129fGate>
          {/* This is shown only when paid = true */}
          <div className="card">
            <h2 style={{marginTop:0}}>Start your I-129F</h2>
            <p>Welcome back! Your guided form and PDF download are ready below.</p>
            {/* TODO: mount your actual wizard here */}
          </div>
        </I129fGate>
      </div>
    </main>
  );
}
