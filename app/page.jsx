export const metadata = { title: 'Liason — Welcome' };

export default function HomePage() {
  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16}}>
        {/* Hero / intro */}
        <section className="card" style={{padding:20, display:'grid', gap:10}}>
          <h1 style={{margin:0}}>Making memories. Bringing people together.</h1>
          <p className="small">
            Liason streamlines complex visa prep with clear guidance, secure document handling, and
            helpful tools—so you can focus on the people who matter.
          </p>
          <div>
            <a href="/visas" className="btn btn-primary">Explore visas</a>
          </div>
        </section>

        {/* Add any other home sections here */}
      </div>
    </main>
  );
}
