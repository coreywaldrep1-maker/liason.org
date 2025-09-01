// app/api/translate/route.js
import { NextResponse } from 'next/server';

export const runtime = 'edge'; // fast & fine for this API route

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

    // If your key ends with ":fx", it's a FREE key → use api-free.
    const endpoint = key.endsWith(':fx')
      ? 'https://api-free.deepl.com/v2/translate'
      : 'https://api.deepl.com/v2/translate';

    // Use form params and include the key as "auth_key" (DeepL’s preferred method)
    const form = new URLSearchParams();
    form.set('auth_key', key);
    form.set('text', q);
    form.set('target_lang', target.toUpperCase()); // e.g., 'ES', 'FR', 'DE', 'EN', 'PT', 'IT'

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });

    const raw = await res.text();
    if (!res.ok) {
      // Bubble up DeepL’s message so you can see what’s wrong
      return NextResponse.json({ ok: false, error: `DeepL error: ${raw}` }, { status: res.status });
    }

    const data = JSON.parse(raw);
    const text = data?.translations?.[0]?.text ?? q;
    return NextResponse.json({ ok: true, text });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
