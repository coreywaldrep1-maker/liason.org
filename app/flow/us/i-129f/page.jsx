import PaidGate from '../../../../components/PaidGate';
import I129fWizard from '../../../../components/I129fWizard';
// NOTE: We intentionally do NOT import or render <AiHelp /> here
// to avoid duplicates. The wizard will include it once.

export const metadata = {
  title: 'Start US I-129F | Liason',
  description: 'Guided fiancé(e) visa (K-1 / I-129F) preparation.',
};

export default function USI129FStart() {
  return (
    <main className="section">
      <div className="container" style={{ display: 'grid', gap: 16 }}>
        <PaidGate>
          <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>US / I-129F Tool</h1>
          <p className="small">
            Upload documents, answer guided questions, and download your draft I-129F packet.
          </p>

          {/* Single source of truth: Wizard renders the AI panel once inside itself */}
          <I129fWizard />

          <div className="small" style={{ opacity: 0.7 }}>
            Test mode tip: to re-lock this browser, clear the <code>i129f_paid</code> cookie and
            run <code>localStorage.removeItem('i129f_paid')</code>.
          </div>
        </PaidGate>
      </div>
    </main>
  );
}
