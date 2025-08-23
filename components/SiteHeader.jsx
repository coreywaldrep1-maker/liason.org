// components/SiteHeader.jsx
export default function SiteHeader() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0'
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px'
        }}
      >
        <a href="/" aria-label="Liason home" style={{display:'inline-flex', alignItems:'center', gap:8}}>
          {/* Simple text logo; replace with an <img> if you add a brand mark later */}
          <span style={{fontSize:20, fontWeight:700, letterSpacing:0.2}}>Liason</span>
        </a>
        {/* Right side can hold future nav/cta if needed */}
        <div style={{fontSize:12, color:'#64748b'}} />
      </div>
    </header>
  );
}
