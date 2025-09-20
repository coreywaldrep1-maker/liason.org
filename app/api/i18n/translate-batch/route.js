// app/api/i18n/translate-batch/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

// Minimal DeepL client (no regex, JSON only)
async function deeplTranslateBatch({ apiKey, source, target, texts }) {
  const url = "https://api-free.deepl.com/v2/translate"; // or https://api.deepl.com/v2/translate for paid
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

  // Always parse as text first to avoid browser misinterpreting errors
  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`DeepL HTTP ${res.status}: ${raw}`);
  }

  // Parse JSON safely
  let json;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    throw new Error(`DeepL non-JSON: ${raw.slice(0, 200)}`);
  }

  const list = Array.isArray(json.translations) ? json.translations : [];
  return list.map((x) => (x && typeof x.text === "string" ? x.text : ""));
}

export async function POST(req) {
  try {
    const apiKey = process.env.DEEPL_API_KEY || process.env.DEEPL_KEY || process.env.NEXT_PUBLIC_DEEPL_KEY;
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

    // Deduplicate to reduce usage
    const order = [];
    const seen = new Set();
    for (const s of items) {
      const t = typeof s === "string" ? s : "";
      if (!seen.has(t)) {
        seen.add(t);
        order.push(t);
      }
    }

    const CHUNK = 45; // keep safe margins
    const chunks = [];
    for (let i = 0; i < order.length; i += CHUNK) chunks.push(order.slice(i, i + CHUNK));

    const results = [];
    for (const c of chunks) {
      const out = await deeplTranslateBatch({ apiKey, source, target, texts: c });
      results.push(...out);
    }

    // Map back to original items
    const map = new Map(order.map((s, i) => [s, results[i] || s]));
    const final = items.map((s) => (typeof s === "string" ? map.get(s) || s : ""));

    return NextResponse.json({ ok: true, translations: final });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
