import Link from 'next/link'

export const metadata = { title: 'Visas | Liaison', description: 'Browse visa workflows.' }

export default function VisasPage() {
  return (
    <main>
      <section className="section">
        <div className="container" style={{display:'grid', gap:16}}>
          <h1 style={{fontSize:28, fontWeight:600}}>Browse visas</h1>
          <p className="text-slate-600">Start with a country and a visa type. Add documents, answer guided questions, export your packet.</p>

          <div className="grid grid-3">
            <div className="card">
              <h3 style={{marginTop:0}}>United States</h3>
              <ul className="small">
                <li>
                  Fiancé(e) visa (K-1 / I-129F) —{' '}
                  <Link href="/flow/us/i-129f" className="underline">Start</Link>
                  <span className="text-slate-500">|</span>{' '}
                  <Link href="/checkout/us/i-129f" className="underline">Checkout</Link>
                </li>
                <li>Family, work, study — coming soon</li>
              </ul>
            </div>

            <div className="card">
              <h3 style={{marginTop:0}}>Canada</h3>
              <p className="small">Planned: spousal sponsorship, study permit, work permit.</p>
            </div>

            <div className="card">
              <h3 style={{marginTop:0}}>Europe</h3>
              <p className="small">Planned: Schengen guidance; select country workflows.</p>
            </div>
          </div>

          <div style={{paddingTop:12}}>
            <Link href="/" className="btn btn-primary">Back to home</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
