// app/api/i18n/translate/route.js
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
    const { text = "", lang = "en" } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ ok: false, error: "Missing 'text' string" }, { status: 400 });
    }

    const body = new URLSearchParams();
    body.set("text", text);
    body.set("target_lang", lang.toUpperCase());

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
    if (!r.ok || !j.translations || !j.translations[0]) {
      return NextResponse.json(
        { ok: false, error: `DeepL error: ${JSON.stringify(j)}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, translation: j.translations[0].text });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
