import Link from 'next/link'

export const metadata = { title: 'Data Processing Addendum (DPA) | Liaison', description: 'Data roles and processing terms.' }

export default function DpaPage() {
  return (
    <main className="section">
      <div className="container" style={{display:'grid', gap:24}}>
        <h1 style={{fontSize:28, fontWeight:600}}>Data Processing Addendum</h1>
        <div className="card small" style={{display:'grid', gap:8}}>
          <p><strong>Roles.</strong> You are the data controller of your personal data. Liaison acts as a processor to the extent it stores or processes your inputs to provide the service. Payments are processed by PayPal as an independent controller.</p>
          <p><strong>Data scope.</strong> Information you type or upload to prepare forms. You can delete local data at any time via the “Clear local data” control in the wizard.</p>
          <p><strong>Security.</strong> We apply reasonable safeguards. For local privacy, you can set a passphrase to encrypt your answers on your device before export.</p>
          <p><strong>Sub-processors.</strong> Hosting by Vercel; payments by PayPal.</p>
          <p><strong>Contact.</strong> Privacy questions: <a className="underline" href="mailto:help@bridge-way.org">help@bridge-way.org</a>.</p>
        </div>
        <Link href="/policies" className="btn btn-primary">Back to policies</Link>
      </div>
    </main>
  )
}