// app/api/i18n/translate-batch/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

const API_KEY = process.env.DEEPL_API_KEY;
const API_HOST = process.env.DEEPL_API_HOST || "api-free.deepl.com"; // set to 'api.deepl.com' on paid

export async function POST(req) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { ok: false, error: "DEEPL_API_KEY is missing" },
        { status: 500 }
      );
    }
    const { items = [], lang = "en" } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { ok: true, translations: [] } // nothing to do
      );
    }

    const body = new URLSearchParams();
    items.forEach((t) => body.append("text", String(t)));
    body.set("target_lang", String(lang).toUpperCase());

    const r = await fetch(`https://${API_HOST}/v2/translate`, {
      method: "POST",
      headers: {
        "Authorization": `DeepL-Auth-Key ${API_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    });

    const j = await r.json().catch(() => ({}));
    if (!r.ok || !Array.isArray(j.translations)) {
      return NextResponse.json(
        { ok: false, error: `DeepL error: ${JSON.stringify(j)}` },
        { status: 502 }
      );
    }

    // DeepL keeps order; map to a simple string array
    const out = j.translations.map((t) => t.text);
    return NextResponse.json({ ok: true, translations: out });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
