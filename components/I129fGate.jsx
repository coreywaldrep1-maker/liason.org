// components/I129fGate.jsx
'use client';

import { useEffect, useState } from 'react';

export default function I129fGate({ PaidView, PrePayView }) {
  const [state, setState] = useState({ loading: true, loggedIn: false, paid: false });

  useEffect(() => {
    fetch('/api/profile/status?product=i129f')
      .then(r => r.json())
      .then(data => setState({ loading: false, loggedIn: data.loggedIn, paid: data.paid }))
      .catch(() => setState({ loading: false, loggedIn: false, paid: false }));
  }, []);

  if (state.loading) {
    return (
      <div className="card">
        <p className="small">Checking your status…</p>
      </div>
    );
  }

  if (!state.loggedIn) {
    return (
      <div className="card">
        <h3 style={{marginTop:0}}>Please sign in</h3>
        <p className="small">Create an account or sign in to start your I-129F profile.</p>
        <a className="btn btn-primary" href="/account">Sign in / Create account</a>
      </div>
    );
  }

  if (!state.paid) {
    // Show the “How it works • 3 steps” and a button to checkout
    return <PrePayView />;
  }

  // Paid — render the tool (AI, Wizard, Download)
  return <PaidView />;
}
