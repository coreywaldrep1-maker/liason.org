// app/api/i18n/diag/route.js
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const key = !!process.env.DEEPL_API_KEY;
  const endpoint = process.env.DEEPL_ENDPOINT || 'https://api-free.deepl.com/v2/translate';

  // Try a tiny sample if the key exists
  let sample = null;
  if (key) {
    try {
      const f = new URLSearchParams();
      f.set('text', 'Hello world');
      f.set('target_lang', 'ES');
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: f.toString(),
      });
      const raw = await r.text();
      sample = r.ok ? JSON.parse(raw)?.translations?.[0]?.text : `ERR: ${raw}`;
    } catch (e) {
      sample = `ERR: ${String(e)}`;
    }
  }

  return NextResponse.json({
    ok: true,
    deepl_key_present: key,
    endpoint,
    sample: key ? sample : 'No key present',
  });
}
