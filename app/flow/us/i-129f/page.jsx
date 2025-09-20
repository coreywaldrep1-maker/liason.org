// app/flow/us/i-129f/page.jsx
import I129fGate from '@/components/I129fGate';
import I129fWizard from '@/components/I129fWizard';

export const dynamic = 'force-dynamic';

/**
 * Map your existing anchor IDs to friendly labels.
 * If your form sections already have anchors like <div id="111" />, keep them here.
 * If an anchor name is different, just change the `id` value (label text can stay the same).
 */
const SECTION_LINKS = [
  { id: '111',    label: 'Petitioner Information' },
  { id: '222',    label: 'Petitioner Address & Employment' },
  { id: '333',    label: 'Petitioner Parental & Additional' },

  { id: '444',    label: 'Beneficiary Information' },
  { id: '555',    label: 'Beneficiary Address & Employment' },
  { id: '666',    label: 'Beneficiary Parental & Additional' },

  { id: '777',    label: 'Relationship Details' },
  { id: '888',    label: 'Additional Evidence' },
  { id: '999',    label: 'Review & Submit' },
];

export default function I129fPage() {
  return (
    <main className="section" data-i18n-scan>
      <div className="container" style={{ display: 'grid', gap: 16 }}>
        {/* Tabs bar — uses your existing .tabs/.tab styles, no new files, no JS */}
        <nav className="tabs" style={{ position: 'sticky', top: 8, zIndex: 20 }}>
          {SECTION_LINKS.map(({ id, label }) => (
            <a key={id} className="tab" href={`#${id}`} aria-label={label}>
              {label}
            </a>
          ))}
        </nav>

        <I129fGate>
          <I129fWizard />

          {/* tiny debug link (unchanged) */}
          <p className="small" style={{ marginTop: 8 }}>
            Debug all fields: <a href="/flow/us/i-129f/all-fields">open</a>
          </p>
        </I129fGate>
      </div>
    </main>
  );
}
