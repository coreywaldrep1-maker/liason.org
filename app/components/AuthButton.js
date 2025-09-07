'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function AuthButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Function to check if user is logged in
  async function checkAuthStatus() {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      const data = await res.json();
      setIsLoggedIn(data.ok);
    } catch (error) {
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle logout
  async function handleLogout() {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        setIsLoggedIn(false);
        // Clear any local storage or state
        localStorage.removeItem('user');
        // Force a hard redirect to login
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle login click
  function handleLoginClick() {
    window.location.href = '/login';
  }

  if (isLoading) {
    return <button className="btn" disabled>Loading...</button>;
  }

  return (
    <button 
      onClick={isLoggedIn ? handleLogout : handleLoginClick}
      className="btn"
      disabled={isLoading}
    >
      {isLoggedIn ? 'Log Out' : 'Log In'}
    </button>
  );
}
