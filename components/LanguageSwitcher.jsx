'use client';

import { useEffect, useState } from 'react';
import { LANGS, LANG_COOKIE } from '@/lib/i18n-common';

function getLangFromCookie() {
  const m = document.cookie.match(new RegExp(`(?:^|; )${LANG_COOKIE}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : 'en';
}

export default function LanguageSwitcher({ className = '' }) {
  const [lang, setLang] = useState('en');

  useEffect(() => { setLang(getLangFromCookie()); }, []);

  async function change(e) {
    const value = e.target.value;
    setLang(value);
    await fetch('/api/i18n/set', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang: value }),
    });
    // Reload so SSR strings (t/tr) render in the chosen language
    window.location.reload();
  }

  return (
    <select value={lang} onChange={change} aria-label="Language" className={className}>
      {LANGS.map(l => (
        <option key={l.code} value={l.code}>{l.label}</option>
      ))}
    </select>
  );
}
