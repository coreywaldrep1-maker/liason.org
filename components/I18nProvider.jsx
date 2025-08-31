'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import en from '../i18n/en.json';
import es from '../i18n/es.json';

const catalogs = { en, es };

const I18nCtx = createContext({ lang: 'en', t: (k) => k, setLang: () => {} });

export function I18nProvider({ children }) {
  const [lang, setLang] = useState('en');

  // read saved lang
  useEffect(() => {
    const saved = localStorage.getItem('liason_lang');
    if (saved && catalogs[saved]) setLang(saved);
  }, []);

  const t = useMemo(() => {
    const cat = catalogs[lang] || catalogs.en;
    return (key) => cat[key] ?? key;
  }, [lang]);

  const value = useMemo(() => ({
    lang,
    t,
    setLang: (l) => {
      if (!catalogs[l]) return;
      localStorage.setItem('liason_lang', l);
      setLang(l);
    }
  }), [lang, t]);

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  return useContext(I18nCtx);
}
