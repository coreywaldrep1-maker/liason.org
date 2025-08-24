'use client';
import PayButtons from '../../../components/PayButtons';
import Hero from '../../../components/Hero';

export default function CheckoutI129F() {
  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16}}>
        <Hero
          size="sm"
          title="Checkout — K-1 (I-129F)"
          subtitle="Pay securely with PayPal or credit card. You’ll be sent back to your wizard with access marked as paid."
        />

        <div className="card" style={{display:'grid', gap:12}}>
          <div style={{display:'flex', justifyContent:'space-between'}}>
            <strong>Liason — Visa Prep Profile</strong>
            <strong>$500.00</strong>
          </div>
          <div className="small" style={{color:'#64748b'}}>
            Includes: guided answers, AI help in multiple languages, draft PDF, and a pre-submission checklist.
          </div>
          <PayButtons
            amount={500}
            description="Liason — Visa Prep Profile (I-129F)"
            onSuccess={() => { window.location.href = '/flow/us/i-129f?paid=1'; }}
          />
        </div>

        <div className="small" style={{color:'#64748b'}}>
          Not legal advice. For legal advice, consult a licensed attorney.
        </div>
      </div>
    </main>
  );
}
