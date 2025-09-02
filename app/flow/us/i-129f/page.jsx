import I129fGate from '@/components/I129fGate';

export const metadata = { title: 'I-129F | Liason' };

export default function Page() {
  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16}}>
        <h1 style={{margin:0}}>United States — I-129F</h1>
        <I129fGate />
      </div>
    </main>
  );
}
