// lib/i18n-deepl.js
import { DEEPL_TARGET } from './i18n-common';

// Return the proper DeepL endpoint for the given API key
export function deeplEndpointForKey(key) {
  if (!key) throw new Error('DEEPL_API_KEY is not set');
  // Free keys look like "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx"
  // Pro keys do NOT end with :fx
  const isFree = key.endsWith(':fx');
  return isFree
    ? 'https://api-free.deepl.com/v2/translate'
    : 'https://api.deepl.com/v2/translate';
}

export async function deeplTranslateOne(text, lang, apiKey = process.env.DEEPL_API_KEY) {
  const target = DEEPL_TARGET[lang] || null;
  if (!target) return text; // not supported → passthrough
  const endpoint = deeplEndpointForKey(apiKey);

  const params = new URLSearchParams({
    text,
    target_lang: target,
    source_lang: 'EN', // your source text is English
    preserve_formatting: '1',
    formality: 'prefer_more',
  });

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Authorization': `DeepL-Auth-Key ${apiKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`DeepL error: ${JSON.stringify(data || {})}`);
  return data?.translations?.[0]?.text || text;
}

export async function deeplTranslateMany(texts, lang, apiKey = process.env.DEEPL_API_KEY) {
  const target = DEEPL_TARGET[lang] || null;
  if (!target) return texts; // passthrough if unsupported
  const endpoint = deeplEndpointForKey(apiKey);

  const params = new URLSearchParams({ target_lang: target, source_lang: 'EN', preserve_formatting: '1', formality: 'prefer_more' });
  for (const t of texts) params.append('text', String(t ?? ''));

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Authorization': `DeepL-Auth-Key ${apiKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`DeepL error: ${JSON.stringify(data || {})}`);
  const out = (data?.translations || []).map(x => x?.text ?? '');
  return out.length === texts.length ? out : texts;
}
