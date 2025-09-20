// app/api/i18n/translate-batch/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

/** Pick the correct DeepL base URL for the given key.
 *  - Free keys typically end with ":fx" → api-free.deepl.com
 *  - Paid keys → api.deepl.com
 *  You can override with DEEPL_API_BASE if you want.
 */
function pickDeepLBase(apiKey) {
  const envBase = process.env.DEEPL_API_BASE?.trim();
  if (envBase) return envBase.replace(/\/+$/, "");
  // Heuristics for free keys
  if (/:fx$/.test(apiKey) || apiKey.startsWith("fx_")) {
    return "https://api-free.deepl.com";
  }
  return "https://api.deepl.com";
}

async function callDeepLTranslate({ base, apiKey, source, target, texts }) {
  const url = `${base}/v2/translate`;
  const form = new URLSearchParams();
  for (const t of texts) form.append("text", t);
  form.append("target_lang", (target || "EN").toUpperCase());
  if (source && source !== "auto") form.append("source_lang", source.toUpperCase());

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: form.toString(),
  });

  const raw = await res.text(); // always read text first for good error messages
  if (!res.ok) {
    const err = new Error(`DeepL HTTP ${res.status}: ${raw}`);
    err.status = res.status;
    err.raw = raw;
    throw err;
  }

  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error(`DeepL non-JSON: ${raw.slice(0, 200)}`);
  }
  const list = Array.isArray(json.translations) ? json.translations : [];
  return list.map((x) => (x && typeof x.text === "string" ? x.text : ""));
}

export async function POST(req) {
  try {
    const apiKey =
      process.env.DEEPL_API_KEY ||
      process.env.DEEPL_KEY ||
      process.env.NEXT_PUBLIC_DEEPL_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "Missing DEEPL_API_KEY env var" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const source = (body?.source || "en").toString().trim() || "en";
    const target = (body?.target || "en").toString().trim() || "en";
    const items = Array.isArray(body?.items) ? body.items : [];

    if (!items.length) {
      return NextResponse.json({ ok: true, translations: [] });
    }

    // Deduplicate (saves tokens/$)
    const order = [];
    const uniq = new Set();
    for (const s of items) {
      const t = typeof s === "string" ? s : "";
      if (!uniq.has(t)) {
        uniq.add(t);
        order.push(t);
      }
    }

    // Chunk to stay well below limits
    const CHUNK = 45;
    const chunks = [];
    for (let i = 0; i < order.length; i += CHUNK) chunks.push(order.slice(i, i + CHUNK));

    const firstBase = pickDeepLBase(apiKey);
    let base = firstBase;

    // Attempt with chosen base; on specific 403 "Wrong endpoint", flip and retry once
    const results = [];
    for (const c of chunks) {
      try {
        const out = await callDeepLTranslate({ base, apiKey, source, target, texts: c });
        results.push(...out);
      } catch (err) {
        const raw = String(err.raw || "");
        const wrongEndpoint =
          err.status === 403 && /Wrong endpoint/i.test(raw);

        if (wrongEndpoint) {
          // flip host and try once
          base =
            base.includes("api-free.deepl.com")
              ? "https://api.deepl.com"
              : "https://api-free.deepl.com";
          const out = await callDeepLTranslate({ base, apiKey, source, target, texts: c });
          results.push(...out);
        } else {
          // surface real errors (quota, auth, etc.)
          throw err;
        }
      }
    }

    // Map back to original order
    const map = new Map(order.map((s, i) => [s, results[i] || s]));
    const final = items.map((s) => (typeof s === "string" ? map.get(s) || s : ""));

    return NextResponse.json({ ok: true, translations: final, baseUsed: base });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
