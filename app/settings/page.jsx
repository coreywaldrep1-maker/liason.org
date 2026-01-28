// app/settings/page.jsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState(null);
  const [err, setErr] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/account/settings', { cache: 'no-store', credentials: 'include' });
        const j = await r.json();
        if (!cancelled) {
          if (j?.ok) setInfo(j);
          else setErr(j?.error || 'Unable to load settings.');
        }
      } catch (e) {
        if (!cancelled) setErr(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function deleteAccount() {
    if (confirmText.trim().toUpperCase() !== 'DELETE') return;
    setDeleting(true);
    setErr('');
    try {
      const r = await fetch('/api/account/delete', { method: 'POST', credentials: 'include' });
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error || 'Delete failed');
      window.location.href = '/';
    } catch (e) {
      setErr(String(e));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="section" data-i18n-scan>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-3 text-slate-600">Loading…</p>
      </main>
    );
  }

  if (!info?.ok) {
    return (
      <main className="section" data-i18n-scan>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-3 text-slate-600">
          You must be logged in to view settings. <Link href="/login" className="underline">Log in</Link>
        </p>
        {err ? <p className="mt-3 text-rose-600">{err}</p> : null}
      </main>
    );
  }

  const joined = info.joinedAt ? new Date(info.joinedAt).toLocaleString() : 'Unknown';
  const paidText = info.paid?.i129f ? 'I-129F Wizard (paid)' : 'Not paid';

  return (
    <main className="section" data-i18n-scan>
      <h1 className="text-2xl font-semibold">Settings</h1>

      {err ? <p className="mt-3 text-rose-600">{err}</p> : null}

      <div className="card mt-4">
        <h2 className="text-lg font-semibold">Account</h2>
        <div className="mt-3 grid gap-2 text-sm">
          <div><span className="text-slate-600">Email:</span> <span className="font-medium">{info.email}</span></div>
          <div><span className="text-slate-600">Joined:</span> <span className="font-medium">{joined}</span></div>
        </div>
      </div>

      <div className="card mt-4">
        <h2 className="text-lg font-semibold">Paid for</h2>
        <p className="mt-2 text-sm text-slate-700">{paidText}</p>
        {!info.paid?.i129f && (
          <p className="mt-2 text-sm">
            <Link className="underline" href="/checkout/us/i-129f">Go to checkout</Link>
          </p>
        )}
      </div>

      <div className="card mt-4 border border-rose-200">
        <h2 className="text-lg font-semibold text-rose-700">Delete account</h2>
        <p className="mt-2 text-sm text-slate-700">
          This will remove your account and your saved I-129F data.
        </p>

        <div className="mt-3 grid gap-2">
          <label className="text-sm text-slate-700">
            Type <span className="font-semibold">DELETE</span> to confirm
          </label>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
          />
          <button
            className="btn"
            style={{ borderColor: '#fecaca', color: '#b91c1c', background: '#fff' }}
            disabled={deleting || confirmText.trim().toUpperCase() !== 'DELETE'}
            onClick={deleteAccount}
          >
            {deleting ? 'Deleting…' : 'Delete account'}
          </button>
        </div>
      </div>
    </main>
  );
}
