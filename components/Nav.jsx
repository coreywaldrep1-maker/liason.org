// components/Nav.jsx
'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Nav() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check auth status on mount
    checkAuth();
  }, []);

  async function checkAuth() {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    setIsLoggedIn(data.ok);
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsLoggedIn(false);
    router.push('/login');
  }

  return (
    <nav>
      {isLoggedIn ? (
        <button onClick={handleLogout}>Log Out</button>
      ) : (
        <a href="/login">Log In</a>
      )}
    </nav>
  );
}
