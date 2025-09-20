// app/api/i18n/translate-batch/route.js
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req) {
  try {
    const { texts, targetLang } = await req.json();
    if (!Array.isArray(texts) || !texts.length) {
      return NextResponse.json({ ok: false, error: 'No texts' }, { status: 400 });
    }
    if (!targetLang) {
      return NextResponse.json({ ok: false, error: 'Missing targetLang' }, { status: 400 });
    }

    const key = process.env.DEEPL_API_KEY;
    if (!key) {
      return NextResponse.json({ ok: false, error: 'DEEPL_API_KEY not set' }, { status: 500 });
    }

    // DeepL Free endpoint for most keys; Pro users can switch to api.deepl.com if needed
    const endpoint = (process.env.DEEPL_ENDPOINT?.trim() || 'https://api-free.deepl.com/v2/translate');

    const form = new URLSearchParams();
    for (const t of texts) form.append('text', t);
    form.set('target_lang', targetLang.toUpperCase());

    const deepl = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });

    const raw = await deepl.text();
    if (!deepl.ok) {
      return NextResponse.json({ ok: false, error: `DeepL error: ${raw}` }, { status: deepl.status });
    }
    const data = JSON.parse(raw);
    const translated = (data?.translations || []).map(t => t.text ?? '');

    return NextResponse.json({ ok: true, translations: translated });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
