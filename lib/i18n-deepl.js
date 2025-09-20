// lib/i18n-deepl.js
/**
 * Small DeepL helper: picks the correct endpoint for your key.
 * - Free keys usually end with ":fx"  -> api-free.deepl.com
 * - Pro keys                          -> api.deepl.com
 * You can still override with DEEPL_ENDPOINT if you want.
 */
export function getDeepLEndpoint() {
  const envOverride = (process.env.DEEPL_ENDPOINT || '').trim();
  if (envOverride) return envOverride;

  const key = (process.env.DEEPL_API_KEY || '').trim();
  if (!key) return null;

  const isFree = /:fx$/.test(key);
  return isFree
    ? 'https://api-free.deepl.com/v2/translate'
    : 'https://api.deepl.com/v2/translate';
}
