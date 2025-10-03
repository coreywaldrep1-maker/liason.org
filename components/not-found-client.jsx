// components/not-found-client.jsx
'use client';
import { useState } from 'react';

export default function NotFoundClient() {
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <main style={{ maxWidth: 720, margin: '4rem auto', padding: '0 1rem' }}>
      <h1 style={{ fontSize: 28, fontWeight: 600 }}>Page not found</h1>

      <button onClick={() => setDetailsOpen(v => !v)} style={{ marginTop: 16 }}>
        {detailsOpen ? 'Hide details' : 'Show details'}
      </button>

      {detailsOpen && <p style={{ marginTop: 12 }}>Extra info…</p>}

      <a href="/" style={{ marginTop: 24, display: 'inline-block', textDecoration: 'underline' }}>
        Go home
      </a>
    </main>
  );
}
