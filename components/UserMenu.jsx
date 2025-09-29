// components/UserMenu.jsx
'use client';
import { useEffect, useState } from 'react';

export default function UserMenu() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => (r.ok ? r.json() : null))
      .then(setUser)
      .catch(() => {});
  }, []);

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      location.href = '/login';
    }
  }

  return (
    <div className="ml-auto flex items-center gap-3">
      {user ? (
        <>
          <span className="text-sm" data-no-translate>{user.email}</span>
          <button
            onClick={logout}
            className="rounded px-3 py-1 bg-neutral-200 hover:bg-neutral-300"
          >
            Logout
          </button>
        </>
      ) : (
        <a
          href="/login"
          className="rounded px-3 py-1 bg-neutral-200 hover:bg-neutral-300"
        >
          Login
        </a>
      )}
    </div>
  );
}
