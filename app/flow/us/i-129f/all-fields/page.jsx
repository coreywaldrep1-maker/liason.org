// app/flow/us/i-129f/all-fields/page.jsx
import { Suspense } from 'react';
import Link from 'next/link';
import AllFieldsClient from './AllFieldsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AllFieldsPage({ searchParams }) {
  const debugRaw = String(searchParams?.debug ?? '').toLowerCase();
  const enabled = debugRaw === '1' || debugRaw === 'true' || debugRaw === 'yes';

  // IMPORTANT: Do NOT redirect here (redirect can be finicky during prerender/exports).
  // Instead show a simple page unless explicitly enabled.
  if (!enabled) {
    return (
      <main className="section">
        <div className="container" style={{ display: 'grid', gap: 12 }}>
          <div className="card" style={{ display: 'grid', gap: 10 }}>
            <h1 style={{ margin: 0 }}>All fields (debug)</h1>
            <p className="small" style={{ margin: 0 }}>
              This page is a developer/debug tool and is disabled by default.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link className="btn btn-primary" href="/flow/us/i-129f">
                Back to I-129F Wizard
              </Link>
              <Link className="btn" href="/flow/us/i-129f/all-fields?debug=1">
                Enable debug view
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Enabled: render client component inside Suspense to satisfy Next.js build rules.
  return (
    <Suspense fallback={<main className="section"><div className="container"><div className="card">Loading…</div></div></main>}>
      <AllFieldsClient />
    </Suspense>
  );
}
