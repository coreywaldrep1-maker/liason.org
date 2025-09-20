// lib/i18n-common.js
export const LANG_COOKIE = 'liason_lang';
export const DEFAULT_LANG = 'en';

// Languages you want to show in the UI (you can keep Arabic/Hindi for future,
// but DeepL doesn't support them; we’ll no-op those gracefully)
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
  { code: 'nl', label: 'Nederlands' },
  { code: 'pl', label: 'Polski' },
  { code: 'ru', label: 'Русский' },
  // DeepL UNSUPPORTED examples (we keep them for UI but will no-op translate)
  { code: 'ar', label: 'العربية' },
  { code: 'hi', label: 'हिन्दी' },
];

// DeepL target map: only include supported targets here.
// See: https://developers.deepl.com/docs/resources/supported-languages
export const DEEPL_TARGET = {
  en: 'EN-US', // or EN-GB
  es: 'ES',
  fr: 'FR',
  de: 'DE',
  pt: 'PT-BR', // or PT-PT
  it: 'IT',
  zh: 'ZH',
  ja: 'JA',
  ko: 'KO',
  nl: 'NL',
  pl: 'PL',
  ru: 'RU',
  // add more if you expose them in LANGS:
  // bg: 'BG', cs:'CS', da:'DA', el:'EL', et:'ET', fi:'FI', hu:'HU',
  // id:'ID', lt:'LT', lv:'LV', nb:'NB', ro:'RO', sk:'SK', sl:'SL',
  // sv:'SV', tr:'TR', uk:'UK',
};

// Handy checker
export function isDeepLSupported(code) {
  return !!DEEPL_TARGET[code];
}
