'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LANGS, DEFAULT_LANG } from '@/lib/i18n-common';
import { getLangCookie, setLangCookie } from '@/lib/i18n-client';

export default function LanguageSwitcher() {
  const [lang, setLang] = useState(DEFAULT_LANG);
  const router = useRouter();

  useEffect(() => {
    setLang(getLangCookie());
  }, []);

  const onChange = (e) => {
    const code = e.target.value;
    setLang(code);
    setLangCookie(code);
    // Re-render server components to pick up new cookie
    router.refresh();
  };

  return (
    <select
      aria-label="Language"
      value={lang}
      onChange={onChange}
      className="small"
      style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}
    >
      {LANGS.map(l => (
        <option key={l.code} value={l.code}>{l.label}</option>
      ))}
    </select>
  );
}
