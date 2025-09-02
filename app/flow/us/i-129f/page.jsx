// app/flow/us/i-129f/page.jsx
import I129fGate from '@/components/I129fGate';

export const metadata = { title: 'I-129F Guided Tool | Liason' };

export default function Page() {
  return (
    <main className="section">
      <div className="container" style={{ display: 'grid', gap: 16 }}>
        <h1 style={{ margin: 0 }}>I-129F Guided Tool</h1>
        <I129fGate />
      </div>
    </main>
  );
}
