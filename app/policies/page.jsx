// app/policies/page.jsx
export const metadata = {
  title: 'Policies | Liason',
  description: 'Terms and privacy highlights for Liason.',
};

export default function PoliciesPage() {
  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16}}>
        <h1 style={{fontSize:28, fontWeight:600, margin:0}}>Policies</h1>
        <p className="small">Plain-language summary of how we operate.</p>

        <section className="card" style={{display:'grid', gap:8}}>
          <h2 style={{margin:0}}>Privacy & Data Use</h2>
          <div className="small">
            We only use the information you provide to help you prepare your application.
            We do <strong>not</strong> sell personal information to third parties.
          </div>
        </section>

        <section className="card" style={{display:'grid', gap:8}}>
          <h2 style={{margin:0}}>Not Legal Advice</h2>
          <div className="small">
            Liason is not a law firm and does not provide legal advice. For legal advice, consult a licensed attorney.
          </div>
        </section>

        <section className="card" style={{display:'grid', gap:8}}>
          <h2 style={{margin:0}}>How to reach us</h2>
          <div className="small">
            See the footer on any page for Support and Billing contact details.
          </div>
        </section>
      </div>
    </main>
  );
}
