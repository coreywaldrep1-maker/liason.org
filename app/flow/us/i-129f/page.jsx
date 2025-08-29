import Link from 'next/link';
import { cookies } from 'next/headers';
import Hero from '@/components/Hero';
import I129fWizard from '@/components/I129fWizard';
import AiHelp from '@/components/AiHelp';

export const metadata = {
  title: 'Start US I-129F | Liason',
  description: 'Guided fiancé(e) visa (K-1 / I-129F) preparation.',
};

// Render this page dynamically so we can check auth/paid at request-time
export const dynamic = 'force-dynamic';

// Try cookie first (set after PayPal), then fall back to an API check if you add one later.
async function isPaid() {
  const paidCookie = cookies().get('paid_i129f')?.value === '1';
  if (paidCookie) return true;

  // Optional fallback if you later add /api/payments/has-paid?product=i-129f
  try {
    const base =
      process.env.NEXT_PUBLIC_BASE_URL ||
      ''; // leave empty to let Next resolve relative fetch in prod
    const res = await fetch(`${base}/api/payments/has-paid?product=i-129f`, {
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data?.paid;
  } catch {
    return false;
  }
}

export default async function USI129FStart() {
  const paid = await isPaid();

  return (
    <main className="section">
      <div className="container" style={{ display: 'grid', gap: 16 }}>
        <Hero
          image="/hero.jpg"
          title="Fiancé(e) Visa, made human"
          subtitle={
            paid
              ? 'Your I-129F workspace is unlocked. Follow the guided steps, get help as you go, and download your completed PDF.'
              : 'Liason guides you through the K-1 / I-129F from start to finish—so you can focus on your relationship, not paperwork.'
          }
          ctas={
            paid
              ? []
              : [{ href: '/checkout/us/i-129f', label: 'Continue to checkout', primary: true }]
          }
        />

        {paid ? <PaidView /> : <PrePayLanding />}
      </div>
    </main>
  );
}

/** -------------------- PRE-PAY LANDING (locked) -------------------- **/
function PrePayLanding() {
  return (
    <div className="card" style={{ display: 'grid', gap: 16 }}>
      {/* Intro */}
      <div>
        <h2 style={{ margin: 0 }}>Fiancé(e) Visa, made human</h2>
        <p className="small" style={{ marginTop: 6 }}>
          Liason guides you through the K-1 / I-129F from start to finish—so you can
          focus on your relationship, not paperwork.
        </p>
      </div>

      {/* How it works */}
      <section style={{ display: 'grid', gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 18 }}>How it works — 3 easy steps</h3>
        <ol className="small" style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
          <li>
            <b>Upload your documents.</b> We securely parse your files to pre-fill as much
            of the I-129F as possible (names, dates, addresses, etc.).
          </li>
          <li>
            <b>Use our assistant.</b> Clear, plain-English guidance for any remaining
            questions, with examples and tips written for real people.
          </li>
          <li>
            <b>Download your packet.</b> Review your answers and download a clean,
            printable I-129F PDF with your info placed in the right fields.
          </li>
        </ol>
      </section>

      {/* What you get */}
      <section style={{ display: 'grid', gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 18 }}>What’s included</h3>
        <ul className="small" style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
          <li>Smart pre-fill from your uploads (PDF/JPG/PNG)</li>
          <li>Step-by-step guidance for each section of the I-129F</li>
          <li>Contextual help and explanations as you type</li>
          <li>Save and return—your progress stays with your account</li>
          <li>1-click download of your completed I-129F PDF</li>
          <li>
            Email support:{' '}
            <a href="mailto:helpdesk@liason.org">helpdesk@liason.org</a>
          </li>
        </ul>
      </section>

      {/* Why Liason */}
      <section style={{ display: 'grid', gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 18 }}>Why Liason</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
            <b>Human-centered guidance</b>
            <div className="small">Written to be clear, not confusing—no legal jargon.</div>
          </div>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
            <b>Built-in peace of mind</b>
            <div className="small">Automatic checks catch common mistakes before you print.</div>
          </div>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
            <b>Private & secure</b>
            <div className="small">Your files are encrypted in transit and at rest.</div>
          </div>
        </div>
      </section>

      {/* Price + CTA */}
      <section
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          borderTop: '1px solid #e2e8f0',
          paddingTop: 12,
        }}
      >
        <div className="small">
          <b>Price:</b> $500 per profile • PayPal & cards
          <br />
          <span className="small">
            Billing questions?{' '}
            <a href="mailto:billing@liason.org">billing@liason.org</a>
          </span>
        </div>
        <Link className="btn btn-primary" href="/checkout/us/i-129f">
          Continue to checkout
        </Link>
      </section>

      {/* FAQ */}
      <section style={{ display: 'grid', gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 18 }}>Common questions</h3>
        <details>
          <summary className="small">
            <b>Is this legal advice?</b>
          </summary>
          <div className="small">
            No—Liason provides helpful guidance and tools, but we aren’t a law firm and don’t offer legal advice.
          </div>
        </details>
        <details>
          <summary className="small">
            <b>Can I save and come back later?</b>
          </summary>
          <div className="small">
            Yes. Create an account or sign in, and your progress will be saved to your profile.
          </div>
        </details>
        <details>
          <summary className="small">
            <b>What happens after I pay?</b>
          </summary>
          <div className="small">
            Your I-129F workspace unlocks immediately—assistant guidance, editing, and PDF download become available.
          </div>
        </details>
        <details>
          <summary className="small">
            <b>Do you store my documents?</b>
          </summary>
          <div className="small">
            We store uploads securely so you can return anytime. You can request deletion by emailing{' '}
            <a href="mailto:helpdesk@liason.org">helpdesk@liason.org</a>.
          </div>
        </details>
      </section>
    </div>
  );
}

/** -------------------- POST-PAY WORKSPACE (unlocked) -------------------- **/
function PaidView() {
  return (
    <div className="card" style={{ display: 'grid', gap: 16 }}>
      <h2 style={{ margin: 0 }}>Start your I-129F</h2>
      <p className="small" style={{ marginTop: 6 }}>
        Follow the steps below. Use the assistant whenever you’re unsure. You can save and return anytime.
      </p>

      {/* Your multi-step wizard (client component) */}
      <I129fWizard />

      {/* AI help is visible only after payment */}
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
        <h3 style={{ margin: 0, fontSize: 18 }}>Need help?</h3>
        <p className="small" style={{ marginTop: 6 }}>
          Ask in plain English—our assistant explains what each field is asking and how people typically answer.
        </p>
        <AiHelp section="i129f" context="Form I-129F workspace" />
      </div>

      {/* Download button is visible only after payment */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <a href="/api/i129f" className="btn btn-primary">
          Download I-129F PDF
        </a>
      </div>
    </div>
  );
}
