// app/page.jsx
import Link from 'next/link';

export const metadata = {
  title: 'Welcome | Liason',
  description: 'We make the visa process clear, friendly, and stress-free.',
};

export default function Home() {
  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16}}>
        <section className="card" style={{display:'grid', gap:8}}>
          <h1 style={{margin:'0 0 4px'}}>Welcome</h1>
          <p style={{margin:0, lineHeight:1.6}}>
            We know how overwhelming visas can feel—forms, evidence, deadlines, and
            unclear instructions. Liason turns that stress into a guided, step-by-step
            experience: we pre-fill what we can, explain every field in plain language,
            and help you produce a clean, filing-ready packet. Your journey matters to us.
          </p>
          <div style={{marginTop:8}}>
            <Link href="/visas" className="btn btn-primary">Explore visas</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
