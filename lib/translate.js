// lib/translate.js
import { cookies } from 'next/headers';
import { LANG_COOKIE, DEFAULT_LANG } from './i18n';

const memoryCache = new Map(); // simple in-memory cache per server instance

export async function translate(text, lang, key = '') {
  if (!text) return '';
  const target = lang || cookies().get(LANG_COOKIE)?.value || DEFAULT_LANG;
  if (target === 'en') return text;

  const cacheKey = `${target}:${key || text}`;
  if (memoryCache.has(cacheKey)) return memoryCache.get(cacheKey);

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/translate`, {
    method: 'POST',
    body: JSON.stringify({ q: text, target, key }), // key is optional but helps reuse
    headers: { 'Content-Type': 'application/json' },
    // IMPORTANT: don't cache per Vercel edge/prod
    cache: 'no-store',
  });
  if (!res.ok) return text;

  const data = await res.json();
  const out = data?.text || text;
  memoryCache.set(cacheKey, out);
  return out;
}
