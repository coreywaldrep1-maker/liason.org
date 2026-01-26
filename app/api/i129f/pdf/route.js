// app/api/i129f/pdf/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { fillI129FPdf } from "@/lib/pdf/fillI129F";

async function fetchJsonOrNull(url, cookie) {
  try {
    const res = await fetch(url, { headers: cookie ? { cookie } : {}, cache: "no-store" });
    if (!res.ok) return null;
    return await res.json().catch(() => null);
  } catch {
    return null;
  }
}

function extractSaved(json) {
  if (!json || typeof json !== "object") return null;
  if (json.data && typeof json.data === "object") return json.data;
  if (json.saved && typeof json.saved === "object") return json.saved;
  if (json.i129f && typeof json.i129f === "object") return json.i129f;
  if (json.form && typeof json.form === "object") return json.form;
  return json;
}

async function loadSavedForSession(request) {
  const cookie = request.headers.get("cookie") || "";
  const origin = new URL(request.url).origin;

  // Prefer the same endpoints your wizard uses
  const j1 = await fetchJsonOrNull(`${origin}/api/i129f/load`, cookie);
  const s1 = extractSaved(j1);
  if (s1) return s1;

  const j2 = await fetchJsonOrNull(`${origin}/api/i129f/data`, cookie);
  const s2 = extractSaved(j2);
  if (s2) return s2;

  return null;
}

// ✅ GET is what your wizard link uses: <a href="/api/i129f/pdf">
export async function GET(request) {
  try {
    const saved = await loadSavedForSession(request);
    if (!saved) {
      return NextResponse.json(
        { ok: false, error: "No saved data found for this session. Save the form first." },
        { status: 404 }
      );
    }

    const flatten = request.nextUrl.searchParams.get("flatten") === "1";
    const pdfBytes = await fillI129FPdf(saved, { flatten });

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="i-129f-filled.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || "PDF generation failed" },
      { status: 500 }
    );
  }
}

// Optional POST support if you still want it
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const saved = body?.data || body;

    const flatten = Boolean(body?.flatten);
    const pdfBytes = await fillI129FPdf(saved, { flatten });

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="i-129f-filled.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || "PDF generation failed" },
      { status: 500 }
    );
  }
}
