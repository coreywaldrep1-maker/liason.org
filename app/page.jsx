import Hero from '../components/Hero';

export const metadata = { title: 'Liason — Welcome', description: 'Streamlining the visa process to connect you to the world.' };

export default function Home() {
  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:16}}>
        <Hero
          image="/hero.jpg"
          title="Welcome to Liason"
          subtitle="Our mission is streamlining the visa process to connect you to the world. Start with the visa that best fits your situation."
          ctas={[{ href:'/visas', label:'Explore visas', primary:true }]}
        />
        <div className="card">
          <p>Liason began after experiencing the stress of filing a fiancé(e) visa from afar. We built a guided tool so others don’t have to go through it alone.</p>
        </div>
      </div>
    </main>
  );
}
