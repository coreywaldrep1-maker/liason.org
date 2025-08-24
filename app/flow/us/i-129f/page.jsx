import Hero from '../../../../components/Hero';
import I129fWizard from '../../../../components/I129fWizard';

export const metadata = {
  title: 'Start US I-129F | Liason',
  description: 'Guided fiancé(e) visa (K-1 / I-129F) preparation.',
};

export default function USI129FStart() {
  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16}}>
        <Hero
          size="sm"
          image="/hero.jpg?v=4"
          title="Fiancé(e) visa (K-1 / I-129F)"
          subtitle="Upload-free to start—just answer what you can. We’ll generate a clean draft you can review before paying."
          ctas={[{ href:'/checkout/us/i-129f', label:'Checkout' }]}
        />
        <I129fWizard />
      </div>
    </main>
  );
}
