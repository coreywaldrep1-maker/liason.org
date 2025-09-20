// lib/i18n-common.js
export const LANG_COOKIE = 'liason_lang';
export const DEFAULT_LANG = 'en';

// Languages you want to expose in the UI
export const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
  { code: 'it', label: 'Italiano' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'ar', label: 'العربية' },
];

// DeepL target codes (only languages DeepL supports get a code)
export const DEEPL_TARGET = {
  en: 'EN',
  es: 'ES',
  fr: 'FR',
  de: 'DE',
  pt: 'PT-PT', // or 'PT-BR'
  it: 'IT',
  zh: 'ZH',
  ja: 'JA',
  // DeepL does not support Arabic (ar) → we leave it null so we just passthrough
  ar: null,
};
