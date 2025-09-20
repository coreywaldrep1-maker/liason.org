# === One-paste fix: add missing DeepL helper + API routes, rebase, push ===
set -e

# 0) Go to repo root
cd /workspaces/liason.org 2>/dev/null || cd "$(git rev-parse --show-toplevel)"

# 1) Create/overwrite DeepL helper
mkdir -p lib
cat > lib/i18n-deepl.js <<'EOF'
import { DEEPL_TARGET } from './i18n-common';

const DEFAULT_API_URL = 'https://api-free.deepl.com/v2';
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
  return DEEPL_TARGET[lang] || 'EN-US';
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

# 2) Ensure API routes exist (create if missing)
mkdir -p app/api/i18n/set app/api/i18n/translate app/api/i18n/translate-batch

cat > app/api/i18n/set/route.js <<'EOF'
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { LANG_COOKIE, DEFAULT_LANG } from '@/lib/i18n-common';

function cookieFor(lang) {
  const code = (lang || DEFAULT_LANG).trim();
  const maxAge = 60 * 60 * 24 * 365;
  return `${LANG_COOKIE}=${encodeURIComponent(code)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export async function GET(req) {
  const url = new URL(req.url);
  const lang = url.searchParams.get('lang') || DEFAULT_LANG;
  const res = NextResponse.json({ ok: true, lang });
  res.headers.set('Set-Cookie', cookieFor(lang));
  return res;
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const lang = body?.lang || DEFAULT_LANG;
  const res = NextResponse.json({ ok: true, lang });
  res.headers.set('Set-Cookie', cookieFor(lang));
  return res;
}
EOF

cat > app/api/i18n/translate/route.js <<'EOF'
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { translateText } from '@/lib/i18n-deepl';

export async function POST(req) {
  try {
    const { text = '', lang = 'en', formality } = await req.json();
    const t = await translateText({ text, lang, formality });
    return NextResponse.json({ ok: true, lang, text: t });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const text = url.searchParams.get('text') || '';
    const lang = url.searchParams.get('lang') || 'en';
    const formality = url.searchParams.get('formality') || undefined;
    const t = await translateText({ text, lang, formality });
    return NextResponse.json({ ok: true, lang, text: t });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }
}
EOF

cat > app/api/i18n/translate-batch/route.js <<'EOF'
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { translateBatch } from '@/lib/i18n-deepl';

export async function POST(req) {
  try {
    const { texts = [], lang = 'en', formality } = await req.json();
    const out = await translateBatch({ texts, lang, formality });
    return NextResponse.json({ ok: true, lang, texts: out });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const lang = url.searchParams.get('lang') || 'en';
    const formality = url.searchParams.get('formality') || undefined;
    const texts = url.searchParams.getAll('text');
    const out = await translateBatch({ texts, lang, formality });
    return NextResponse.json({ ok: true, lang, texts: out });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }
}
EOF

# 3) Commit your changes (stage everything modified/created)
git add -A
git commit -m "i18n: add DeepL helper + i18n routes"

# 4) Rebase onto origin/main and push
git fetch origin
git pull --rebase origin main
git push origin main
echo "✅ Done. If push still fails, run: git status && git log --oneline -n 5"
