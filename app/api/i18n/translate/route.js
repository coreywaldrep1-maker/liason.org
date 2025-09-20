// app/api/i18n/translate/route.js
import { NextResponse } from 'next/server';
import { DEEPL_TARGET, isDeepLSupported } from '@/lib/i18n-common';

export const runtime = 'edge';

function mapTarget(code) {
  return DEEPL_TARGET[code] || null;
}

export async function POST(req) {
  try {
    const { q, target } = await req.json();

    if (!q || !target) {
      return NextResponse.json({ ok: false, error: 'Missing q or target' }, { status: 400 });
    }

    // If DeepL doesn’t support this language, no-op gracefully
    const deeplTarget = mapTarget(String(target).toLowerCase());
    if (!deeplTarget) {
      return NextResponse.json({ ok: true, text: q, note: 'Unsupported by DeepL; returned original' });
    }

    const key = process.env.DEEPL_API_KEY;
    if (!key) {
      return NextResponse.json({ ok: false, error: 'DEEPL_API_KEY not set' }, { status: 500 });
    }

    const endpoint = (process.env.DEEPL_ENDPOINT?.trim() || 'https://api-free.deepl.com/v2/translate');

    const form = new URLSearchParams();
    form.set('text', q);
    form.set('target_lang', deeplTarget);

    const deepl = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
      cache: 'no-store',
    });

    const raw = await deepl.text();
    if (!deepl.ok) {
      return NextResponse.json({ ok: false, error: `DeepL error: ${raw}` }, { status: deepl.status });
    }
    const data = JSON.parse(raw);
    const text = data?.translations?.[0]?.text ?? q;

    return NextResponse.json({ ok: true, text });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
