// lib/i18n-common.js
export const LANG_COOKIE = 'liason_lang';
export const DEFAULT_LANG = 'en';

// Add/remove languages as you like (shown in dropdown & supported targets)
export const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
  { code: 'it', label: 'Italiano' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'ar', label: 'العربية' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ru', label: 'Русский' },
  { code: 'vi', label: 'Tiếng Việt' },
];

// DeepL mapping (target_lang)
export const DEEPL_TARGET = {
  en: 'EN-US',
  es: 'ES',
  fr: 'FR',
  de: 'DE',
  pt: 'PT-BR',
  it: 'IT',
  zh: 'ZH',
  ja: 'JA',
  ko: 'KO',
  ar: 'AR', // available depending on DeepL plan / rollout
  hi: 'HI',
  ru: 'RU',
  vi: 'VI',
};
