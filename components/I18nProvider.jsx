// components/I18nProvider.jsx
'use client';

import { createContext, useContext, useMemo } from 'react';

const I18nCtx = createContext({ t: (k) => k, locale: 'en' });

export function I18nProvider({ dict, initialLocale, children }) {
  const value = useMemo(
    () => ({ t: (k) => (dict?.[k] ?? k), locale: initialLocale || 'en' }),
    [dict, initialLocale]
  );
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  return useContext(I18nCtx);
}
