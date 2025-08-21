const PAYPAL_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

export const metadata = {
  title: 'Checkout — US I-129F | Liaison',
  description: 'Complete your purchase to unlock your Liaison profile.',
};

export default function USI129FCheckout() {
  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16}}>
        <h1 style={{fontSize:28, fontWeight:600, margin:0}}>Checkout</h1>
        <p className="small">Product: Liaison Visa Prep Profile — US / I-129F</p>
        <div className="card" style={{display:'grid', gap:12}}>
          {!PAYPAL_ID ? (
            <div>
              <p className="small"><strong>Payments are not yet configured.</strong></p>
              <ol className="small" style={{lineHeight:1.7}}>
                <li>In Vercel: Settings → Environment Variables</li>
                <li>Add <code>NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> with your LIVE client ID</li>
                <li>Redeploy and refresh this page</li>
              </ol>
            </div>
          ) : (
            <div>
              <p className="small">PayPal buttons would render here once your client ID is set. (Integration intentionally omitted to keep the starter bulletproof.)</p>
            </div>
          )}
        </div>
        <a href="/visas" className="btn btn-ghost">Back to visas</a>
      </div>
    </main>
  );
}
