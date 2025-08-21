import Link from 'next/link'

export const metadata = { title: 'Policies | Liaison', description: 'Terms, privacy, refunds, DMCA.' }

export default function PoliciesPage() {
  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:24}}>
        <h1 style={{fontSize:28, fontWeight:600}}>Policies</h1>

        <section className="card" style={{display:'grid', gap:8}}>
          <h2 style={{fontSize:18, fontWeight:600, margin:0}}>Terms of Use</h2>
          <p className="small">
            Liaison is an educational and document-prep assistant. We are not a law firm and do not provide legal advice.
            Always review official government instructions before filing.
          </p>
        </section>

        <section className="card" style={{display:'grid', gap:8}}>
          <h2 style={{fontSize:18, fontWeight:600, margin:0}}>Privacy</h2>
          <p className="small">
            Your answers and uploads are for your sole use and not sold to third parties. Client payment data is processed by PayPal.
          </p>
          <p className="small">
            Questions? Email <a className="underline" href="mailto:help@bridge-way.org">help@bridge-way.org</a>.
          </p>
        </section>

        <section className="card" style={{display:'grid', gap:8}}>
          <h2 style={{fontSize:18, fontWeight:600, margin:0}}>Refunds</h2>
          <p className="small">
            If you encounter a billing issue, contact <a className="underline" href="mailto:sales@bridge-way.org">sales@bridge-way.org</a>.
            Refunds are evaluated case-by-case for profiles with no successful download/export.
          </p>
        </section>

        <section className="card" style={{display:'grid', gap:8}}>
          <h2 style={{fontSize:18, fontWeight:600, margin:0}}>DMCA</h2>
          <p className="small">
            Copyright complaints: <a className="underline" href="mailto:help@bridge-way.org">help@bridge-way.org</a>.
          </p>
        </section>

        <div>
          <Link href="/" className="btn btn-primary">Back to home</Link>
        </div>
      </div>
    </main>
  )
}