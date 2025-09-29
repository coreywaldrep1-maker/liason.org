// components/I18nProvider.jsx
'use client';
import { createContext, useContext, useMemo, useState } from 'react';

export const I18nContext = createContext({ lang: 'en', setLang: () => {} });
export const useI18n = () => useContext(I18nContext);

export function I18nProvider({ children, initialLang = 'en' }) {
  const [lang, setLang] = useState(initialLang);
  const value = useMemo(() => ({ lang, setLang }), [lang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export default I18nProvider; // default export so `import I18nProvider from ...` works
