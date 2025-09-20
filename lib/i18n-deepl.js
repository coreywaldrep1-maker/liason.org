# === Fix lib/i18n-deepl.js and push ===
set -e

# 0) Go to repo root
cd /workspaces/liason.org 2>/dev/null || cd "$(git rev-parse --show-toplevel)"

# 1) Overwrite lib/i18n-deepl.js with clean JS (no shell lines)
mkdir -p lib
cat > lib/i18n-deepl.js <<'EOF'
import { DEEPL_TARGET } from './i18n-common';

const DEFAULT_API_URL = 'https://api-free.deepl.com/v2'; // use https://api.deepl.com/v2 for Pro
const API_URL = process.env.DEEPL_API_URL || DEFAULT_API_URL;
const KEY = process.env.DEEPL_API_KEY;

function headers() {
  if (!KEY) throw new Error('DEEPL_API_KEY is missing');
  return {
    'Authorization': `DeepL-Auth-Key ${KEY}`,
    'Content-Type': 'application/json',
  };
}

function target(lang) {
  return DEEPL_TARGET?.[lang] || 'EN-US';
}

function formalityOpt(formality) {
  const f = (formality || process.env.DEEPL_FORMALITY || '').toLowerCase();
  return f === 'more' || f === 'less' || f === 'default' ? f : undefined;
}

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
  if (!res.ok) throw new Error(`DeepL error ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json?.translations?.[0]?.text ?? '';
}

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
  if (!res.ok) throw new Error(`DeepL error ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const items = json?.translations || [];
  return items.map(t => t?.text ?? '');
}
EOF

# 2) Commit
git add lib/i18n-deepl.js
git commit -m "fix(i18n): replace lib/i18n-deepl.js with valid JS"

# 3) Rebase and push
git fetch origin
git pull --rebase origin main
git push origin main

# 4) Optional: quick local sanity check
npm run build || true
