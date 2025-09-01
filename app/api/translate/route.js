// app/api/translate/route.js
// Runtime: Node (NOT edge) to keep it simple and avoid "crypto" issues.
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

function pickHost() {
  return process.env.DEEPL_API_HOST?.trim() || 'https://api-free.deepl.com';
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    let { text, target } = body;

    if (typeof text === 'undefined' || text === null) {
      return NextResponse.json({ ok: false, error: 'Missing "text"' }, { status: 400 });
    }

    // Accept string or string[]
    const texts = Array.isArray(text) ? text : [String(text)];
    const cookieStore = cookies();
    const cookieLang = cookieStore.get('liason_lang')?.value || 'en';

    const targetLang = (target || cookieLang || 'en').toUpperCase();

    // If target is English, or all texts are empty/plain, return original (no cost)
    if (targetLang === 'EN' || texts.every(t => !t || !t.trim())) {
      return NextResponse.json({ ok: true, translations: texts });
    }

    const apiKey = process.env.DEEPL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'DEEPL_API_KEY missing' }, { status: 500 });
    }

    // Build form body per DeepL docs: multiple "text" fields
    const params = new URLSearchParams();
    texts.forEach((t) => params.append('text', t));
    params.append('target_lang', targetLang);

    const host = pickHost();
    const res = await fetch(`${host}/v2/translate`, {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      return NextResponse.json({ ok: false, error: `DeepL error: ${res.status} ${errText}` }, { status: 502 });
    }

    const data = await res.json();
    const translations = (data.translations || []).map((t) => t.text);

    // Fallback safety
    if (!translations.length) return NextResponse.json({ ok: true, translations: texts });

    return NextResponse.json({ ok: true, translations });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
