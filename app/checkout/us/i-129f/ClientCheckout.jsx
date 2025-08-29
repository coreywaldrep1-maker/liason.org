'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ClientCheckout() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const unlock = async () => {
    try {
      setBusy(true);
      // Mark "paid" on this browser (localStorage)
      localStorage.setItem('i129f_paid', 'true');
      // And also set a cookie the server can see on navigation
      document.cookie = "i129f_paid=1; path=/; max-age=2592000; samesite=lax";

      // Go straight to the tool
      router.push('/flow/us/i-129f');
    } catch (e) {
      console.error('Test unlock failed', e);
      alert('Could not unlock test mode. See console for details.');
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ display: 'grid', gap: 12 }}>
      <h2 style={{ margin: 0 }}>Try the tool (test mode)</h2>
      <p className="small">
        Checkout is temporarily disabled. Click below to unlock the I-129F tool on this device.
        (This does not charge you and only works on this browser.)
      </p>
      <button className="btn btn-primary" onClick={unlock} disabled={busy}>
        {busy ? 'Unlocking…' : 'Use the tool (test mode)'}
      </button>
    </div>
  );
}
