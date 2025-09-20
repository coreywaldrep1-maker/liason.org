// app/api/i18n/set/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

const LANG_COOKIE = "liason_lang";

// helper to build a public (non-HttpOnly) cookie so client JS can read it
function langCookie(name, value) {
  // 1 year
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
}

export async function POST(req) {
  try {
    const { lang = "en", redirectTo = null } = await req.json().catch(() => ({}));
    const url = new URL(req.url);
    const res = redirectTo
      ? NextResponse.redirect(new URL(redirectTo, url.origin), { status: 302 })
      : NextResponse.json({ ok: true, lang });

    res.headers.append("Set-Cookie", langCookie(LANG_COOKIE, lang));
    return res;
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 400 });
  }
}

// also support GET for convenience: /api/i18n/set?lang=es&redirectTo=/ (optional)
export async function GET(req) {
  const url = new URL(req.url);
  const lang = url.searchParams.get("lang") || "en";
  const redirectTo = url.searchParams.get("redirectTo");
  const res = redirectTo
    ? NextResponse.redirect(new URL(redirectTo, url.origin), { status: 302 })
    : NextResponse.json({ ok: true, lang });
  res.headers.append("Set-Cookie", langCookie(LANG_COOKIE, lang));
  return res;
}
