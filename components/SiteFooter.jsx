// components/SiteFooter.jsx
export default function SiteFooter() {
  return (
    <footer
      style={{
        position: 'sticky',
        bottom: 0,
        zIndex: 30,
        background: '#ffffff',
        borderTop: '1px solid #e2e8f0'
      }}
    >
      <div className="container" style={{display:'grid', gap:8, padding:'12px 16px'}}>
        <div
          style={{
            display:'flex',
            flexWrap:'wrap',
            gap:12,
            alignItems:'center',
            justifyContent:'space-between'
          }}
        >
          <div className="small">
            Support: <a href="mailto:helpdesk@liason.org">helpdesk@liason.org</a>
            {' '}&nbsp;•&nbsp; Billing: <a href="mailto:billing@liason.org">billing@liason.org</a>
          </div>
          <div className="small" style={{color:'#64748b'}}>
            © {new Date().getFullYear()} Liason
          </div>
        </div>
      </div>
    </footer>
  );
}
