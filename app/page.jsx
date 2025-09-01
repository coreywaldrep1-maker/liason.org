import Hero from '../components/Hero';
import { getLang } from '@/lib/i18n';
import { translate } from '@/lib/translate';

export const metadata = {
  title: 'Liason — Welcome',
  description: 'Streamlining the visa process to connect you to the world.',
};

// This is a Server Component (no "use client"), so we can call translate() here.
export default async function Home() {
  const lang = getLang();

  // Translate the strings you show on the page
  const title = await translate('Welcome to Liason', lang, 'home.hero.title');
  const subtitle = await translate(
    'Our mission is streamlining the visa process to connect you to the world. Start with the visa that best fits your situation.',
    lang,
    'home.hero.subtitle'
  );
  const cta = await translate('Explore visas', lang, 'home.hero.cta');
  const blurb = await translate(
    'Liason began after experiencing the stress of filing a fiancé(e) visa from afar. We built a guided tool so others don’t have to go through it alone.',
    lang,
    'home.blurb'
  );

  return (
    <main className="section">
      <div className="container" style={{ display: 'grid', gap: 16 }}>
        <Hero
          image="/hero.jpg"
          title={title}        // pass translated string
          subtitle={subtitle}  // pass translated string
          ctas={[{ href: '/visas', label: cta, primary: true }]} // translated CTA
        />
        <div className="card">
          <p>{blurb}</p>
        </div>
      </div>
    </main>
  );
}
