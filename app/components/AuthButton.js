'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function AuthButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  // Check auth status when component mounts
  useEffect(() => {
    checkAuthStatus();
  }, []);

  async function checkAuthStatus() {
    // Check if we have an auth cookie
    const hasAuthCookie = document.cookie.includes('liason_token=');
    setIsLoggedIn(hasAuthCookie);
  }

  async function handleLogout() {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (res.ok) {
        // Clear auth state
        setIsLoggedIn(false);
        // Remove cookie manually as backup
        document.cookie = 'liason_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        // Redirect to login page
        router.push('/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  return (
    <button
      onClick={isLoggedIn ? handleLogout : () => router.push('/login')}
      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      {isLoggedIn ? 'Log Out' : 'Log In'}
    </button>
  );
}
