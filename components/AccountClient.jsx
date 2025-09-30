// components/AccountClient.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AccountClient() {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setUser(data?.user || null);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const handleLogin = () => router.push('/login');
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.refresh();
  };

  return (
    <div className="relative">
      <button
        aria-label="Account menu"
        className="inline-flex items-center justify-center w-10 h-10 rounded-full border hover:bg-gray-50"
        onClick={() => setOpen((v) => !v)}
      >
        {/* user icon */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a7.5 7.5 0 0115 0" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl border bg-white shadow-lg z-50">
          {user ? (
            <div className="py-1">
              <div className="px-4 py-2 text-sm text-gray-600 truncate">
                {user.email || 'Signed in'}
              </div>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="py-1">
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                onClick={handleLogin}
              >
                Log in
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
