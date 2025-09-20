// app/flow/us/i-129f/page.jsx
import I129fGate from '@/components/I129fGate';
import I129fWizard from '@/components/I129fWizard';

export const dynamic = 'force-dynamic';

// Labels only (anchors are hidden; used for in-page navigation)
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

        {/* Tabs (labels only) — uses your existing .tabs/.tab styles */}
        <nav className="tabs" style={{ position: 'sticky', top: 8, zIndex: 20 }}>
          {SECTION_LINKS.map(({ id, label }) => (
            <a key={id} className="tab" href={`#${id}`} aria-label={label}>
              {label}
            </a>
          ))}
        </nav>

        <I129fGate>
          {/* Narrow, professional width using your existing .form-width class */}
          <div className="form-width">
            {/* Invisible anchors for smooth scrolling when a tab is clicked */}
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
    </main>
  );
}
