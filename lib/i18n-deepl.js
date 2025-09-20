// lib/i18n-deepl.js
import { DEEPL_TARGET } from './i18n-common';

/**
 * DeepL helper used by /api/i18n/translate and /api/i18n/translate-batch
 *
 * Env:
 *   - DEEPL_API_KEY (required)
 *   - DEEPL_API_URL (optional; default https://api-free.deepl.com/v2 or use https://api.deepl.com/v2 for Pro)
 *   - DEEPL_FORMALITY (optional: "more" | "less" | "default")
 */

const DEFAULT_API_URL = 'https://api-free.deepl.com/v2'; // use https://api.deepl.com/v2 for Pro
const API_URL = process.env.DEEPL_API_URL || DEFAULT_API_URL;
const KEY = process.env.DEEPL_API_KEY;

function requireKey() {
  if (!KEY) {
    throw new Error('DEEPL_API_KEY is missing (set it in your environment)');
  }
}

function headers() {
  requireKey();
  return {
    'Authorization': `DeepL-Auth-Key ${KEY}`,
    'Content-Type': 'application/json',
  };
}

function target(lang) {
  // Map app language (e.g., "en", "es") to DeepL target (e.g., "EN-US", "ES")
  return (DEEPL_TARGET && DEEPL_TARGET[lang]) || 'EN-US';
}

function formalityOpt(formality) {
  const f = (formality || process.env.DEEPL_FORMALITY || '').toLowerCase();
  return f === 'more' || f === 'less' || f === 'default' ? f : undefined;
}

/**
 * Translate a single string.
 * @param {{ text: string, lang: string, formality?: 'more'|'less'|'default' }} params
 * @returns {Promise<string>}
 */
export async function translateText({ text, lang, formality }) {
  if (!text) return '';
  const body = { text: [String(text)], target_lang: target(lang) };
  const f = formalityOpt(formality);
  if (f) body.formality = f;

  const res = await fetch(`${API_URL}/translate`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!res.ok) {
    const msg = await safeText(res);
    throw new Error(`DeepL error ${res.status}: ${msg}`);
  }

  const json = await res.json().catch(() => null);
  return (json && json.translations && json.translations[0] && json.translations[0].text) || '';
}

/**
 * Translate an array of strings.
 * @param {{ texts: string[], lang: string, formality?: 'more'|'less'|'default' }} params
 * @returns {Promise<string[]>}
 */
export async function translateBatch({ texts, lang, formality }) {
  const clean = (texts || []).map(t => (t == null ? '' : String(t)));
  if (!clean.length) return [];

  const body = { text: clean, target_lang: target(lang) };
  const f = formalityOpt(formality);
  if (f) body.formality = f;

  const res = await fetch(`${API_URL}/translate`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!res.ok) {
    const msg = await safeText(res);
    throw new Error(`DeepL error ${res.status}: ${msg}`);
  }

  const json = await res.json().catch(() => null);
  const items = (json && json.translations) || [];
  return items.map(t => (t && t.text) || '');
}

async function safeText(res) {
  try {
    return await res.text();
  } catch {
    return '<no-body>';
  }
}
