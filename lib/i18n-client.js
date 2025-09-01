// lib/i18n-client.js
import { LANG_COOKIE, DEFAULT_LANG } from './i18n-common';

export function getLangCookie() {
  if (typeof document === 'undefined') return DEFAULT_LANG;
  const m = document.cookie.match(new RegExp(`(?:^|; )${LANG_COOKIE}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : DEFAULT_LANG;
}

export function setLangCookie(code) {
  if (typeof document === 'undefined') return;
  // 1 year
  document.cookie = `${LANG_COOKIE}=${encodeURIComponent(code)}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
}
