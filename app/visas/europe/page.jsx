// app/visas/europe/page.jsx
export const metadata = {
  title: 'Europe Visas | Liason',
  description: 'Explore European visa categories supported by Liason.',
};

export default function EuropeVisasPage() {
  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16}}>
        <h1 style={{fontSize:28, fontWeight:600, margin:0}}>Europe Visas</h1>
        <p className="small">Categories are coming soon. Check back shortly.</p>

        <div className="card" style={{display:'grid', gap:8}}>
          <strong>What’s next?</strong>
          <p className="small">We’re adding guided flows for popular European routes with document upload and section help.</p>
          <a className="btn" href="/">Back to home</a>
        </div>
      </div>
    </main>
  );
}
