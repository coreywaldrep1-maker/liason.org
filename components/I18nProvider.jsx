// components/I18nProvider.jsx
'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const I18nCtx = createContext({ t: (k) => k, lang: 'en', setLang: () => {} });

export function I18nProvider({ children }) {
  const [lang, setLang] = useState('en');

  // hydrate from localStorage if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lang');
      if (saved) setLang(saved);
    } catch {}
  }, []);

  const value = useMemo(() => {
    const t = (key) => key; // your real translation lookup can go here
    return { t, lang, setLang };
  }, [lang]);

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

// also provide a default export (the build error complained it was missing)
export default I18nProvider;

// helper hook (optional)
export function useI18n() {
  return useContext(I18nCtx);
}
