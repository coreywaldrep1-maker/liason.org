// app/flow/us/i-129f/page.jsx
import I129fGate from '@/components/I129fGate';
import I129fWizard from '@/components/I129fWizard';

export const dynamic = 'force-dynamic';

// Labels only (anchors are hidden, just used for in-page navigation)
const SECTION_LINKS = [
  { id: 'petitioner-info',            label: 'Petitioner Information' },
  { id: 'petitioner-address-work',    label: 'Petitioner Address & Employment' },
  { id: 'petitioner-parental-extra',  label: 'Petitioner Parental & Additional' },
  { id: 'beneficiary-info',           label: 'Beneficiary Information' },
  { id: 'beneficiary-address-work',   label: 'Beneficiary Address & Employment' },
  { id: 'beneficiary-parental-extra', label: 'Beneficiary Parental & Additional' },
  { id: 'relationship',               label: 'Relationship Details' },
  { id: 'evidence',                   label: 'Additional Evidence' },
  { id: 'review',                     label: 'Review & Submit' },
];

export default function I129fPage() {
  return (
    <main className="section" data-i18n-scan>
      <div className="container" style={{ display: 'grid', gap: 16 }}>

        {/* Tabs (labels only) */}
        <nav className="tabs" style={{ position: 'sticky', top: 8, zIndex: 20 }}>
          {SECTION_LINKS.map(({ id, label }) => (
            <a key={id} className="tab" href={`#${id}`} aria-label={label}>
              {label}
            </a>
          ))}
        </nav>

        <I129fGate>
          {/* Narrow, professional width only on this page */}
          <div className="form-width">
            {/* Optional: invisible anchors for smooth scrolling when a tab is clicked */}
            <div style={{ position: 'relative' }}>
              {SECTION_LINKS.map(({ id }) => (
                <span
                  key={id}
                  id={id}
                  style={{ position: 'absolute', top: '-96px' }}
                  aria-hidden="true"
                />
              ))}
            </div>

            <I129fWizard />
          </div>

          <p className="small" style={{ marginTop: 8 }}>
            Debug all fields: <a href="/flow/us/i-129f/all-fields">open</a>
          </p>
        </I129fGate>
      </div>

      {/* === Page-scoped styles (does NOT touch globals) === */}
      <style jsx>{`
        /* Tabs look — assumes your existing .tabs/.tab classes, this is just a light nudge */
        .tabs {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
          padding: 0.5rem;
          background: #ffffff;
          border: 1px solid rgba(2, 6, 23, 0.08);
          border-radius: 12px;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
        }
        .tab {
          color: #0f172a;
          text-decoration: none;
          font-weight: 600;
          padding: 0.5rem 0.7rem;
          border-radius: 10px;
          border: 1px solid transparent;
        }
        .tab:hover {
          background: #f5f7fb;
          border-color: rgba(2, 6, 23, 0.08);
        }

        /* Consolidated width only for this page */
        .form-width {
          max-width: 760px;   /* overall form container */
          margin-inline: auto;
        }

        /* Keep individual inputs tidy (desktop) */
        :global(.form-width input[type="text"]),
        :global(.form-width input[type="email"]),
        :global(.form-width input[type="tel"]),
        :global(.form-width input[type="number"]),
        :global(.form-width input[type="date"]),
        :global(.form-width input[type="password"]),
        :global(.form-width select),
        :global(.form-width textarea),
        :global(.form-width .input) {
          width: 100%;
          max-width: 560px;   /* consolidated field width */
        }

        :global(.form-width textarea) {
          max-width: 640px;   /* a bit wider for long text */
        }

        @media (max-width: 640px) {
          .form-width {
            max-width: 100%;
            padding-inline: 12px;
          }
          :global(.form-width input[type="text"]),
          :global(.form-width input[type="email"]),
          :global(.form-width input[type="tel"]),
          :global(.form-width input[type="number"]),
          :global(.form-width input[type="date"]),
          :global(.form-width input[type="password"]),
          :global(.form-width select),
          :global(.form-width textarea),
          :global(.form-width .input) {
            max-width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
