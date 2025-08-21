export const metadata = {
  title: 'Start US I-129F | Liason',
  description: 'Guided fiancé(e) visa (K-1 / I-129F) preparation.',
};

export default function USI129FStart() {
  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16}}>
        <h1 style={{fontSize:28, fontWeight:600, margin:0}}>Start: US / I-129F</h1>
        <p className="small">Upload your documents and answer a few questions. We’ll guide you with plain-language help for each section.</p>

        {/* NOTE: removed onSubmit */}
        <form className="card" method="post" encType="multipart/form-data">
          <div style={{display:'grid', gap:12}}>
            <label className="small">Upload documents (PDF/JPG/PNG) — multiple allowed
              <br/>
              <input type="file" name="files" accept=".pdf,.png,.jpg,.jpeg" multiple />
            </label>
            <label className="small">Primary applicant full name
              <br/>
              <input type="text" name="fullname" placeholder="e.g., Maria Santos" style={{width:'100%', padding:8, border:'1px solid #e2e8f0', borderRadius:8}}/>
            </label>
            <label className="small">Short notes (optional)
              <br/>
              <textarea name="notes" rows={4} placeholder="Anything we should know?" style={{width:'100%', padding:8, border:'1px solid #e2e8f0', borderRadius:8}}/>
            </label>
            <div>
              <a href="/checkout/us/i-129f" className="btn btn-primary">Continue to checkout</a>
            </div>
          </div>
        </form>

        <div className="small">Price: $500 per profile • PayPal & cards</div>
      </div>
    </main>
  );
}
