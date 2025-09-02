// components/Hero.jsx
export default function Hero({ image = '/hero.jpg', title, subtitle, ctas = [] }) {
  return (
    <section
      className="card"
      style={{
        display: 'grid',
        gap: 12,
        backgroundImage: `url(${image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: 220,
        position: 'relative',
        color: '#0f172a'
      }}
    >
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          backdropFilter: 'blur(2px)',
          background: 'rgba(255,255,255,0.85)',
          borderRadius: 8,
          padding: 16
        }}
      >
        {title && <h1 style={{ margin: '0 0 6px' }}>{title}</h1>}
        {subtitle && <p style={{ margin: 0 }} className="small">{subtitle}</p>}

        {ctas.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ctas.map((c, i) => (
              <a
                key={i}
                href={c.href}
                className={`btn ${c.primary ? 'btn-primary' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                {c.label}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* subtle overlay for readability */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(0deg, rgba(255,255,255,0.9), rgba(255,255,255,0.35))',
          borderRadius: 8
        }}
      />
    </section>
  );
}
