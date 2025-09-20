// components/LanguageSwitcher.jsx
'use client';

import { useEffect, useState } from 'react';
import { LANGS } from '@/lib/i18n-common';

function getLang() {
  const m = document.cookie.match(/(?:^|;\s*)liason_lang=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : 'en';
}

export default function LanguageSwitcher() {
  const [lang, setLang] = useState('en');

  useEffect(() => { setLang(getLang()); }, []);

  async function change(e) {
    const value = e.target.value;
    setLang(value);
    try {
      await fetch('/api/i18n/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang: value }),
        credentials: 'include',
        cache: 'no-store'
      });
    } catch {}
    if (typeof window !== 'undefined') window.location.reload();
  }

  return (
    <select value={lang} onChange={change} aria-label="Language" className="select">
      {LANGS.map(l => (
        <option key={l.code} value={l.code}>{l.label}</option>
      ))}
    </select>
  );
}
