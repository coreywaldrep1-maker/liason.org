// lib/i18n-server.js
import { cookies } from 'next/headers';
import { LANG_COOKIE, DEFAULT_LANG } from './i18n-common';

export function getServerLang() {
  try {
    return cookies().get(LANG_COOKIE)?.value || DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}
