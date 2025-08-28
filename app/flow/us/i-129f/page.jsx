// app/flow/us/i-129f/page.jsx
import { cookies } from 'next/headers';
// If you already have AiHelp and a Wizard later, keep imports,
// but only render them when paid:
import AiHelp from '@/components/AiHelp'; // will be hidden when not paid
// import I129fWizard from '@/components/I129fWizard'; // when ready

export const metadata = {
  title: 'Start US I-129F | Liason',
  description: 'Guided fiancé(e) visa (K-1 / I-129F) preparation.'
};

export default function USI129FStart() {
  // Server-side check for the payment cookie set after successful capture
  const paid =
    (cookies().get('i129f_paid')?.value === 'true') ||
    (cookies().get('paid_i129f')?.value === 'true'); // support either name

  if (!paid) {
    // NOT PAID: Show the 3-step explainer + upload + checkout
    return (
      <main className="section">
        <div className="container" style={{display:'grid', gap:18}}>
          <h1 style={{fontSize:28, fontWeight:700, margin:0}}>How it works — in 3 easy steps</h1>

          <section className="card" style={{display:'grid', gap:16}}>
            <div style={{display:'grid', gap:10}}>
              <Step
                n="1"
                title="Upload your documents"
                text="Drag-and-drop PDFs or images of passports, birth certificates, prior marriage/divorce docs, and proof of relationship. We use these to pre-populate your I-129F."
              />
              <Step
                n="2"
                title="Use our AI helper"
                text="Ask questions in plain language and get guidance for any remaining fields. We’ll highlight anything that still needs attention."
              />
              <Step
                n="3"
                title="Review & download"
                text="When satisfied, download a ready-to-print I-129F with your info filled in. You’ll also get plain-English instructions for assembling your packet."
              />
            </div>

            {/* Simple intake for pre-population (no AI / no PDF until paid) */}
            <form className="card" method="post" encType="multipart/form-data" style={{border:'1px dashed #e2e8f0'}}>
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
              </div>
            </form>

            {/* Checkout CTA (AI + PDF hidden until paid) */}
            <div style={{display:'flex', gap:10, flexWrap:'wrap', justifyContent:'flex-end'}}>
              <a href="/checkout/us/i-129f" className="btn btn-primary">Continue to checkout — $500</a>
            </div>

            <div className="small" style={{opacity:0.8}}>
              After payment, you’ll unlock the AI helper and the downloadable pre-filled I-129F PDF.
            </div>
          </section>
        </div>
      </main>
    );
  }

  // PAID: Show the tool + (later) the wizard. PDF link appears once your generator route is hooked up.
  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16}}>
        <h1 style={{fontSize:28, fontWeight:700, margin:0}}>US / I-129F</h1>
        <div className="card" style={{display:'grid', gap:14}}>
          <div className="small" style={{opacity:0.9}}>
            Payment verified — you now have access to the AI helper and the final PDF export.
          </div>

          {/* AI helper (now visible) */}
          <AiHelp section="petitioner" context="Form: I-129F • Paid workspace" />

          {/* When your multi-step wizard is ready, render it here */}
          {/* <I129fWizard /> */}

          {/* Final PDF (hook this to your implemented route when ready) */}
          {/* Hide this link until your /api/i129f generator is wired to filled data */}
          <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
            <a
              href="/api/i129f?download=final"
              className="btn"
              style={{border:'1px solid #e2e8f0'}}
            >
              Download I-129F (PDF)
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

function Step({ n, title, text }) {
  return (
    <div style={{display:'grid', gap:6, gridTemplateColumns:'36px 1fr', alignItems:'start'}}>
      <span
        aria-hidden
        style={{
          width:36, height:36, borderRadius:10,
          background:'#0ea5e9', color:'#fff',
          display:'inline-grid', placeItems:'center',
          fontWeight:700
        }}
      >
        {n}
      </span>
      <div>
        <div style={{fontWeight:600}}>{title}</div>
        <div className="small" style={{opacity:0.9}}>{text}</div>
      </div>
    </div>
  );
}
