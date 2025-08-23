// app/dpa/page.jsx
export const metadata = {
  title: 'Data Processing Addendum | Liason',
  description: 'Information about how Liason processes customer data.',
};

export default function DpaPage() {
  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16}}>
        <h1 style={{fontSize:28, fontWeight:600, margin:0}}>Data Processing Addendum (DPA)</h1>
        <p className="small">
          Summary of how we handle and safeguard personal data supplied by customers.
        </p>

        <section className="card" style={{display:'grid', gap:8}}>
          <h2 style={{margin:0}}>Contact for Data Matters</h2>
          <div className="small">
            General support: <a href="mailto:helpdesk@liason.org">helpdesk@liason.org</a><br/>
            Billing inquiries: <a href="mailto:billing@liason.org">billing@liason.org</a>
          </div>
        </section>

        <section className="card" style={{display:'grid', gap:8}}>
          <h2 style={{margin:0}}>Purpose of Processing</h2>
          <div className="small">
            We process your uploads and answers solely to prepare your visa application materials and improve your experience.
          </div>
        </section>

        <section className="card" style={{display:'grid', gap:8}}>
          <h2 style={{margin:0}}>Data Sharing</h2>
          <div className="small">
            We do not sell personal data. Limited third-party processors (e.g., hosting, payment) are used under contract to provide the service.
          </div>
        </section>
      </div>
    </main>
  );
}
