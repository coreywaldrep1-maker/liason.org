// lib/i18n-ssr.js
import { headers, cookies } from 'next/headers';
import { LANG_COOKIE, DEFAULT_LANG } from './i18n-common';

function originFromHeaders() {
  const h = headers();
  const proto = h.get('x-forwarded-proto') || 'http';
  const host  = h.get('x-forwarded-host') || h.get('host');
  return `${proto}://${host}`;
}

export function getRequestLang() {
  try {
    return cookies().get(LANG_COOKIE)?.value || DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

/** Translate a single string on the server */
export async function t(s, lang = getRequestLang()) {
  if (!s || typeof s !== 'string') return '';
  if (lang === 'en') return s;
  const origin = originFromHeaders();
  try {
    const res = await fetch(`${origin}/api/i18n/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ q: s, target: lang }),
    });
    const data = await res.json().catch(() => null);
    if (data?.ok && data.text) return data.text;
  } catch {}
  return s;
}

/** Translate multiple strings on the server */
export async function tr(arr, lang = getRequestLang()) {
  if (!Array.isArray(arr) || !arr.length) return [];
  if (lang === 'en') return arr;
  const origin = originFromHeaders();
  try {
    const res = await fetch(`${origin}/api/i18n/translate-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ texts: arr, targetLang: lang }),
    });
    const data = await res.json().catch(() => null);
    if (data?.ok && Array.isArray(data.translations)) return data.translations;
  } catch {}
  return arr;
}
