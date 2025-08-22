export const metadata = {
  title: 'Liaison — Helping you bring love home.',
  description: 'Affordable, multilingual visa preparation.',
};

export default function Home() {
  return (
    <main>
      <section className="section hero">
        <div className="container" style={{textAlign:'center', display:'grid', gap:16}}>
          <img src="/logo.svg" alt="Liaison" style={{height:48, margin:'0 auto'}}/>
          <h1 style={{fontSize:40, lineHeight:1.15, margin:0, fontWeight:800}}>We’re your liason to making memories.</h1>
          <p className="lead">Your journey together starts here. Simple, guided visa prep without the $10,000 price tag.</p>
          <div style={{display:'flex', gap:12, justifyContent:'center', marginTop:6}}>
            <a className="btn btn-primary" href="/visas">Get started</a>
            <a className="btn btn-ghost" href="/policies">Read our policies</a>
          </div>
          <div className="small">Secure • Multilingual • PayPal & cards • $500 per profile</div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid grid-3">
            <div className="card">
              <h3 style={{marginTop:0}}>Guided, step-by-step</h3>
              <p className="small">Plain-language questions mapped to each form section with checklists and upload tips.</p>
            </div>
            <div className="card">
              <h3 style={{marginTop:0}}>Your data, your control</h3>
              <p className="small">We don’t sell your data. Keep it locally, optionally encrypt with a passphrase, export when ready.</p>
            </div>
            <div className="card">
              <h3 style={{marginTop:0}}>Transparent pricing</h3>
              <p className="small">Flat $500 per profile via PayPal/credit card. No hidden fees, no subscriptions.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{paddingTop:0}}>
        <div className="container" style={{textAlign:'center'}}>
          <a className="btn btn-primary" href="/visas">Browse visas</a>
        </div>
      </section>
    </main>
  );
}
