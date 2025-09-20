// lib/translate.js
import { cookies } from 'next/headers';
import { LANG_COOKIE, DEFAULT_LANG } from './i18n-common';

const memoryCache = new Map(); // simple per-instance cache

export async function translate(text, lang, key = '') {
  if (!text) return '';
  const target = lang || cookies().get(LANG_COOKIE)?.value || DEFAULT_LANG;
  if (target === 'en') return text;

  const cacheKey = `${target}:${key || text}`;
  if (memoryCache.has(cacheKey)) return memoryCache.get(cacheKey);

  // use your i18n API namespace
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/i18n/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ q: text, target }),
  });

  if (!res.ok) {
    // fall back to original text if API is down or key missing
    return text;
  }
  const data = await res.json();
  const out = data?.text || text;
  memoryCache.set(cacheKey, out);
  return out;
}
