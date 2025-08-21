export default function FooterBasic(){
  return (
    <footer style={{borderTop:'1px solid #e2e8f0'}}>
      <div className="container" style={{padding:'28px 0', display:'grid', gap:8}}>
        <div className="small">© {new Date().getFullYear()} Liaison. All rights reserved.</div>
        <div className="small">
          Help: <a href="mailto:help@bridge-way.org">help@bridge-way.org</a> • Billing: <a href="mailto:sales@bridge-way.org">sales@bridge-way.org</a>
        </div>
      </div>
    </footer>
  )
}