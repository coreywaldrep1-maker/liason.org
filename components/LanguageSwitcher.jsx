'use client';

import { useEffect, useState } from 'react';

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
    await fetch('/api/i18n/set', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang: value })
    });
    // reload so SSR translations apply everywhere
    window.location.reload();
  }

  return (
    <select value={lang} onChange={change} aria-label="Language">
      <option value="en">English</option>
      <option value="es">Español</option>
      <option value="fr">Français</option>
      <option value="de">Deutsch</option>
      <option value="pt">Português</option>
      <option value="it">Italiano</option>
      <option value="zh">中文</option>
      <option value="ar">العربية</option>
      <option value="hi">हिन्दी</option>
      <option value="ru">Русский</option>
      {/* add/remove as you wish */}
    </select>
  );
}
