import ClientCheckout from './ClientCheckout';

export const metadata = { title: 'Checkout — I-129F | Liason' };

export default function CheckoutI129F() {
  return (
    <main className="section">
      <div className="container" style={{ display: 'grid', gap: 16 }}>
        <h1 style={{ margin: 0 }}>Checkout (temporarily disabled)</h1>
        <p className="small">
          We’re temporarily bypassing payment so you can continue testing. When you’re ready,
          we’ll re-enable secure checkout.
        </p>

        <ClientCheckout />

        <div className="small" style={{ opacity: 0.7 }}>
          Tip: If you ever need to “re-lock” this browser, clear this site’s storage or run
          <code> localStorage.removeItem('i129f_paid')</code> in the browser console.
        </div>
      </div>
    </main>
  );
}
