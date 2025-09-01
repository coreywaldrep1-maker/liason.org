// lib/i18n.js
import { cookies } from 'next/headers';

export const LANG_COOKIE = 'liason_lang';
export const DEFAULT_LANG = 'en';

export function getLang() {
  // Using cookies() makes the page dynamic automatically in Next.js App Router
  const c = cookies().get(LANG_COOKIE)?.value;
  return c || DEFAULT_LANG;
}

export const SUPPORTED = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
  { code: 'it', label: 'Italiano' },
];
