// app/flow/us/i-129f/page.jsx
import Link from 'next/link';

// If you already created this tabs component, keep it. Otherwise this inline one works.
function TabsBar({ current }) {
  const tabs = [
    { slug: '', label: 'Overview', href: '/flow/us/i-129f' },
    { slug: 'all-fields', label: 'ALL fields', href: '/flow/us/i-129f/all-fields' },
    { slug: 'checkout', label: 'Checkout', href: '/checkout/us/i-129f' },
  ];
  return (
    <nav className="tabs" aria-label="I-129F sections">
      {tabs.map(t => {
        const isActive =
          (current === 'overview' && t.slug === '') ||
          (current && t.slug && current === t.slug);
        return (
          <Link key={t.href} className={`tab${isActive ? ' active' : ''}`} href={t.href}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

export const metadata = {
  title: 'I-129F — Overview',
};

export default function I129FOverviewPage() {
  return (
    <main className="container" style={{padding: '1rem 0 2rem'}}>
      {/* Tabs on top */}
      <TabsBar current="overview" />

      {/* Heading */}
      <h1 style={{margin: '1rem 0 .25rem'}}>Petition for Alien Fiancé(e) (I-129F)</h1>
      <p className="muted" style={{marginBottom: '1rem'}}>
        Complete the sections below. You can switch to “ALL fields” if you prefer a single long form.
      </p>

      {/* FORM WRAPPER — prevents 100% width look on desktop */}
      <div className="form-width" style={{paddingBottom: '2rem'}}>
        {/* Replace the placeholder below with your real form component */}
        {/* Example: <I129FForm /> if you have it */}
        <section className="card" style={{padding: '1rem'}}>
          <h2 style={{marginBottom: '.5rem'}}>Part 1 — Petitioner</h2>

          {/* Example inputs (delete once you render your real fields) */}
          <div style={{display:'grid', gap: '1rem'}}>
            <div className="input-md">
              <label htmlFor="pt1_last">Family Name (Last)</label>
              <input id="pt1_last" type="text" className="input" placeholder="e.g., Doe" />
            </div>
            <div className="input-md">
              <label htmlFor="pt1_first">Given Name (First)</label>
              <input id="pt1_first" type="text" className="input" placeholder="e.g., John" />
            </div>
            <div className="input-md">
              <label htmlFor="pt1_middle">Middle Name</label>
              <input id="pt1_middle" type="text" className="input" placeholder="" />
            </div>
          </div>
        </section>

        {/* Add more sections or mount your real form here */}
      </div>
    </main>
  );
}
