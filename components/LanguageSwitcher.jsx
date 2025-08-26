'use client';
import { useEffect, useState } from 'react';

const LANGS = [
  { code:'en', label:'English' },
  { code:'es', label:'Español' },
  { code:'fr', label:'Français' },
  { code:'de', label:'Deutsch' },
  { code:'pt', label:'Português' },
  { code:'hi', label:'हिंदी' },
  { code:'ar', label:'العربية' },
  { code:'zh', label:'中文' },
  { code:'ja', label:'日本語' }
];

export default function LanguageSwitcher() {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const saved = localStorage.getItem('liason:lang');
    if (saved) setLang(saved);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('liason:lang', lang);
      document.documentElement.setAttribute('lang', lang);
    } catch {}
  }, [lang]);

  return (
    <select
      aria-label="Language"
      value={lang}
      onChange={(e)=>setLang(e.target.value)}
      style={{padding:'6px 8px', border:'1px solid #e2e8f0', borderRadius:8}}
    >
      {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
    </select>
  );
}
