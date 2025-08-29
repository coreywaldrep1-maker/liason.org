'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PaidGate({ children, redirectTo = '/checkout/us/i-129f' }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    try {
      const hasLocal = typeof window !== 'undefined' && localStorage.getItem('i129f_paid') === 'true';
      const hasCookie = typeof document !== 'undefined'
        && document.cookie.split('; ').some(c => c.startsWith('i129f_paid='));

      if (hasLocal || hasCookie) {
        setAllowed(true);
      } else {
        router.replace(redirectTo);
      }
    } catch {
      router.replace(redirectTo);
    }
  }, [router, redirectTo]);

  if (!allowed) return null; // don’t flash content
  return children;
}
