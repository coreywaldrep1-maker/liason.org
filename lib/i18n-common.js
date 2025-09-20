// lib/i18n-common.js
export const LANG_COOKIE = 'liason_lang';
export const DEFAULT_LANG = 'en';

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

// DeepL target codes (add more if you enable them on your plan)
export const DEEPL_TARGET = {
  en: 'EN',
  es: 'ES',
  fr: 'FR',
  de: 'DE',
  pt: 'PT-PT', // or PT-BR
  it: 'IT',
  zh: 'ZH',
  ja: 'JA',
  ar: null, // not supported by DeepL → we’ll passthrough
};
