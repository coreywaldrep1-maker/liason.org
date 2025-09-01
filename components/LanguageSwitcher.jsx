'use client';
import { useState, useEffect } from 'react';

const OPTIONS = [
  { code:'en', label:'English' },
  { code:'es', label:'Español' },
  { code:'fr', label:'Français' },
  { code:'de', label:'Deutsch' },
  { code:'pt', label:'Português' },
  { code:'it', label:'Italiano' },
  { code:'zh', label:'中文' },
  { code:'ja', label:'日本語' },
  { code:'ko', label:'한국어' },
  { code:'ar', label:'العربية' },
  { code:'hi', label:'हिन्दी' },
];

export default function LanguageSwitcher() {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)lang=([^;]+)/);
    if (m) setLang(decodeURIComponent(m[1]));
  }, []);

  function onChange(e) {
    const val = e.target.value;
    setLang(val);
    // set cookie for 1 year, strict path
    document.cookie = `lang=${encodeURIComponent(val)}; Max-Age=${60*60*24*365}; Path=/; SameSite=Lax`;
    window.location.reload();
  }

  return (
    <select value={lang} onChange={onChange} aria-label="Language">
      {OPTIONS.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
    </select>
  );
}
