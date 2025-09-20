// app/flow/us/i-129f/page.jsx
import { t } from '@/lib/i18n-ssr';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function I129FTabs() {
  const tabs = [
    { href: '/flow/us/i-129f', label: 'Overview' },
    { href: '/flow/us/i-129f/all-fields', label: 'All fields' },
    { href: '/checkout/us/i-129f', label: 'Checkout' },
  ];
  return (
    <div className="mb-6 flex items-center gap-1 overflow-x-auto">
      {tabs.map(tab => (
        <Link key={tab.href} href={tab.href}
          className="px-3 py-2 text-sm font-medium border-b-2 border-transparent hover:border-black/40 hover:text-black">
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

export default async function I129FPage() {
  const [title, subtitle] = await Promise.all([
    t('Fiancé(e) Visa (Form I-129F)'),
    t('Fill out the form below. You can save progress anytime.'),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-gray-600 mt-1 mb-6">{subtitle}</p>

      <I129FTabs />

      <div className="card p-6">
        <form className="form-wrap">
          {/* Example fields with controlled width on desktop */}
          <div className="field-span-6">
            <label className="block text-sm font-medium mb-1">{await t('First name')}</label>
            <input type="text" className="input" name="petitioner.firstName" />
          </div>

          <div className="field-span-6">
            <label className="block text-sm font-medium mb-1">{await t('Last name')}</label>
            <input type="text" className="input" name="petitioner.lastName" />
          </div>

          {/* …your existing fields… */}

          <div className="field-span-12 mt-4">
            <button type="submit" className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-semibold hover:bg-gray-50">
              {await t('Save Progress')}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
