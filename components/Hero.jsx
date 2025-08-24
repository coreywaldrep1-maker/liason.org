// components/Hero.jsx
export default function Hero({
  title,
  subtitle = '',
  size = 'lg',
  image,
  ctas = [],
  overlay = 0.5,
}) {
  const minH = size === 'sm' ? 260 : 380;
  const bg = image
    ? `linear-gradient(rgba(15,23,42,${overlay}), rgba(15,23,42,${overlay})), url('${image}') center/cover no-repeat`
    : `linear-gradient(135deg, #eff6ff 0%, #fef2f2 100%)`;
  const darkText = !image;

  return (
    <section
      className="hero"
      style={{
        minHeight: minH,
        background: bg,
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        padding: 24,
        marginBottom: 16
      }}
    >
      <div className="container" style={{ width: '100%' }}>
        <div
          className="hero-inner"
          style={{
            maxWidth: 760,
            display: 'grid',
            gap: 12,
            color: darkText ? '#0f172a' : '#ffffff'
          }}
        >
          <div className="pill" style={{
            alignSelf: 'start',
            background: darkText ? '#ffffff' : 'rgba(255,255,255,.15)',
            color: darkText ? '#0f172a' : '#ffffff',
            border: darkText ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,.25)',
            borderRadius: 999,
            padding: '6px 10px',
            fontSize: 12,
            display: 'inline-flex',
            gap: 6
          }}>
            <span>💞</span> <span>Making memories. Bringing families together.</span>
          </div>

          <h1 style={{ margin: 0, fontSize: size === 'sm' ? 28 : 36, fontWeight: 700 }}>
            {title}
          </h1>

          {subtitle && (
            <p className="small" style={{ color: darkText ? '#475569' : 'rgba(255,255,255,.95)' }}>
              {subtitle}
            </p>
          )}

          {Array.isArray(ctas) && ctas.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              {ctas.map((c, i) => (
                <a
                  key={i}
                  href={c.href}
                  className={`btn ${c.primary ? 'btn-primary' : ''}`}
                  style={c.primary ? {} : { background: '#ffffff', borderColor: '#e2e8f0' }}
                >
                  {c.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
