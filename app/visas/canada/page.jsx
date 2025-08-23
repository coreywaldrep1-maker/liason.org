// app/visas/canada/page.jsx
export const metadata = {
  title: 'Canada Visas | Liason',
  description: 'Explore Canada visa categories supported by Liason.',
};

export default function CanadaVisasPage() {
  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16}}>
        <h1 style={{fontSize:28, fontWeight:600, margin:0}}>Canada Visas</h1>
        <p className="small">Categories are coming soon. Check back shortly.</p>

        <div className="card" style={{display:'grid', gap:8}}>
          <strong>What’s next?</strong>
          <p className="small">We’re expanding coverage for common Canadian pathways (family, work, study) with guided checklists.</p>
          <a className="btn" href="/">Back to home</a>
        </div>
      </div>
    </main>
  );
}
