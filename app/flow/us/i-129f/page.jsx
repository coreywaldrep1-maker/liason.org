// app/flow/us/i-129f/page.jsx
import I129fGate from '@/components/I129fGate';
import I129fWizard from '@/components/I129fWizard';

export const dynamic = 'force-dynamic';

export default function I129fPage() {
  return (
    <main className="section" data-i18n-scan>
      <div className="container" style={{ display: 'grid', gap: 16 }}>
        <I129fGate>
          <I129fWizard />
          <p className="small" style={{ marginTop: 8 }}>
            Debug all fields: <a href="/flow/us/i-129f/all-fields">open</a>
          </p>
        </I129fGate>
      </div>
    </main>
  );
}
