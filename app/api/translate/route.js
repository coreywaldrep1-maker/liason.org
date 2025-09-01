// app/api/translate/route.js
import { NextResponse } from 'next/server';

export const runtime = 'edge'; // fast and fine for this route

export async function POST(req) {
  try {
    const { q, target } = await req.json();
    if (!q || !target) {
      return NextResponse.json({ ok: false, error: 'Missing q or target' }, { status: 400 });
    }

    const key = process.env.DEEPL_API_KEY;
    if (!key) {
      return NextResponse.json({ ok: false, error: 'DEEPL_API_KEY not set' }, { status: 500 });
    }

    // DeepL expects ISO language codes like 'ES', 'FR' etc.
    const deeplTarget = target.toUpperCase();

    const form = new URLSearchParams();
    form.set('text', q);
    form.set('target_lang', deeplTarget);

    const res = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });

    if (!res.ok) {
      const t = await res.text();
      return NextResponse.json({ ok: false, error: `DeepL error: ${t}` }, { status: 500 });
    }

    const data = await res.json();
    const text = data?.translations?.[0]?.text || q;

    return NextResponse.json({ ok: true, text });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
