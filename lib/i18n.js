// lib/i18n.js
import { cookies, headers } from 'next/headers';

export const DEFAULT_LANG = 'en';
export const SUPPORTED = ['en','es','fr','de','pt','it','zh','ja','ko','ar','hi'];

export function getLang() {
  // priority: ?lang=xx -> cookie -> Accept-Language -> default
  const h = headers();
  const url = h.get('x-pathname') || '';
  let fromQuery = null;
  try {
    const u = new URL(url, 'http://x');
    fromQuery = u.searchParams.get('lang');
  } catch (_){/* noop */}
  if (fromQuery && SUPPORTED.includes(fromQuery)) return fromQuery;

  const c = cookies().get('lang')?.value;
  if (c && SUPPORTED.includes(c)) return c;

  const al = h.get('accept-language') || '';
  const guess = al.split(',')[0].split('-')[0];
  if (SUPPORTED.includes(guess)) return guess;

  return DEFAULT_LANG;
}

export function toDeepL(lang){
  // DeepL expects uppercase codes; EN-US/EN-GB optional; keep it simple.
  const up = (lang || 'en').toUpperCase();
  if (up === 'EN') return 'EN';
  return up;
}
