// Server component wrapper
export const metadata = { title: 'Start US I-129F | Liason' };
export const dynamic = 'force-dynamic'; // ensure runtime render

import I129fGate from './I129fGate';

export default function USI129FStart() {
  return (
    <main className="section">
      <div className="container" style={{ display: 'grid', gap: 16 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>Start: US / I-129F</h1>
        <p className="small">
          Guided fiancé(e) visa (K-1 / I-129F) preparation.
        </p>
        <I129fGate />
      </div>
    </main>
  );
}

