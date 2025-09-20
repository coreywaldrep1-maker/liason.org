// app/api/i18n/diag/route.js
import { NextResponse } from 'next/server';
import { DEEPL_TARGET } from '@/lib/i18n-common';

export const runtime = 'edge';

export async function GET() {
  const hasKey = !!process.env.DEEPL_API_KEY;
  const endpoint = process.env.DEEPL_ENDPOINT || 'https://api-free.deepl.com/v2/translate';
  const supported = Object.entries(DEEPL_TARGET).map(([k,v]) => `${k}→${v}`);

  let sample = null;
  if (hasKey) {
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
    deepl_key_present: hasKey,
    endpoint,
    supported,
    sample: hasKey ? sample : 'No key present',
  });
}
