// app/api/i18n/translate-batch/route.js
import { NextResponse } from 'next/server';
import { DEEPL_TARGET } from '@/lib/i18n-common';
import { getDeepLEndpoint } from '@/lib/i18n-deepl';

export const runtime = 'edge';

function mapTarget(code) {
  return DEEPL_TARGET[String(code || '').toLowerCase()] || null;
}

export async function POST(req) {
  try {
    const { texts, targetLang } = await req.json();
    if (!Array.isArray(texts) || !texts.length) {
      return NextResponse.json({ ok: false, error: 'No texts' }, { status: 400 });
    }
    if (!targetLang) {
      return NextResponse.json({ ok: false, error: 'Missing targetLang' }, { status: 400 });
    }

    const deeplTarget = mapTarget(targetLang);
    if (!deeplTarget) {
      return NextResponse.json({ ok: true, translations: texts, note: 'Unsupported by DeepL; returned originals' });
    }

    const key = (process.env.DEEPL_API_KEY || '').trim();
    if (!key) {
      return NextResponse.json({ ok: false, error: 'DEEPL_API_KEY not set' }, { status: 500 });
    }

    const endpoint = getDeepLEndpoint();
    if (!endpoint) {
      return NextResponse.json({ ok: false, error: 'No DeepL endpoint could be determined' }, { status: 500 });
    }

    const form = new URLSearchParams();
    for (const t of texts) form.append('text', t ?? '');
    form.set('target_lang', deeplTarget);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
      cache: 'no-store',
    });

    const raw = await res.text();
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: `DeepL error: ${raw}` }, { status: res.status });
    }

    const data = JSON.parse(raw);
    const translated = (data?.translations || []).map(t => t?.text ?? '');
    return NextResponse.json({ ok: true, translations: translated });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
