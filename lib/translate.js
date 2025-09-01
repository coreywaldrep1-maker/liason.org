// lib/translate.js
import { neon } from '@neondatabase/serverless';
import { toDeepL } from './i18n';

const sql = neon(process.env.DATABASE_URL);

// Server-side cached translate. `id` is a stable key you pass (recommended).
export async function translate(text, lang, id) {
  if (!text) return '';
  if (!lang || lang === 'en') return text;

  const key = id || text.slice(0, 500); // simple deterministic key
  const cached = await sql`
    SELECT dst FROM i18n_cache WHERE k = ${key} AND lang = ${lang} LIMIT 1
  `;
  if (cached.length) return cached[0].dst;

  const endpoint = process.env.DEEPL_API_URL || 'https://api-free.deepl.com/v2/translate';
  const body = new URLSearchParams({
    auth_key: process.env.DEEPL_API_KEY || '',
    text,
    target_lang: toDeepL(lang),
  });

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type':'application/x-www-form-urlencoded' },
    body,
    // ensure server runtime; no edge-specific stuff here
    cache: 'no-store',
  });
  if (!res.ok) {
    // On API hiccup, fall back to original text so pages still render.
    return text;
  }
  const json = await res.json();
  const out = json?.translations?.[0]?.text || text;

  await sql`
    INSERT INTO i18n_cache (k, lang, src, dst)
    VALUES (${key}, ${lang}, ${text}, ${out})
    ON CONFLICT (k, lang) DO UPDATE SET dst = EXCLUDED.dst, updated_at = now()
  `;
  return out;
}
