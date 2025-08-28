// app/flow/us/i-129f/page.jsx
import I129fGate from '@/components/I129fGate';
import Hero from '@/components/Hero';
// If you already have these components wired, keep the imports:
import AiHelp from '@/components/AiHelp';
import I129fWizard from '@/components/I129fWizard';

export const metadata = {
  title: 'Start US I-129F | Liason',
  description: 'Guided fiancé(e) visa (K-1 / I-129F) preparation.',
};

function PrePayView() {
  return (
    <>
      <Hero
        image="/hero.jpg"
        title="How it works — in 3 simple steps"
        subtitle="Get it right the first time with guidance and clear instructions."
      />
      <div className="card" style={{display:'grid', gap:16}}>
        <div>
          <h3 style={{margin:'8px 0'}}>1) Upload your documents</h3>
          <p className="small">We read your files and pre-fill the I-129F draft where possible.</p>
        </div>
        <div>
          <h3 style={{margin:'8px 0'}}>2) Use our AI helper</h3>
          <p className="small">Plain-language help to finish anything missing. No legal advice—just friendly guidance.</p>
        </div>
        <div>
          <h3 style={{margin:'8px 0'}}>3) Download your pre-filled I-129F</h3>
          <p className="small">Review and print a clean, ready-to-file PDF.</p>
        </div>
        <div>
          <a href="/checkout/us/i-129f" className="btn btn-primary">Continue to checkout — $500</a>
        </div>
      </div>
    </>
  );
}

function PaidView() {
  return (
    <>
      {/* Real tool appears only after payment */}
      <div className="card" style={{display:'grid', gap:12}}>
        <h3 style={{marginTop:0}}>Your I-129F profile</h3>
        <p className="small">You’re paid. Let’s finish your packet.</p>

        {/* Wizard fields */}
        <I129fWizard />

        {/* AI helper for this section */}
        <AiHelp section="petitioner" context="I-129F preparation" />

        {/* Download button (your /api/i129f PDF route) */}
        <div>
          <a className="btn" href="/api/i129f?download=1">Download pre-filled I-129F (PDF)</a>
        </div>
      </div>
    </>
  );
}

export default function USI129FStart() {
  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16}}>
        <h1 style={{fontSize:28, fontWeight:600, margin:0}}>United States — I-129F (K-1)</h1>
        <p className="small" style={{marginTop:4}}>
          Start here. We’ll guide you through each part and keep your info secure.
        </p>

        <I129fGate PrePayView={PrePayView} PaidView={PaidView} />
      </div>
    </main>
  );
}
