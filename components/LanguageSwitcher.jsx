'use client';

import { useEffect, useState } from 'react';
import { SUPPORTED, LANG_COOKIE } from '@/lib/i18n';
import { useRouter } from 'next/navigation';

export default function LanguageSwitcher() {
  const router = useRouter();
  const [val, setVal] = useState('en');

  useEffect(() => {
    const m = document.cookie.match(new RegExp(`${LANG_COOKIE}=([^;]+)`));
    setVal(m ? decodeURIComponent(m[1]) : 'en');
  }, []);

  const change = (e) => {
    const next = e.target.value;
    document.cookie = `${LANG_COOKIE}=${encodeURIComponent(next)}; Path=/; Max-Age=31536000; SameSite=Lax`;
    // Reload server components (so translations re-fetch)
    router.refresh();
  };

  return (
    <select className="small" value={val} onChange={change}
      style={{ padding:'6px 10px', border:'1px solid #e2e8f0', borderRadius:8, background:'#fff' }}>
      {SUPPORTED.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
    </select>
  );
}
