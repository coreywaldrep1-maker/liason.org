// components/LanguageSwitcher.jsx
'use client';

import { useEffect, useState } from 'react';
import { LOCALES } from '@/i18n/config';

export default function LanguageSwitcher() {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)liason_lang=([^;]+)/);
    setLang(m ? decodeURIComponent(m[1]) : 'en');
  }, []);

  function onChange(e) {
    const value = e.target.value;
    document.cookie = `liason_lang=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
    window.location.reload();
  }

  return (
    <select
      aria-label="Language"
      value={lang}
      onChange={onChange}
      className="small"
      style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}
    >
      {LOCALES.map(l => (
        <option key={l} value={l}>
          {l.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
