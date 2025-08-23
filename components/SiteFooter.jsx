// components/SiteFooter.jsx
export default function SiteFooter() {
  return (
    <footer className="section" style={{paddingTop:24, paddingBottom:24}}>
      <div className="container" style={{display:'grid', gap:16}}>
        <div className="card" style={{display:'grid', gap:8}}>
          <strong>Contact</strong>
          <div className="small">
            Support: <a href="mailto:helpdesk@liason.org">helpdesk@liason.org</a>
          </div>
          <div className="small">
            Billing: <a href="mailto:billing@liason.org">billing@liason.org</a>
          </div>
        </div>
        <div className="small" style={{color:'#475569'}}>
          © {new Date().getFullYear()} Liason. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
