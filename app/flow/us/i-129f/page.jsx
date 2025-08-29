import PaidGate from '../../../../components/PaidGate';
// If you have these components, leave the imports. If not, remove them.
// import Hero from '../../../../components/Hero';
import AiHelp from '../../../../components/AiHelp';
import I129fWizard from '../../../../components/I129fWizard';

export const metadata = {
  title: 'Start US I-129F | Liason',
  description: 'Guided fiancé(e) visa (K-1 / I-129F) preparation.',
};

export default function USI129FStart() {
  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16}}>
        {/* Only render content if the gate allows */}
        <PaidGate>
          <h1 style={{fontSize:28, fontWeight:600, margin:0}}>US / I-129F</h1>
          <p className="small">
            Upload your documents and answer a few questions. We’ll guide you with plain-language help for each section.
          </p>

          {/* Wizard */}
          <div className="card">
            <I129fWizard />
          </div>

          {/* AI helper */}
          <AiHelp section="i129f" context="I-129F flow page" />

          <div className="small" style={{opacity:0.7}}>
            Tip: If you need to re-lock this browser for testing, run
            <code> localStorage.removeItem('i129f_paid')</code> and clear the <code>i129f_paid</code> cookie.
          </div>
        </PaidGate>
      </div>
    </main>
  );
}
