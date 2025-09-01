import { NextResponse } from 'next/server';

export const runtime = 'edge'; // fast & fine for fetch()

export async function POST(req) {
  try {
    const { texts, targetLang } = await req.json();

    if (!Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json({ ok: true, map: {} });
    }

    // Choose correct DeepL endpoint (paid = api.deepl.com, free = api-free.deepl.com)
    const base =
      process.env.DEEPL_API_BASE ||
      (process.env.DEEPL_API_KEY?.includes(':fx') || process.env.DEEPL_API_KEY?.startsWith('free-')
        ? 'https://api-free.deepl.com'
        : 'https://api.deepl.com');

    const url = `${base}/v2/translate`;

    // Build form-encoded body (DeepL expects this)
    const body = new URLSearchParams();
    body.set('target_lang', (targetLang || 'EN').toUpperCase());
    for (const t of texts) body.append('text', t);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ ok: false, error: `DeepL error: ${errText}` }, { status: 500 });
    }

    const data = await res.json();
    const out = data?.translations?.map(t => t.text) || [];

    // Map source→translated by index
    const map = {};
    texts.forEach((src, i) => (map[src] = out[i] ?? src));

    return NextResponse.json({ ok: true, map });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
