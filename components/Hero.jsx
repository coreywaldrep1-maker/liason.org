// components/Hero.jsx
export default function Hero({ image, title, subtitle, ctas = [] }) {
  return (
    <section className="card" style={{display:'grid', gap:12}}>
      {image && (
        <img
          src={image}
          alt=""
          style={{width:'100%', height:'auto', borderRadius:8}}
        />
      )}
      <h1 style={{margin:0}}>{title}</h1>
      {subtitle && <p style={{margin:'8px 0 0'}}>{subtitle}</p>}
      {ctas?.length > 0 && (
        <div style={{display:'flex', flexWrap:'wrap', gap:8, marginTop:8}}>
          {ctas.map((c) => (
            <a
              key={c.href + c.label}
              href={c.href}
              className={c.primary ? 'btn btn-primary' : 'btn'}
            >
              {c.label}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
