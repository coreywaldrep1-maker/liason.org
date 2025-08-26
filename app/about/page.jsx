export const metadata = { title: 'About | Liason' };

export default function About() {
  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16}}>
        <h1 style={{margin:0}}>About Liason</h1>
        <div className="card" style={{display:'grid', gap:8}}>
          <p>
            Liason started when one of us met their partner online, across borders. Navigating the K-1 fiancé(e) visa was confusing, stressful, and expensive.
            We built Liason so you can complete the process with clarity, guided help, and fewer costs.
          </p>
          <p>
            Our mission is simple: <strong>streamline the visa process to connect you to the world.</strong>
          </p>
        </div>
      </div>
    </main>
  );
}
