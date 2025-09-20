// app/api/i18n/translate/route.js
import { NextResponse } from 'next/server';
import { DEEPL_TARGET } from '@/lib/i18n-common';
import { getDeepLEndpoint } from '@/lib/i18n-deepl';

export const runtime = 'edge';

function mapTarget(code) {
  return DEEPL_TARGET[String(code || '').toLowerCase()] || null;
}

export async function POST(req) {
  try {
    const { q, target } = await req.json();
    if (!q || !target) {
      return NextResponse.json({ ok: false, error: 'Missing q or target' }, { status: 400 });
    }

    const deeplTarget = mapTarget(target);
    if (!deeplTarget) {
      return NextResponse.json({ ok: true, text: q, note: 'Unsupported by DeepL; returned original' });
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
    form.set('text', q);
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
    const text = data?.translations?.[0]?.text ?? q;
    return NextResponse.json({ ok: true, text });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
